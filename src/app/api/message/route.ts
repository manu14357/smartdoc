// Import necessary modules and libraries
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";
import axios from "axios";

import { pdfjs } from "react-pdf";

// Set the PDF.js worker to use a CDN URL to avoid path issues in server environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Define the Message interface for type safety
interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  fileId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Export the POST handler for the API route
export const POST = async (req: NextRequest) => {
  try {
    // Parse the incoming JSON request body
    const body = await req.json();

    // Retrieve the current user session
    const { getUser } = getKindeServerSession();
    const user = getUser();

    // Extract the user ID from the session
    const { id: userId } = user;

    // If no user is found, return an unauthorized response
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // Validate and extract fileId and message from the request body
    const { fileId, message } = SendMessageValidator.parse(body);

    // Fetch the file associated with the fileId and userId from the database
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    // If the file does not exist, return a not found response
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

    // Download and process the PDF content
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });

    // Convert the downloaded PDF data to Uint8Array
    const pdfData = new Uint8Array(pdfResponse.data);

    // Load the PDF document using PDF.js
    const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise;

    let pdfText = "";
    const numPages = pdfDoc.numPages;

    // Extract text from each page of the PDF
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      pdfText += `${pageText}\n`;
    }

    // Prepare a context snippet from the extracted PDF text
    const results = pdfText.substring(0, 2000); // Adjust the length as needed

    // Fetch the previous messages related to the file for context
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

    // Format the previous messages for the NVIDIA API
    const formattedPrevMessages = prevMessages.map((msg: Message) => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.text,
    }));

    const formattedContext = formattedPrevMessages
      .map((msg) => msg.content)
      .join("\n\n");

    // Construct the messages payload for the NVIDIA API
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

    // Call the NVIDIA API with the prepared messages
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
          Authorization: `Bearer YOUR_ACTUAL_API_KEY`, // Replace with your actual API key securely
        },
      }
    );

    // Extract the assistant's reply from the NVIDIA API response
    const completion = response.data.choices[0].message.content;

    // Save the assistant's response to the database
    await db.message.create({
      data: {
        text: completion,
        isUserMessage: false,
        fileId,
        userId,
      },
    });

    // Return the assistant's response to the client
    return new Response(completion);
  } catch (error) {
    console.error("Error processing PDF or calling NVIDIA API:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};