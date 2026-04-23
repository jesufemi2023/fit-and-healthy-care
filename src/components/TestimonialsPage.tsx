
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, MessageCircle, Video } from 'lucide-react';
import { TESTIMONIALS } from '../constants/testimonials';
import { TestimonialCard } from './Testimonials';

interface TestimonialsPageProps {
  onBack: () => void;
}

export const TestimonialsPage = ({ onBack }: TestimonialsPageProps) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Sparkles size={14} />
            Verified Success Stories
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16">
        <div className="max-w-3xl mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4 block"
          >
            The GHT Community
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif italic text-slate-900 leading-tight mb-6"
          >
            Real Results from <br />
            <span className="text-emerald-600">Real People</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 font-medium leading-relaxed"
          >
            Explore our comprehensive collection of video stories, chat proofs, and physical transformations from our valued customers across Nigeria and beyond.
          </motion.p>
        </div>

        {/* Filter/Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Video, label: "Video Stories", count: TESTIMONIALS.filter(t => t.type === 'video').length, color: "bg-emerald-50 text-emerald-700" },
            { icon: MessageCircle, label: "WhatsApp Proofs", count: TESTIMONIALS.filter(t => t.type === 'chat').length, color: "bg-blue-50 text-blue-700" },
            { icon: Sparkles, label: "Transformations", count: TESTIMONIALS.filter(t => t.type === 'before-after').length, color: "bg-amber-50 text-amber-700" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} p-6 rounded-[32px] flex items-center justify-between border border-current/10`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-2xl">
                  <stat.icon size={24} />
                </div>
                <span className="font-black uppercase tracking-widest text-xs">{stat.label}</span>
              </div>
              <span className="text-3xl font-serif italic">{stat.count}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TestimonialCard data={testimonial} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 p-12 md:p-24 bg-emerald-900 rounded-[64px] text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-serif italic text-white mb-8">
              Join the GHT <br /> Success Story
            </h2>
            <p className="text-emerald-100/70 text-lg md:text-xl font-medium mb-12">
              Our natural solutions have helped thousands regain their health and vitality. It's your turn to experience the GHT difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full sm:w-auto bg-white text-emerald-900 px-12 py-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-emerald-50 transition-all shadow-2xl"
              >
                Shop All Products
              </button>
              <button className="w-full sm:w-auto bg-emerald-800 text-white px-12 py-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all border border-emerald-700">
                Contact Consultant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
