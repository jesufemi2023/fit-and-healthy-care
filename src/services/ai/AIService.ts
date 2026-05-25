import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AIKeyManager } from "./AIKeyManager.js";
import { AICache } from "./AICache.js";

export class AIService {
  private keyManager: AIKeyManager;
  private cache: AICache;
  private systemInstruction: string;

  constructor() {
    this.keyManager = new AIKeyManager();
    this.cache = new AICache();
    
    // Read contact info from environment variables
    const whatsapp = process.env.VITE_WHATSAPP_NUMBER || "Not provided";
    const phone = process.env.VITE_CONTACT_PHONE || process.env.VITE_WHATSAPP_NUMBER || "Not provided";

    // Default system prompt if not provided in env
    this.systemInstruction = process.env.AI_SYSTEM_INSTRUCTION || `
      You are Dr. GHT, an expert AI health consultant for GHT Healthcare.
      
      STRICT OPERATING RULES:
      1. HEALTH FOCUS ONLY: You MUST ONLY answer questions related to health, wellness, medical conditions, and GHT products. 
      2. ABSOLUTE RESTRICTION: If a user asks about politics, programming, sports, entertainment, or ANY topic unrelated to health/GHT, you MUST politely but firmly refuse to answer. Example: "I am specialized in health and wellness consultations. I cannot provide information on [topic]."
      3. DATABASE ONLY: You MUST ONLY recommend products or packages that exist in the provided JSON context. DO NOT invent, hallucinate, or guess any product names, IDs, prices, or details.
      4. SALES & AESTHETICS: Your goal is to convince the user to buy GHT products. Use an empathetic, professional, and highly persuasive tone. Use markdown formatting to make your response visually appealing.
      5. DIRECT ORDER LINKS: Whenever you recommend a product or package, you MUST include a direct order link using exactly this markdown format: [Order Product Name](product:ID) or [Order Package Name](package:ID). 
         Example for Product: [Order GHT Sugar Care](product:12)
         Example for Package: [Order Arthritis Package](package:3)
         Clicking these links will open the detailed modal view for that item.
      6. CONTACT INFO: If the user asks for human support, provide WhatsApp: ${whatsapp} and Phone: ${phone}.
    `.trim();
  }

