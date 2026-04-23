import React, { useState } from 'react';
import { FileText, Loader2, Plus, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface BlogAdminProps {
  onBlogGenerated: () => void;
  adminPassword: string;
}

export function BlogAdmin({ onBlogGenerated, adminPassword }: BlogAdminProps) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Erectile Dysfunction');

  const categories = [
    'Diabetes',
    'Prostate Health',
    'Erectile Dysfunction',
    'Premature Ejaculation',
    'Men\'s Health',
    'Wellness'
  ];

  const handleGenerate = async () => {
    if (!topic) {
      alert("Please enter a topic");
      return;
    }

    // Restore the original API Key Selection workflow
    const aistudio = (window as any).aistudio;
    let hasUserKey = false;
    if (aistudio) {
      try {
        hasUserKey = await aistudio.hasSelectedApiKey();
        if (!hasUserKey) {
          // We can still try with default key, but will prompt if it fails
        }
      } catch (e) {
        console.warn("API Key selection error:", e);
      }
    }

    setLoading(true);
    try {
      let apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : undefined) || process.env.GEMINI_API_KEY;
      if (apiKey === "MY_GEMINI_API_KEY") apiKey = undefined;
      
      const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let blogData;
      try {
        blogData = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error("Failed to parse AI response as JSON.");
        throw new Error("The AI failed to format the article correctly. Please try again.");
      }

      // 3. Generate Image with AI
      let image_url = `https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop`; // High quality medical fallback
      try {
        // Use gemini-3.1-flash-image-preview if user has selected a key, otherwise fallback to 2.5
        const imageModel = hasUserKey ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

        const imageResponse = await ai.models.generateContent({
          model: imageModel,
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
        // Use a themed fallback based on category
        const seeds: Record<string, string> = {
          'Diabetes': '1584036561566-baf8f5f1b144',
          'Prostate Health': '1576091160550-2173dba999ef',
          'Wellness': '1544367567-0f2fcb009e0b'
        };
        const photoId = seeds[category] || '1576091160550-2173dba999ef';
        image_url = `https://images.unsplash.com/photo-${photoId}?q=80&w=800&auto=format&fit=crop`;
      }

      // 4. Send to backend to save
      const res = await fetch('/api/admin/save-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ category, blogData, image_url, packageSearchTerm })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate blog');
      }

      setTopic('');
      onBlogGenerated();
      alert("Blog generated successfully!");
    } catch (e: any) {
      const errStr = String(e).toLowerCase();
      if (errStr.includes("requested entity was not found") || errStr.includes("api key not valid") || errStr.includes("api key not configured")) {
        alert("API Key issue. Please select your API key again.");
        if (aistudio) await aistudio.openSelectKey();
      } else {
        alert(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Blog Generator</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generate SEO-optimized health articles</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Health Category</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Article Topic / Keyword</label>
          <input 
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="e.g. Natural Ways to Improve Erectile Strength"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? 'Generating Article & Images...' : 'Generate Blog Post'}
        </button>
      </div>
    </div>
  );
}
