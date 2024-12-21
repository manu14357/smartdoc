// /lib/anthropic.ts

import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/complete'; // Placeholder, check Anthropic API for actual endpoint
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const AnthropicStream = async (params: {
  model: string;
  temperature: number;
  prompt: string;
  stream?: boolean;
}) => {
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: params.model,
        temperature: params.temperature,
        prompt: params.prompt,
        stream: params.stream ?? true,
      },
      {
        headers: {
          'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream', // To support streaming
      }
    );

    return response.data; // This would contain the streamed data
  } catch (error) {
    console.error('Error with Anthropic API request', error);
    throw new Error('Failed to fetch from Anthropic API');
  }
};

export const StreamingTextResponse = async (stream: any, options: any) => {
  // Handle the streamed response (you can adjust this function as needed)
  const reader = stream.getReader();
  let result = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += value;
  }

  // You can execute options.onCompletion or other handlers if needed
  if (options?.onCompletion) {
    await options.onCompletion(result);
  }

  return result;
};
