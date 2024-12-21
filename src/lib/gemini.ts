// lib/gemini.ts
import axios from 'axios';

export const getGeminiClient = () => {
  const client = axios.create({
    baseURL: 'https://api.gemini.com/v1', // Update with the correct base URL for Gemini API
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return client;
};
