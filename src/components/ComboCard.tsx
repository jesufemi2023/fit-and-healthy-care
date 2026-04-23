import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, CheckCircle2, Star, Eye, ChevronRight, ChevronLeft, X, Phone } from "lucide-react";
import { PackageData, Product } from "../types";
import { CONFIG } from "../config";
import { PackageQuickView } from "./PackageQuickView";
import { getOptimizedImageUrl } from "../utils/cloudinary";

interface ComboCardProps {
  data: PackageData;
  onOrder: (item: any, type: 'package', qty: number) => void;
  onProductClick: (product: Product) => void;
}

export const ComboCard: React.FC<ComboCardProps> = ({ data, onOrder, onProductClick }) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [showFullBenefits, setShowFullBenefits] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const discountPrice = data.price * (1 - data.discount / 100);

  const itemsPerPage = 3;
  const maxIndex = Math.max(0, (data.products?.length || 0) - itemsPerPage);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-[3rem] border-4 border-slate-100 shadow-xl hover:shadow-3xl transition-all duration-700 overflow-hidden flex flex-col group relative"
      >
        {/* IMAGE SECTION */}
        <div className="relative h-[450px] bg-slate-50 overflow-hidden shrink-0 flex flex-col border-b-2 border-slate-100">
          {/* Main Image Container */}
          <div className="flex-grow relative flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-slate-50">
            <motion.img 
              src={getOptimizedImageUrl(data.package_image_url || "https://picsum.photos/seed/wellness-supplement/800/800", 800)} 
              alt={data.name}
              className="w-full h-full object-contain transition-transform duration-700 ease-out mix-blend-multiply cursor-zoom-in drop-shadow-2xl"
              referrerPolicy="no-referrer"
              loading="lazy"
              whileHover={{ scale: 2.5 }}
              transition={{ type: "spring", stiffness: 100, damping: 25 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/wellness-${data.id}/800/800`;
              }}
            />
            
            {/* Floating Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
              <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                <span className="text-xs font-black uppercase tracking-widest">Master Kit</span>
              </div>
            </div>

            {/* Quick View Button Overlay */}
            <button 
              onClick={() => setIsQuickViewOpen(true)}
              className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-2xl text-slate-500 hover:text-emerald-600 hover:scale-110 transition-all z-20 border-2 border-slate-100 group/qv"
              title="Quick View"
            >
              <Eye size={28} className="group-hover/qv:rotate-12 transition-transform" />
            </button>
            
            <div className="absolute top-24 right-6 bg-red-600 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl border-2 border-white/10 animate-bounce">
              -{data.discount}% OFF
            </div>
          </div>
        </div>

        {/* TEXT SECTION - Amazon Style */}
        <div className="p-8 flex flex-col flex-grow bg-white relative overflow-hidden">
          <div className="space-y-6 flex-grow">
            {/* Name & Description - Moved from image section */}
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                {data.name}
              </h3>
              <p className="text-lg text-slate-600 font-bold leading-relaxed">
                {data.description}
              </p>
            </div>

            {/* Package Includes - Clickable to open quick view */}
            <button 
              onClick={() => setIsQuickViewOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-emerald-400 hover:bg-white transition-all group/includes"
            >
              <span className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">
                PACKAGE INCLUDE {data.products?.length || 0} PRODUCTS
              </span>
              <ChevronRight size={20} className="text-slate-400 group-hover/includes:translate-x-1 transition-transform" />
            </button>

            {/* Rating & Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-black text-blue-600 tracking-tight">4.9/5.0</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100">
                  Best Seller
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">₦</span>
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {discountPrice.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-400 mb-1">/ kit</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg text-slate-400 line-through font-bold">
                  ₦{data.price.toLocaleString()}
                </span>
                <span className="text-sm text-red-600 font-black bg-red-50 px-3 py-1 rounded-xl border-2 border-red-100">
                  SAVE ₦{(data.price - discountPrice).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Health Benefits Section - Interactive & Highlighted */}
            <div className="relative">
              <motion.div 
                className="bg-emerald-50 rounded-[2rem] p-6 border-2 border-emerald-200 cursor-pointer group/benefits relative overflow-hidden shadow-sm"
                whileHover={{ backgroundColor: "#f0fdf4", borderColor: "#10b981", scale: 1.01 }}
                onClick={() => setShowFullBenefits(!showFullBenefits)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-xl shadow-emerald-200">
                      <CheckCircle2 size={20} className="animate-pulse" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Health Benefits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">
                      {showFullBenefits ? 'Show Less' : 'View All'}
                    </span>
                    <ChevronRight size={18} className={`text-emerald-500 transition-transform duration-300 ${showFullBenefits ? 'rotate-90' : 'group-hover/benefits:translate-x-1'}`} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {(showFullBenefits ? data.health_benefits : data.health_benefits.slice(0, 3)).map((benefit, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                      <span className="text-base text-slate-800 font-bold leading-snug">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Section - Amazon Style */}
          <div className="mt-6 pt-6 border-t-2 border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const message = `Hello SD GHT Health Care, I am interested in the ${data.name} master kit. Could you please provide more information on how I can place an order?`;
                  window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-600 h-16 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                <Phone size={24} className="text-emerald-600" />
                Chat with us
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOrder(data, 'package', 1);
                }}
                className="flex-[1.5] bg-emerald-600 hover:bg-emerald-700 text-white h-16 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest border-b-8 border-emerald-800/20"
              >
                Order Now
                <ShoppingBag size={24} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <PackageQuickView 
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={data}
        onOrder={(qty) => {
          setIsQuickViewOpen(false);
          onOrder(data, 'package', qty);
        }}
        onViewProduct={(product) => {
          setIsQuickViewOpen(false);
          onProductClick(product);
        }}
      />
    </>
  );
};
