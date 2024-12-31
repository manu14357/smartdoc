import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";
import axios from "axios";
import { PdfReader } from "pdfreader";

// Access the NVIDIA API key from environment variables
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// Configure Axios with an increased timeout
const axiosInstance = axios.create({
  timeout: 240000, // 30 seconds
});

// Interface representing a message in the database
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

    reader.parseBuffer(buffer, (err: Error | null, item: any) => {
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

// Function to make API calls with retries and exponential backoff
const makeApiCall = async (
  url: string,
  data: any,
  headers: any,
  retries = 3,
  backoff = 3000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosInstance.post(url, data, { headers });
      return response;
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`API call failed. Retrying in ${backoff}ms...`);
        await new Promise((res) => setTimeout(res, backoff));
        backoff *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

// Exported POST handler for processing messages
export const POST = async (req: NextRequest) => {
  try {
    console.log("Received POST request");
    const body = await req.json();
    console.log("Parsed request body");

    const { getUser } = getKindeServerSession();
    const user = getUser();
    const { id: userId } = user;

    if (!userId) {
      console.warn("Unauthorized access attempt");
      return new Response("Unauthorized", { status: 401 });
    }

    const { fileId, message } = SendMessageValidator.parse(body);
    console.log(`Processing fileId: ${fileId} for userId: ${userId}`);

    // Fetch the file from the database
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      console.warn(`File with ID ${fileId} not found for user ${userId}`);
      return new Response("Not found", { status: 404 });
    }

    // Create a new user message in the database
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId,
        userId,
      },
    });
    console.log("User message saved to database");

    // Initialize variable to store parsed PDF text
    let pdfText = "";
    try {
      console.log(`Fetching PDF from URL: ${file.url}`);
      const pdfResponse = await axiosInstance.get(file.url, {
        responseType: "arraybuffer",
      });
      console.log("Fetched PDF successfully");

      const buffer = Buffer.from(pdfResponse.data);
      console.log("Parsing PDF content");
      pdfText = await parsePDF(buffer);
      console.log("Parsed PDF successfully");
    } catch (pdfError) {
      console.error("Error processing PDF:", pdfError);
      return new Response("Failed to process PDF", { status: 500 });
    }

    // Limit the amount of text extracted from the PDF
    const results = pdfText.substring(0, 2000); // Adjust as needed

    // Retrieve previous messages related to the file
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
    console.log("Fetched previous messages from database");

    // Format previous messages for the API request
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

    try {
      console.log("Calling NVIDIA API for chat completion");
      const response = await makeApiCall(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages,
          temperature: 0.5,
          top_p: 1,
          max_tokens: 5024, // Adjust if necessary
        },
        {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        }
      );
      console.log("Received response from NVIDIA API");

      // Validate the response structure
      if (
        response.data &&
        response.data.choices &&
        response.data.choices[0] &&
        response.data.choices[0].message &&
        response.data.choices[0].message.content
      ) {
        const completion = response.data.choices[0].message.content;
        console.log("Parsed completion from NVIDIA API");

        // Save the assistant's response to the database
        await db.message.create({
          data: {
            text: completion,
            isUserMessage: false,
            fileId,
            userId,
          },
        });
        console.log("Assistant message saved to database");

        return new Response(completion);
      } else {
        console.error("Invalid response structure from NVIDIA API");
        throw new Error("Invalid response structure from NVIDIA API");
      }
    } catch (apiError) {
      console.error("Error calling NVIDIA API:", apiError);
      return new Response("Failed to generate response", { status: 500 });
    }
  } catch (error) {
    console.error("General error:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};