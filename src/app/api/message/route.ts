import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";
import axios from "axios";
import * as pdfjs from "pdfjs-dist";

// Manually set the worker path for pdfjs
import { join } from "path";

if (typeof window !== 'undefined') {
  // For client-side
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} else {
  // For server-side
  pdfjs.GlobalWorkerOptions.workerSrc = join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "build",
    "pdf.worker.min.js",
  );
}


// Define the Message interface
interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  fileId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = getUser();

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { fileId, message } = SendMessageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) return new Response("Not found", { status: 404 });

  // Store the user's message in the database
  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      fileId,
      userId,
    },
  });

  const pdfUrl = file.url;

  try {
    // Step 1: Download the PDF content from the URL
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });

    // Convert the Buffer to Uint8Array
    const pdfData = new Uint8Array(pdfResponse.data);

    // Step 2: Load the PDF document using pdfjs-dist
    const pdfDoc = await pdfjs.getDocument(pdfData).promise;

    let pdfText = "";
    const numPages = pdfDoc.numPages;

    // Step 3: Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      pdfText +=
        textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ") + "\n";
    }

    // Prepare context from the extracted PDF content
    const results = pdfText.substring(0, 2000); // Adjust the length if needed

    // Step 4: Format the previous messages as context for the chat
    const prevMessages: Message[] = (await db.message.findMany({
      where: {
        fileId,
      },
      select: {
        id: true,
        text: true,
        isUserMessage: true,
        fileId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 6,
    })) as Message[];

    const formattedPrevMessages = prevMessages.map((msg: Message) => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.text,
    }));

    const formattedContext = formattedPrevMessages
      .map((msg) => msg.content)
      .join("\n\n");

    // Step 5: Prepare the data for the NVIDIA API request
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers questions based on provided PDF content.",
      },
      {
        role: "user",
        content: `The following content is from a PDF:\n\n${results}\n\nPrevious interactions:\n\n${formattedContext}`,
      },
      { role: "user", content: message },
    ];

    // Step 6: Call NVIDIA API with the context and the message
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "nvidia/llama-3.1-nemotron-70b-instruct",
        messages,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 5024,
      },
      {
        headers: {
          Authorization: `Bearer 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`, // Replace with your actual API key
        },
      },
    );

    const completion = response.data.choices[0].message.content;

    // Save the response from NVIDIA API to the database
    await db.message.create({
      data: {
        text: completion,
        isUserMessage: false,
        fileId,
        userId,
      },
    });

    return new Response(completion);
  } catch (error) {
    console.error("Error processing PDF or calling NVIDIA API:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};
