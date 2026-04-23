import React, { useEffect, useState } from 'react';
import { BlogPost } from '../../types';
import { Calendar, ChevronRight, Tag } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

interface BlogListProps {
  onSelectPost: (id: string) => void;
}

export function BlogList({ onSelectPost }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch blogs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-slate-700">No articles found</h3>
        <p className="text-slate-500 mt-2">Check back later for new health insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Health & Wellness Insights</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover expert advice, natural remedies, and the latest in holistic health to support your well-being.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
            onClick={() => onSelectPost(post.id)}
          >
            <div className="aspect-[16/9] overflow-hidden relative">
              <img 
                src={getOptimizedImageUrl(post.image_url || `https://picsum.photos/seed/supplement-article-${post.id}/800/600`, 800)} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-article-${post.id}/800/600`;
                }}
              />
              {post.category && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  {post.category}
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
                <Calendar size={14} />
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-1">
                {post.meta_description || post.content.substring(0, 150).replace(/[#*`]/g, '') + '...'}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Tag size={14} className="text-slate-400 shrink-0" />
                  <div className="flex gap-1 overflow-hidden">
                    {post.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                        {tag}{i < Math.min(post.tags.length, 2) - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
