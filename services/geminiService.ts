
import { GoogleGenAI } from "@google/genai";
import { Deal, Resource } from '../types';

const getAiClient = () => {
    // In a real app, you might want to handle this more gracefully if the key is missing
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
};

export const generateProposalDraft = async (deal: Deal): Promise<string> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a professional B2B sales solution architect.
    Create a detailed business proposal draft for the following deal.
    
    Company: ${deal.company}
    Deal Title: ${deal.title}
    Estimated Value: $${deal.value}
    
    Context & Qualification (MEDDPICC):
    - Metrics (Value): ${deal.meddpicc.metrics}
    - Economic Buyer: ${deal.meddpicc.economicBuyer}
    - Pain Points: ${deal.meddpicc.identifiedPain}
    - Decision Criteria: ${deal.meddpicc.decisionCriteria}
    - Champion: ${deal.meddpicc.champion}
    
    Description:
    ${deal.description}
    
    The proposal should include:
    1. Executive Summary
    2. Problem Statement (Based on Identified Pain)
    3. Proposed Solution (Addressing Decision Criteria)
    4. Business Value (Based on Metrics)
    5. Implementation Timeline
    6. Investment Summary
    
    Format the output in Markdown. Keep it professional, concise, and persuasive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Failed to generate proposal content.";
  } catch (error) {
    console.error("Error generating proposal:", error);
    return "Error generating proposal. Please check your API configuration.";
  }
};

export const generateEmailFollowUp = async (deal: Deal, type: 'check-in' | 'proposal-delivery' | 'meeting-request'): Promise<string> => {
    const ai = getAiClient();
    
    let context = "";
    if (type === 'check-in') context = "Write a polite check-in email.";
    if (type === 'proposal-delivery') context = "Write an email accompanying the attached proposal.";
    if (type === 'meeting-request') context = "Write an email requesting a meeting to discuss next steps.";
  
    const prompt = `
      Write a short, professional sales email to ${deal.contactName} at ${deal.company}.
      Context: ${context}
      Deal: ${deal.title}
      Last Contact: ${deal.lastContact}
      
      Keep it under 150 words. No subject line needed, just the body.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not generate email.";
    } catch (error) {
      console.error(error);
      return "Error generating email.";
    }
};

export const generateExecutiveSummary = async (deal: Deal, resources: Resource[]): Promise<string> => {
    const ai = getAiClient();

    const resourceSummary = resources.map(r => `- ${r.type} (${r.date}): ${r.summary}`).join('\n');

    const prompt = `
        Analyze the following deal assets and create a concise "Executive Brief" or description of the opportunity.
        Focus on the customer's pain points, strategic goals, and why they are looking to buy now.
        
        Deal: ${deal.title} (${deal.company})
        Identified Pain: ${deal.meddpicc.identifiedPain}
        
        Recent Discovery Assets:
        ${resourceSummary}
        
        Output a single paragraph, professional and insightful.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Could not generate summary.";
    } catch (error) {
        return "The client is looking to modernize their infrastructure. Key drivers include scalability and security compliance. Multiple stakeholders involved.";
    }
};

export const generateWeeklyDigest = async (deal: Deal): Promise<string> => {
    const ai = getAiClient();

    const prompt = `
        Create a bulleted "Weekly Pulse" report for this deal. 
        Invent 3-4 realistic events that happened in the last week based on the deal stage (${deal.stage}).
        Include 1 blocker or risk if the deal is not in CLOSED stage.
        
        Deal: ${deal.title}
        Company: ${deal.company}
        
        Format: Bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Could not generate digest.";
    } catch (error) {
        return "• Client internal review meeting scheduled.\n• Sent updated pricing deck.\n• Legal team requested NDA revision.";
    }
};

export const analyzeScreenshot = async (base64Image: string): Promise<string> => {
    const ai = getAiClient();

    const prompt = `
        You are an expert sales assistant. Analyze this image. 
        It is likely a screenshot of a WhatsApp conversation, a LinkedIn DM, or a slide from a presentation.
        
        1. Identify the context (e.g., "WhatsApp Chat with Client", "Competitor Pricing Slide").
        2. Extract key sales intelligence (Pain points, Competitors mentioned, Budget numbers, or Next Steps).
        3. Suggest a specific action for the sales rep.

        Format the output as a JSON object (but return as string, do not use markdown code blocks) with keys:
        {
            "context": "...",
            "intelligence": "...",
            "suggestedAction": "..."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Flash supports multimodal (images) well
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "{}";
    } catch (error) {
        console.error("Image analysis failed", error);
        return JSON.stringify({
            context: "Error analyzing image",
            intelligence: "Could not extract data.",
            suggestedAction: "Try uploading a clearer image."
        });
    }
};

export const getBattleCard = async (trigger: string, dealContext: string): Promise<string> => {
    const ai = getAiClient();
    
    const prompt = `
        You are a real-time sales coach. A sales rep is on a call.
        
        Trigger Detected: "${trigger}"
        Deal Context: ${dealContext}
        
        Provide a "Battle Card" response.
        1. What should the rep say? (The "Pivot")
        2. What data/fact supports this? (The "Proof")
        3. One killer question to ask back.
        
        Keep it extremely concise (under 50 words total).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No battle card available.";
    } catch (error) {
        return "Error generating battle card.";
    }
}
