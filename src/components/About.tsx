import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Eye, 
  Heart, 
  ShieldCheck, 
  Award, 
  Users, 
  Globe, 
  Compass,
  ArrowRight
} from 'lucide-react';

interface AboutProps {
  onNavigate?: (tab: "home" | "about" | "products" | "recommended" | "combo" | "consultation" | "history" | "product-detail" | "admin" | "blog" | "blog-post" | "search") => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white">
      {/* 1. Hero Section - Shopify Style Editorial */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
                MAKING TRUSTED <br />
                <span className="text-emerald-600">HEALTH ACCESSIBLE.</span>
              </h1>
              <p className="text-xl md:text-3xl text-slate-600 font-medium leading-relaxed max-w-2xl">
                We are a leading distributor and marketer of professional health products committed to improving the well-being of our community.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-6">
                <button 
                  type="button"
                  onClick={() => onNavigate?.("products")}
                  className="cursor-pointer w-full sm:w-auto bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100"
                >
                  Explore Products <ArrowRight size={20} />
                </button>
                <button 
                  type="button"
                  onClick={() => onNavigate?.("consultation")}
                  className="cursor-pointer w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
                >
                  Contact Us
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50/50 -skew-x-12 translate-x-1/4 pointer-events-none hidden lg:block" />
      </section>

      {/* 2. Introduction & Global Network */}
      <section className="py-20 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
                Who We Are
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed">
                <p>
                  As a proud member and distributor of <span className="font-bold text-slate-900">SD GHT Health Care Nigeria Ltd</span>, we work within a global network dedicated to promoting natural wellness and supporting healthier lifestyles through high-quality dietary supplements and herbal health products.
                </p>
                <p>
                  Our platform connects people with carefully selected wellness products designed to support overall health, vitality, and long-term well-being.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Globe size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Global Network</h3>
              </div>
              <div className="space-y-6 text-slate-600">
                <p className="font-medium">
                  SD GHT Health Care Nigeria Ltd is a wholly owned subsidiary of GHT Pharmaceutical Co. Ltd, an international health brand specializing in Traditional Chinese Medicine (TCM).
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="font-bold text-slate-900">GHT Boavida Angola Ltd</span>
                    <span className="ml-auto text-sm text-slate-400 font-bold">EST. 2012</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="font-bold text-slate-900">GHT Boavida Mozambique Ltd</span>
                    <span className="ml-auto text-sm text-slate-400 font-bold">EST. 2017</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-bold">SD GHT Health Care Nigeria Ltd</span>
                    <span className="ml-auto text-sm font-bold opacity-80">EST. 2020</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision - Split Layout */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Mission */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-emerald-900 text-white p-10 md:p-16 rounded-[3rem] space-y-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Target size={120} />
              </div>
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Target size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Our Mission</h2>
              <p className="text-xl text-emerald-100 leading-relaxed">
                To inspire hope in the healthcare industry by promoting innovative health solutions and advanced approaches that support effective diagnosis, treatment, and healthcare delivery.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-900 text-white p-10 md:p-16 rounded-[3rem] space-y-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Eye size={120} />
              </div>
              <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center">
                <Eye size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Our Vision</h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                To be part of the changing face of healthcare by improving lives through accessible wellness solutions, trusted partnerships, and a strong commitment to service.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Core Values - Grid Layout */}
      <section className="py-20 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              Our work is guided by strong principles that shape how we serve our customers and our community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                title: "Quality",
                desc: "We are committed to delivering high-quality health products and services that meet trusted standards.",
                icon: Award,
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Integrity",
                desc: "We operate with honesty, transparency, and respect in all our relationships and interactions.",
                icon: ShieldCheck,
                color: "bg-emerald-50 text-emerald-600"
              },
              {
                title: "Excellence",
                desc: "We strive for continuous improvement and the highest level of professionalism in everything we do.",
                icon: Award,
                color: "bg-purple-50 text-purple-600"
              },
              {
                title: "Accountability",
                desc: "We take responsibility for our actions and remain dedicated to delivering value and positive impact.",
                icon: Users,
                color: "bg-orange-50 text-orange-600"
              }
            ].map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className={`w-14 h-14 ${value.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <value.icon size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{value.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Purpose - Final Call to Action Style */}
      <section className="py-20 md:py-40 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-black uppercase tracking-widest mb-8">
              <Compass size={16} />
              Our Purpose
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-12">
              LINKING PEOPLE WITH <br />
              <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">RELIABLE HEALTH</span> <br />
              INFORMATION.
            </h2>
            <p className="text-xl md:text-3xl text-slate-600 font-medium leading-relaxed mb-12">
              We are passionate about providing trusted wellness solutions to improve the quality of life and promote healthier communities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                type="button"
                onClick={() => onNavigate?.("products")}
                className="cursor-pointer w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                Explore Products <ArrowRight size={20} />
              </button>
              <button 
                type="button"
                onClick={() => onNavigate?.("consultation")}
                className="cursor-pointer w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
      </section>
    </div>
  );
};
