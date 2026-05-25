import React, { useState } from 'react';
import { FileText, Loader2, Plus, Sparkles } from 'lucide-react';

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

    setLoading(true);
    try {
      // 1. Generate the blog content securely on server-side
      const genRes = await fetch('/api/admin/generate-blog-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ topic, category })
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || 'Failed to generate blog content');
      }

      const { blogData, image_url, packageSearchTerm } = await genRes.json();

      // 2. Send to backend to save
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
        throw new Error(err.error || 'Failed to save generated blog');
      }

      setTopic('');
      onBlogGenerated();
      alert("Blog generated successfully!");
    } catch (e: any) {
      alert(e.message);
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
