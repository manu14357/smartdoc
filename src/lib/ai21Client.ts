// lib/ai21Client.ts
export const ai21Complete = async (prompt: string, apiKey: string) => {
  const response = await fetch("https://api.ai21.com/v1/j2/jumbo/complete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      maxTokens: 100,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response from AI21:", errorText); // Log error for debugging
    throw new Error(`AI21 API Error: ${errorText}`);
  }

  const data = await response.json();
  return data.completions?.[0]?.text || "No response from AI21 API.";
};