  async generateResponse(prompt: string, contextData: string, modelOverride?: string, responseMimeType?: string): Promise<string> {
    // 1. Check Cache (Zero Cost)
    const cached = this.cache.get(prompt);
    if (cached) {
      console.log("AI Cache Hit");
      return cached;
    }

    // 3. Queue / Retry Logic (Exponential backoff for 429 Too Many Requests)
    // Vercel has a 10s timeout on Hobby plan, so we must be aggressive
    const isVercel = !!process.env.VERCEL;
    const startTime = Date.now();
    let retries = parseInt(process.env.AI_MAX_RETRIES || (isVercel ? "2" : "8"), 10);
    let delay = parseInt(process.env.AI_RETRY_DELAY_MS || (isVercel ? "500" : "5000"), 10);

    while (retries > 0) {
      // Safety check for Vercel: If we've spent more than 7s, don't retry again
      if (isVercel && (Date.now() - startTime) > 7000) {
        console.warn("Approaching Vercel timeout limit. Stopping retries.");
        break;
      }
      // 2. Get Key & Initialize AI (Inside loop to allow key rotation on retry)
      const key = await this.keyManager.getNextKey();
      if (!key) {
        throw new Error("AI is currently unavailable (All API keys are exhausted). Please try again later.");
      }
      const ai = new GoogleGenAI({ apiKey: key });

      try {
        // Fallback logic: Default to Lite model for maximum quota resilience if not specified
        let modelName = modelOverride || process.env.AI_MODEL || "gemini-3.1-flash-lite-preview";
        
        // If we are retrying due to quota, force switch to the Lite model regardless of settings
        if (retries < parseInt(process.env.AI_MAX_RETRIES || "8", 10)) {
          modelName = "gemini-3.1-flash-lite-preview";
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: `User Question: ${prompt}\n\nAvailable GHT Products Context:\n${contextData}`,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
            responseMimeType: responseMimeType,
            // Add safety settings to prevent false positives on health topics
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          }
        });

        const text = response.text || "I'm sorry, I couldn't process that.";
        
        // 4. Save to Cache
        this.cache.set(prompt, text);
        return text;
      } catch (error: any) {
        // Handle Rate Limits (429) and High Demand (503) gracefully
        const errStr = String(error).toLowerCase();
        const errMsg = (error.message || '').toLowerCase();
        const errStatus = error.status || error.error?.status || error.error?.code;
        
        const isQuota = errStr.includes('quota') || errMsg.includes('quota') || errStr.includes('exhausted') || errMsg.includes('exhausted');
        
        const isRetryable = isQuota || errStatus === 429 || errStatus === 503 || 
                            errStatus === 'UNAVAILABLE' ||
                            errStr.includes('429') || errStr.includes('503') ||
                            errStr.includes('unavailable') || errStr.includes('high demand') ||
                            errMsg.includes('429') || errMsg.includes('503') ||
                            errMsg.includes('unavailable') || errMsg.includes('high demand') ||
                            errMsg.includes('deadline exceeded'); // Added deadline exceeded
                            
        if (isRetryable) {
          retries--;
          const reason = isQuota ? "Quota Exceeded" : (errStatus || 'Busy');
          
          // Mark key as exhausted if it's a quota or rate limit error
          if (isQuota) {
            await this.keyManager.markKeyAsExhausted(key, 'quota');
          } else if (errStatus === 429 || errStr.includes('429')) {
            await this.keyManager.markKeyAsExhausted(key, 'rate');
          }

          console.warn(`AI Service ${reason}. Retrying with next key in ${delay}ms... (${retries} retries left)`);
          
          if (retries === 0) {
            const keyCount = this.keyManager.getKeyCount();
            if (isQuota) {
              throw new Error(`API Quota Exceeded for all ${keyCount} available key(s). Please try again tomorrow or add more unique API keys.`);
            }
            throw new Error(`The AI consultant is currently experiencing high demand. (Tried ${keyCount} keys). Please try again in a moment.`);
          }
          
          await new Promise(res => setTimeout(res, delay));
          delay = Math.min(delay * 2, 30000); // Exponential backoff capped at 30s
        } else {
          // Other errors (e.g., 400, auth errors)
          console.error("AI Generation Error:", error);
          throw new Error("Failed to generate response. Please try again later.");
        }
      }
    }
    
    throw new Error("Failed to generate response.");
  }

  async generateImage(prompt: string): Promise<string | null> {
    let retries = 5;
    let delay = 2000;

    while (retries > 0) {
      const key = await this.keyManager.getNextKey();
      if (!key) return null;
      
      const ai = new GoogleGenAI({ apiKey: key });

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return null;
      } catch (error: any) {
        const errStr = String(error).toLowerCase();
        const errStatus = error.status || error.error?.status || error.error?.code;
        const errMsg = (error.message || '').toLowerCase();
        
        const isQuota = errStr.includes('quota') || errMsg.includes('quota') || errStr.includes('exhausted') || errMsg.includes('exhausted');
        if (isQuota) {
          await this.keyManager.markKeyAsExhausted(key, 'quota');
          console.error("API Quota Exceeded for image generation.");
          retries--;
          continue;
        }

        const isRetryable = errStatus === 429 || errStatus === 503 || errMsg.includes('high demand') || errMsg.includes('unavailable');
        
        if (isRetryable) {
          if (errStatus === 429) {
            await this.keyManager.markKeyAsExhausted(key, 'rate');
          }
          retries--;
          console.warn(`AI Image Service Busy. Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        } else {
          console.error("AI Image Error:", error);
          return null;
        }
      }
    }
    return null;
  }

  async generateBlogContent(topic: string, category: string): Promise<{ blogData: any; image_url: string; packageSearchTerm: string }> {
    // 1. Define Category Rules for Packages
    let packageSearchTerm = '';
    let packageProducts: string[] = [];
    
    if (category === 'Erectile Dysfunction' || category === 'Premature Ejaculation' || category === 'Men\'s Health') {
      packageSearchTerm = 'Weak Erection';
      packageProducts = ['Zinc', 'Reodoe Capsules', 'Vigor Max Softgel'];
    } else if (category === 'Prostate Health') {
      packageSearchTerm = 'Prostate';
      packageProducts = ['Vigor Max', 'B-Clear', 'Prostbeta'];
    } else if (category === 'Diabetes') {
      packageSearchTerm = 'Diabetes';
      packageProducts = ['Constifree Tea', 'Longzit', 'Dialese', 'Myco-Balance'];
    } else {
      packageSearchTerm = 'Wellness';
    }

    const key = await this.keyManager.getNextKey();
    if (!key) {
      throw new Error("AI is currently unavailable (All API keys are exhausted). Please try again later.");
    }
    const ai = new GoogleGenAI({ apiKey: key });

    // 2. Generate Content with AI
    const prompt = `
      Generate a comprehensive, SEO-optimized health blog article for the topic: "${topic}" in the category: "${category}".
      
      The article MUST include:
      1. An SEO-optimized title.
      2. A detailed introduction educating the visitor about the health issue.
      3. Educational sections with clear headings and bullet points.
      4. Health tips.
      5. A "Real Customer Experience" section using a WhatsApp-style testimonial conversation between a customer and a consultant. Include chat bubbles, contact name, timestamp, and profile picture placeholders. Make it sound realistic and believable.
      6. A recommendation section for a supplement package. If the category is ${category}, recommend a package containing: ${packageProducts.join(', ')}.
      7. An FAQ section with at least 3 common questions.
      8. A conclusion.
      9. A list of 3 "Related Articles" titles.

      The tone must be educational and trustworthy, not like direct sales content.

      Format the entire response as a JSON object with the following structure:
      {
        "title": "...",
        "meta_description": "...",
        "content": "Markdown formatted content. For the WhatsApp testimonial, use blockquotes or specific markdown to represent chat bubbles. For the package recommendation, create a visually appealing section in markdown.",
        "tags": ["${category}", "health", "wellness", "tips"],
        "image_prompt": "A professional, medical-grade, realistic photo or 3D illustration representing ${topic}. Not cartoonish."
      }
    `;

    // Use gemini-3.5-flash since this is a text task
    const textResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let blogData: any;
    try {
      blogData = JSON.parse(textResponse.text || '{}');
    } catch (e) {
      console.error("Failed to parse AI response as JSON.");
      throw new Error("The AI failed to format the article correctly. Please try again.");
    }

    // 3. Generate Image with AI
    let image_url = `https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop`; // High quality medical fallback
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: blogData.image_prompt || `Professional medical photo about ${topic}`,
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            image_url = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("Failed to generate image, using high-quality fallback:", e);
      const seeds: Record<string, string> = {
        'Diabetes': '1584036561566-baf8f5f1b144',
        'Prostate Health': '1576091160550-2173dba999ef',
        'Wellness': '1544367567-0f2fcb009e0b'
      };
      const photoId = seeds[category] || '1576091160550-2173dba999ef';
      image_url = `https://images.unsplash.com/photo-${photoId}?q=80&w=800&auto=format&fit=crop`;
    }

    return { blogData, image_url, packageSearchTerm };
  }

  async generateComboImage(images: { name: string; base64: string; mimeType: string }[], packageName: string): Promise<string> {
    const key = await this.keyManager.getNextKey();
    if (!key) {
      throw new Error("AI is currently unavailable (All API keys are exhausted). Please try again later.");
    }
    const ai = new GoogleGenAI({ apiKey: key });

    const parts: any[] = [];

    for (const img of images) {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType
        }
      });
    }

    parts.push({ text: `Generate a professional studio photograph of a premium wellness combo package named "${packageName || 'Wellness Kit'}". It should look like a cohesive "Master Kit" or "Luxury Collection". The kit contains ${images.length} products in total. Use the provided product images as visual references for the branding, bottle shapes, and label styles. Arrange them elegantly with soft lighting and emerald green accents.` });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Failed to generate image from AI");
  }
}

// Export a lazy getter for the singleton instance
let _aiService: AIService | null = null;
export const getAIService = () => {
  if (!_aiService) {
    _aiService = new AIService();
  }
  return _aiService;
};
