// src/pages/api/feedback.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const feedbacks = await prisma.feedback.findMany({
        include: {
          User: true, // Include user data if needed
        },
      });
      res.status(200).json(feedbacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
