
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  MessageCircle, 
  Video, 
  CheckCheck, 
  X, 
  ChevronLeft, 
  ChevronRight,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Video as VideoIcon,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic
} from 'lucide-react';
import { TESTIMONIALS, TestimonialData, ChatMessage } from '../constants/testimonials';

// --- WhatsApp Chat Component ---
const WhatsAppChat = ({ messages, name }: { messages: ChatMessage[], name: string }) => {
  return (
    <div className="flex flex-col h-full bg-[#E5DDD5] rounded-none overflow-hidden border border-slate-200 shadow-inner relative">
      {/* Header */}
      <div className="bg-[#075E54] p-1.5 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white/20">
            <User size={16} className="text-slate-500" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold leading-tight">{name}</h4>
            <p className="text-[8px] opacity-80 leading-none">online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-80">
          <VideoIcon size={12} />
          <Phone size={11} />
          <MoreVertical size={12} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat relative">
        <div className="absolute inset-0 bg-[#E5DDD5]/40 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-center mb-2">
            <span className="bg-[#D1E9F9] text-[8px] text-slate-600 px-2 py-0.5 rounded shadow-sm uppercase font-bold tracking-wider">Today</span>
          </div>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex mb-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-[90%] p-1.5 rounded text-[10px] shadow-sm relative ${
                  msg.sender === 'user' 
                    ? 'bg-white text-slate-800 rounded-tl-none' 
                    : 'bg-[#DCF8C6] text-slate-800 rounded-tr-none'
                }`}
              >
                {msg.text}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[7px] opacity-50">{msg.time}</span>
                  {msg.sender === 'support' && <CheckCheck size={9} className="text-blue-500" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#F0F0F0] p-1 flex items-center gap-1 border-t border-slate-200">
        <div className="flex-1 bg-white rounded-full px-2 py-1 flex items-center gap-2 shadow-sm">
          <Smile size={14} className="text-slate-400" />
          <span className="text-slate-400 text-[9px] flex-1">Type a message</span>
          <Paperclip size={14} className="text-slate-400 -rotate-45" />
          <Camera size={14} className="text-slate-400" />
        </div>
        <div className="w-7 h-7 bg-[#075E54] rounded-full flex items-center justify-center text-white shadow-md">
          <Mic size={14} />
        </div>
      </div>
    </div>
  );
};

// --- Video Modal Component ---
const VideoModal = ({ isOpen, onClose, videoUrl }: { isOpen: boolean, onClose: () => void, videoUrl: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
        {videoUrl.toLowerCase().endsWith('.mp4') ? (
          <video 
            src={videoUrl} 
            className="w-full h-full" 
            controls 
            autoPlay 
          />
        ) : (
          <iframe 
            src={videoUrl} 
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        )}
      </motion.div>
    </div>
  );
};

// --- Testimonial Card Component ---
export const TestimonialCard = ({ data }: { data: TestimonialData }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="group bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-500 flex flex-col h-[300px] relative">
      {data.type === 'video' ? (
        <div className="absolute inset-0 bg-slate-100">
          <img 
            src={data.thumbnailUrl} 
            alt={data.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <button 
              onClick={() => setIsVideoModalOpen(true)}
              className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl transform transition-transform hover:scale-110 active:scale-95 z-10"
            >
              <Play size={20} className="text-emerald-600 ml-0.5" fill="currentColor" />
            </button>
          </div>
          
          {/* Badge */}
          <div className="absolute top-3 left-3 z-20">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
              <Video size={10} />
              Video
            </div>
          </div>

          {/* Identity Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black tracking-tight truncate">{data.name}</p>
                <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold truncate">{data.location}</p>
              </div>
              <div className="shrink-0 px-2 py-0.5 bg-emerald-500/20 backdrop-blur-sm rounded border border-emerald-500/30 text-[8px] font-bold uppercase tracking-widest">
                {data.productUsed.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>

          {data.videoUrl && (
            <VideoModal 
              isOpen={isVideoModalOpen} 
              onClose={() => setIsVideoModalOpen(false)} 
              videoUrl={data.videoUrl} 
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 relative">
            <WhatsAppChat messages={data.chatMessages || []} name={data.name} />
            
            {/* WhatsApp Badge */}
            <div className="absolute top-12 left-3 z-20">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-md text-[#075E54] rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
                <MessageCircle size={10} />
                Proof
              </div>
            </div>
          </div>
          
          {/* Product Footer for Chat */}
          <div className="bg-white p-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[70%]">GHT: {data.productUsed}</span>
            <div className="flex items-center gap-0.5 text-emerald-600">
              <ShieldCheck size={10} />
              <span className="text-[8px] font-bold uppercase">Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Testimonials Section ---
export const Testimonials = ({ onViewAll }: { onViewAll?: () => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-slate-50 overflow-hidden" id="testimonials">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4 block"
            >
              Real Stories
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-serif italic text-slate-900 leading-tight"
            >
              Stories of <span className="text-emerald-600">Transformation</span>
            </motion.h2>
          </div>
          
          <div className="flex gap-4 items-center">
            {onViewAll && (
              <button 
                onClick={onViewAll}
                className="hidden md:flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest hover:gap-3 transition-all mr-4"
              >
                View All <ArrowRight size={18} />
              </button>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => scroll('left')}
                className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials Grid/Scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[210px] md:min-w-[270px] snap-start"
            >
              <TestimonialCard data={testimonial} />
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 p-12 bg-emerald-900 rounded-[48px] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 leaf-pattern pointer-events-none" />
          <h3 className="text-3xl md:text-4xl font-serif italic text-white mb-6 relative z-10">
            Ready to start your own success story?
          </h3>
          <p className="text-emerald-100/70 max-w-xl mx-auto mb-10 relative z-10">
            Join thousands of others who have transformed their lives with GHT Healthcare's natural solutions.
          </p>
          <button className="bg-white text-emerald-900 px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-emerald-50 transition-all shadow-2xl relative z-10">
            Explore All Products
          </button>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}} />
    </section>
  );
};
