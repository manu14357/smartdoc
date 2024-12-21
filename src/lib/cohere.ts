import cohere from "cohere-ai"; // Import Cohere SDK

// Initialize Cohere client
cohere.init(process.env.COHERE_API_KEY); // Make sure your API key is correct

// Function to generate embeddings using Cohere
async function generateEmbeddings(message: string) {
  try {
    const response = await cohere.embed({
      texts: [message], // Pass the message to Cohere for embedding
    });

    const embeddings = response.body.embeddings[0]; // Extract embeddings from the response
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}
