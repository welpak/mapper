import { GoogleGenAI } from "@google/genai";
import { Business } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBusinessSummary = async (business: Business): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Analyze the following business data and provide a concise strategic summary (SWOT analysis style) in 3-4 bullet points. 
      Focus on its industry (${business.naicsDescription}) and location (${business.city}, ${business.county}, NC).
      
      Business Name: ${business.name}
      Employees: ${business.employees}
      Revenue: ${business.revenue || 'Unknown'}
      Tags: ${business.tags.join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this time. Please check your API key.";
  }
};
