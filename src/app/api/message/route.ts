import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";
import axios from "axios";
import { PdfReader } from "pdfreader";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  fileId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to parse PDF using pdfreader
const parsePDF = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    let textContent = "";

    reader.parseBuffer(buffer, (err: Error, item: any) => {
      if (err) {
        reject(err);
      } else if (!item) {
        resolve(textContent);
      } else if (item.text) {
        textContent += item.text + " ";
      }
    });
  });
};

export const POST = async (req: NextRequest) => {
  try {
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

    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId,
        userId,
      },
    });

    // PDF processing with error handling
    let pdfText = "";
    try {
      const pdfResponse = await axios.get(file.url, {
        responseType: "arraybuffer",
      });
      
      const buffer = Buffer.from(pdfResponse.data);
      pdfText = await parsePDF(buffer);
      
    } catch (pdfError) {
      console.error("Error processing PDF:", pdfError);
      return new Response("Failed to process PDF", { status: 500 });
    }

    const results = pdfText.substring(0, 2000);

    const prevMessages: Message[] = await db.message.findMany({
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
    });

    const formattedPrevMessages = prevMessages.map((msg: Message) => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.text,
    }));

    const formattedContext = formattedPrevMessages
      .map((msg) => msg.content)
      .join("\n\n");

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

    try {
      const response = await axios.post(
        "https://integrate.api.nvidia.com/v1/chat/completions", // Verify this endpoint
        {
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages,
          temperature: 0.5,
          top_p: 1,
          max_tokens: 5024,
        },
        {
          headers: {
            Authorization: `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const completion = response.data.choices[0].message.content;

      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      });

      return new Response(completion);
    } catch (apiError) {
      console.error("Error calling NVIDIA API:", apiError);
      return new Response("Failed to generate response", { status: 500 });
    }
  } catch (error) {
    console.error("General error:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};