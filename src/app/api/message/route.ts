import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";
import axios from "axios";

// Import PDF.js with node canvas
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { TextItem } from "pdfjs-dist/types/src/display/api";

// Configure PDF.js for Node environment
const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

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

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

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

    // Step 2: Load the PDF document using pdfjs-dist in node mode
    const pdfDoc = await pdfjsLib.getDocument({
      data: pdfData,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      disableFontFace: true, // Disable font loading
      verbosity: 0, // Reduce verbosity
    }).promise;

    let pdfText = "";
    const numPages = pdfDoc.numPages;

    // Step 3: Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      pdfText +=
        textContent.items
          .map((item: any) => (item.str ? item.str : ""))
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

    // Set up the response as a stream
    const encoder = new TextEncoder();
    let fullResponse = "";
    
    // Create a TransformStream to process the streaming response
    const stream = new TransformStream({
      start(controller) {},
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
      },
      flush(controller) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    });
    
    // Create the response writer
    const writer = stream.writable.getWriter();
    
    // Create the response object with appropriate headers for SSE
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
    // Step 6: Call NVIDIA API with streaming enabled
    const axiosResponse = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "meta/llama-3.3-70b-instruct",
        messages,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 5024,
        stream: true, // Enable streaming
      },
      {
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        responseType: 'stream',
      },
    );
    
    // Process the streaming response
    axiosResponse.data.on('data', async (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullResponse += content;
              await writer.write(content);
            }
          } catch (error) {
            console.error('Error parsing streaming response:', error);
          }
        }
      }
    });
    
    axiosResponse.data.on('end', async () => {
      try {
        // Save the complete response to the database when streaming is done
        await db.message.create({
          data: {
            text: fullResponse,
            isUserMessage: false,
            fileId,
            userId,
          },
        });
        
        await writer.close();
      } catch (error) {
        console.error('Error finalizing response:', error);
        await writer.abort(error as Error);
      }
    });
    
    axiosResponse.data.on('error', async (error: Error) => {
      console.error('Stream error:', error);
      await writer.abort(error);
    });

    return response;
  } catch (error) {
    console.error("Error processing PDF or calling NVIDIA API:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};