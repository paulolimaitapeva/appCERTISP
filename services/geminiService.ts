import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDocumentChecklist = async (productName: string, clientType: 'PF' | 'PJ'): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. Please set process.env.API_KEY to use AI features.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert in Brazilian Digital Certificates (ICP-Brasil).
      Create a concise checklist of documents required for a client of type "${clientType}" (PF=Pessoa Física, PJ=Pessoa Jurídica) 
      to issue the product "${productName}".
      
      Format the output as a simple HTML list (<ul><li>...</li></ul>) without markdown code blocks or extra text.
      Focus on the most important documents (RG, CNH, Contrato Social, etc.).
      Language: Portuguese (Brazil).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "<p>Não foi possível gerar a lista no momento.</p>";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "<p>Erro ao consultar o assistente de IA.</p>";
  }
};

export const generateMeetingSummary = async (notes: string): Promise<string> => {
    if (!process.env.API_KEY) return notes;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize these meeting notes into a professional, concise sentence in Portuguese: ${notes}`,
        });
        return response.text || notes;
    } catch (e) {
        return notes;
    }
}