// src/app/api/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';
import { z } from 'zod';
import axios from 'axios';
import * as pdfjs from 'pdfjs-dist';
import { join } from 'path';
import { db } from '@/db'; // Adjust the import path as needed
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator';

// -------------------- Logger Configuration --------------------

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info', // Log level can be adjusted (e.g., 'debug', 'error')
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Logs to the console
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Logs errors to error.log
    new winston.transports.File({ filename: 'combined.log' }), // Logs all levels to combined.log
  ],
});

// -------------------- Rate Limiter Configuration --------------------

// Initialize RateLimiter with in-memory storage
const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of points
  duration: 60, // Per 60 seconds by IP
});

// -------------------- PDF Worker Configuration --------------------

// Set the worker path for pdfjs
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'build',
    'pdf.worker.min.js'
  );
}

// -------------------- Type Definitions --------------------

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

// -------------------- Utility Functions --------------------

/**
 * Extracts text content from a PDF file.
 * @param pdfData - Uint8Array representing the PDF data.
 * @returns Extracted text as a string.
 */
const extractTextFromPDF = async (pdfData: Uint8Array): Promise<string> => {
  const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise;
  let pdfText = '';
  const numPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    pdfText +=
      textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ') + '\n';
  }

  return pdfText.substring(0, 2000); // Limit the context length if needed
};

// -------------------- HTTP Method Handlers --------------------

/**
 * Handles POST requests to the /api/message endpoint.
 * Processes user messages, interacts with the NVIDIA API, and stores messages in the database.
 * @param req - NextRequest object.
 * @returns NextResponse with the AI's response or an error message.
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

  // -------------------- Rate Limiting --------------------
  try {
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { message: 'Too Many Requests' },
      { status: 429 }
    );
  }

  try {
    // -------------------- Parse and Validate Request Body --------------------
    const body = await req.json();
    const parsedBody = SendMessageValidator.safeParse(body);

    if (!parsedBody.success) {
      logger.error('Validation Error:', parsedBody.error);
      return NextResponse.json(
        { message: `Validation Error: ${parsedBody.error.message}` },
        { status: 400 }
      );
    }

    const { fileId, message } = parsedBody.data;

    // -------------------- Authenticate User --------------------
    const { getUser } = getKindeServerSession();
    const user = getUser();
    const userId = user?.id;

    if (!userId) {
      logger.warn('Unauthorized access attempt.');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // -------------------- Verify File Ownership --------------------
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      logger.warn(`File not found: ${fileId} for user: ${userId}`);
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // -------------------- Store User Message --------------------
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId,
        userId,
      },
    });

    const pdfUrl = file.url;

    // -------------------- Retrieve NVIDIA API Key --------------------
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;

    if (!nvidiaApiKey) {
      logger.error('NVIDIA_API_KEY is not set in environment variables.');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // -------------------- Download PDF Content --------------------
    let pdfData: Uint8Array;
    try {
      const pdfResponse = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
      });
      pdfData = new Uint8Array(pdfResponse.data);
    } catch (error) {
      logger.error('Error downloading PDF:', error);
      return NextResponse.json(
        { message: 'Failed to download PDF' },
        { status: 500 }
      );
    }

    // -------------------- Extract Text from PDF --------------------
    let pdfText: string;
    try {
      pdfText = await extractTextFromPDF(pdfData);
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      return NextResponse.json(
        { message: 'Failed to process PDF content' },
        { status: 500 }
      );
    }

    // -------------------- Fetch Previous Messages for Context --------------------
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
        createdAt: 'asc',
      },
      take: 6, // Fetch the last 6 messages for context
    });

    const formattedPrevMessages = prevMessages.map((msg: Message) => ({
      role: msg.isUserMessage ? 'user' : 'assistant',
      content: msg.text,
    }));

    const formattedContext = formattedPrevMessages
      .map((msg) => msg.content)
      .join('\n\n');

    // -------------------- Prepare NVIDIA API Request Payload --------------------
    const messagesPayload = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that answers questions based on provided PDF content.',
      },
      {
        role: 'user',
        content: `The following content is from a PDF:\n\n${pdfText}\n\nPrevious interactions:\n\n${formattedContext}`,
      },
      { role: 'user', content: message },
    ];

    // -------------------- Call NVIDIA API --------------------
    let nvidiaResponse;
    try {
      nvidiaResponse = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: messagesPayload,
          temperature: 0.5,
          top_p: 1,
          max_tokens: 5024,
        },
        {
          headers: {
            Authorization: `Bearer ${nvidiaApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      logger.error(
        'Error calling NVIDIA API:',
        error.response?.data || error.message
      );
      return NextResponse.json(
        { message: 'AI service is unavailable' },
        { status: 502 }
      );
    }

    // -------------------- Validate NVIDIA API Response --------------------
    const aiMessage =
      nvidiaResponse?.data?.choices?.[0]?.message?.content || null;

    if (!aiMessage) {
      logger.error('Unexpected NVIDIA API response structure:', nvidiaResponse.data);
      return NextResponse.json(
        { message: 'Unexpected response from AI service' },
        { status: 500 }
      );
    }

    // -------------------- Store AI's Response in Database --------------------
    try {
      await db.message.create({
        data: {
          text: aiMessage,
          isUserMessage: false,
          fileId,
          userId,
        },
      });
    } catch (error) {
      logger.error('Error saving AI message to database:', error);
      return NextResponse.json(
        { message: 'Failed to save AI response' },
        { status: 500 }
      );
    }

    // -------------------- Respond to Client --------------------
    return NextResponse.json({ message: aiMessage }, { status: 200 });
  } catch (error: any) {
    logger.error('Unexpected Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
};

/**
 * Handles GET requests to the /api/message endpoint.
 * Example: Fetch the latest messages for a specific file.
 * @param req - NextRequest object.
 * @returns NextResponse with the list of messages or an error message.
 */
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

  // -------------------- Rate Limiting --------------------
  try {
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { message: 'Too Many Requests' },
      { status: 429 }
    );
  }

  try {
    // -------------------- Parse Query Parameters --------------------
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      logger.warn('fileId query parameter is missing.');
      return NextResponse.json(
        { message: 'fileId query parameter is required' },
        { status: 400 }
      );
    }

    // -------------------- Authenticate User --------------------
    const { getUser } = getKindeServerSession();
    const user = getUser();
    const userId = user?.id;

    if (!userId) {
      logger.warn('Unauthorized access attempt.');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // -------------------- Verify File Ownership --------------------
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      logger.warn(`File not found: ${fileId} for user: ${userId}`);
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // -------------------- Fetch Messages from Database --------------------
    const messages: Message[] = await db.message.findMany({
      where: {
        fileId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20, // Fetch the latest 20 messages
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: any) {
    logger.error('Unexpected Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
};