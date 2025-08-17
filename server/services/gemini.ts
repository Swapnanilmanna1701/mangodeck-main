import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSummary(
  transcript: string,
  customPrompt: string,
  tone: string
): Promise<string> {
  try {
    const toneInstructions = {
      professional: "Use a formal, business-appropriate tone with clear structure and professional language.",
      casual: "Use a friendly, conversational tone that's approachable and easy to understand.",
      concise: "Be direct and to-the-point, focusing on essential information only.",
      detailed: "Provide comprehensive coverage with thorough explanations and context."
    };

    const basePrompt = `
You are an expert meeting summarizer. Please analyze the following meeting transcript and create a structured summary enhanced with relevant emojis for better readability and engagement.

TONE: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}

CUSTOM INSTRUCTIONS: ${customPrompt}

FORMATTING REQUIREMENTS:
- Use clear headings with appropriate emojis (## Heading 📋)
- Add relevant emojis to bullet points and action items
- Structure the content logically
- Include participant names when mentioned
- Highlight key decisions, action items, and deadlines
- Use emojis that enhance understanding without being excessive

TRANSCRIPT TO SUMMARIZE:
${transcript}

Please create a well-structured, emoji-enhanced summary that follows the custom instructions and maintains the specified tone.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: basePrompt,
    });

    const summary = response.text || "Failed to generate summary";
    
    // Ensure we have a minimum viable summary
    if (summary.length < 50) {
      throw new Error("Generated summary is too short");
    }

    return summary;
  } catch (error: any) {
    throw new Error(`AI summarization failed: ${error.message}`);
  }
}
