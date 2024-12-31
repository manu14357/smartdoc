// Import necessary modules and dependencies
import { db } from "@/db"; // Database instance
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Authentication session handler
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator"; // Validator for incoming messages
import { NextRequest } from "next/server"; // Next.js request object
import axios from "axios"; // HTTP client for making API requests
import { PdfReader } from "pdfreader"; // Library for parsing PDF files
import OpenAI from 'openai';
// Access the NVIDIA API key from environment variables for security
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// Configure Axios with an increased timeout to handle longer API responses
const axiosInstance = axios.create({
  timeout: 240000, // 240 seconds (4 minutes)
});

// Define the structure of a message stored in the database
interface Message {
  id: string;
  text: string;
  isUserMessage: boolean;
  fileId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to parse PDF content using the pdfreader library.
 * @param buffer - The PDF file buffer.
 * @returns A promise that resolves to the extracted text content.
 */
const parsePDF = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    let textContent = "";

    // Parse the PDF buffer
    reader.parseBuffer(buffer, (err: Error | null, item: any) => {
      if (err) {
        reject(err); // Reject the promise if there's an error
      } else if (!item) {
        resolve(textContent); // Resolve with the complete text when parsing is done
      } else if (item.text) {
        textContent += item.text + " "; // Append extracted text
      }
    });
  });
};

/**
 * Function to make API calls with retries and exponential backoff.
 * This helps in handling transient failures by retrying the request.
 * @param url - The API endpoint URL.
 * @param data - The payload to send in the request.
 * @param headers - HTTP headers for the request.
 * @param retries - Number of retry attempts (default is 3).
 * @param backoff - Initial backoff time in milliseconds (default is 3000ms).
 * @returns A promise that resolves to the API response.
 */
const makeApiCall = async (
  url: string,
  data: any,
  headers: any,
  retries = 3,
  backoff = 3000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Make the POST request using the configured Axios instance
      const response = await axiosInstance.post(url, data, { headers });
      return response; // Return the response if successful
    } catch (error) {
      if (i < retries - 1) {
        // Log a warning and wait before retrying
        console.warn(`API call failed. Retrying in ${backoff}ms...`);
        await new Promise((res) => setTimeout(res, backoff));
        backoff *= 2; // Exponentially increase the backoff time
      } else {
        throw error; // Throw the error if all retries fail
      }
    }
  }
};

/**
 * Exported POST handler for processing incoming messages.
 * This function handles the entire workflow from receiving a message
 * to interacting with the NVIDIA API and responding back to the user.
 * @param req - The incoming Next.js request object.
 * @returns A response object containing the API's reply or an error message.
 */
export const POST = async (req: NextRequest) => {
  try {
    console.log("Received POST request");
    const body = await req.json(); // Parse the JSON body of the request
    console.log("Parsed request body");

    const { getUser } = getKindeServerSession(); // Retrieve the authenticated user
    const user = getUser();
    const { id: userId } = user;

    if (!userId) {
      // If there's no authenticated user, respond with unauthorized status
      console.warn("Unauthorized access attempt");
      return new Response("Unauthorized", { status: 401 });
    }

    // Validate and extract fileId and message from the request body
    const { fileId, message } = SendMessageValidator.parse(body);
    console.log(`Processing fileId: ${fileId} for userId: ${userId}`);

    // Fetch the associated file from the database
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      // If the file isn't found, respond with a 404 status
      console.warn(`File with ID ${fileId} not found for user ${userId}`);
      return new Response("Not found", { status: 404 });
    }

    // Save the user's message to the database
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId,
        userId,
      },
    });
    console.log("User message saved to database");

    // Initialize a variable to store the extracted PDF text
    let pdfText = "";
    try {
      console.log(`Fetching PDF from URL: ${file.url}`);
      const pdfResponse = await axiosInstance.get(file.url, {
        responseType: "arraybuffer", // Get the PDF as a binary buffer
      });
      console.log("Fetched PDF successfully");

      const buffer = Buffer.from(pdfResponse.data); // Convert response data to Buffer
      console.log("Parsing PDF content");
      pdfText = await parsePDF(buffer); // Extract text from the PDF
      console.log("Parsed PDF successfully");
    } catch (pdfError) {
      // Handle errors that occur during PDF fetching or parsing
      console.error("Error processing PDF:", pdfError);
      return new Response("Failed to process PDF", { status: 500 });
    }

    // Limit the extracted text to the first 2000 characters
    const results = pdfText.substring(0, 2000); // Adjust this value as needed

    // Retrieve the last 6 messages related to the file from the database
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
        createdAt: "asc", // Order messages by creation date
      },
      take: 6, // Limit to the last 6 messages
    });
    console.log("Fetched previous messages from database");

    // Format the previous messages to fit the NVIDIA API's expected structure
    const formattedPrevMessages = prevMessages.map((msg: Message) => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.text,
    }));

    // Combine previous messages into a single string separated by double newlines
    const formattedContext = formattedPrevMessages
      .map((msg) => msg.content)
      .join("\n\n");

    // Construct the payload for the NVIDIA API, including system instructions and user messages
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
        "https://integrate.api.nvidia.com/v1/chat/completions", // NVIDIA API endpoint
        {
          model: "nvidia/llama-3.1-nemotron-70b-instruct", // Specify the model to use
          messages, // Send the constructed messages payload
          temperature: 0.5, // Controls the randomness of the output
          top_p: 0.7, // Top-p sampling parameter
          stream : true,
          max_tokens: 1024, // Maximum number of tokens in the response
        },
        {
          Authorization: `Bearer ${NVIDIA_API_KEY}`, // Authorization header with API key
          "Content-Type": "application/json", // Specify the content type
        }
      );
      console.log("Received response from NVIDIA API");

      // Validate the structure of the NVIDIA API's response
      if (
        response.data &&
        response.data.choices &&
        response.data.choices[0] &&
        response.data.choices[0].message &&
        response.data.choices[0].message.content
      ) {
        const completion = response.data.choices[0].message.content; // Extract the assistant's reply
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

        return new Response(completion); // Respond to the user with the assistant's reply
      } else {
        // If the response structure is invalid, throw an error
        console.error("Invalid response structure from NVIDIA API");
        throw new Error("Invalid response structure from NVIDIA API");
      }
    } catch (apiError) {
      // Handle errors that occur during the API call
      console.error("Error calling NVIDIA API:", apiError);
      return new Response("Failed to generate response", { status: 500 });
    }
  } catch (error) {
    // Handle any general errors that occur during the request processing
    console.error("General error:", error);
    return new Response("Failed to process the request", { status: 500 });
  }
};