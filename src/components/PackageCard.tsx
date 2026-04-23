import React, { useState } from 'react';
import { Star, ShieldCheck, ChevronRight, CheckCircle2, Globe, Truck, Eye, Leaf, Activity, Award, Plus, Minus, Phone } from 'lucide-react';
import { CONFIG } from '../config';
import { PackageQuickView } from './PackageQuickView';
import { PackageData, Product } from '../types';
import { getOptimizedImageUrl } from '../utils/cloudinary';

interface PackageCardProps {
  data: PackageData;
  allPackages?: PackageData[];
  onOrder?: (quantity: number) => void;
  onViewProduct?: (product: Product) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ data, allPackages, onOrder, onViewProduct }) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const discountedPrice = data.price * (1 - (data.discount / 100));

  return (
    <>
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group relative">
        {/* Urgency Badge - Top Center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-bounce">
          Limited Stock - Get it Today
        </div>

        {/* Image Section - Optimized Aspect Ratio */}
        <div className="relative aspect-[2/1] bg-slate-50/30 flex items-center justify-center overflow-hidden border-b border-slate-100">
          <img 
            src={getOptimizedImageUrl(data.package_image_url || (data.products?.[0]?.image_url), 600)} 
            alt={data.name}
            className="w-full h-full object-contain group-hover:scale-150 transition-transform duration-700 p-4 mix-blend-multiply cursor-zoom-in group-hover:drop-shadow-2xl"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-${data.id}/600/300`;
            }}
          />
          
          {/* Logo Overlay - Top Left - Increased Size */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
            <img 
              src="https://res.cloudinary.com/drizgfofw/image/upload/v1771685247/ght-logo_dcsmck.png" 
              alt="Logo" 
              className="h-8 md:h-12 w-auto object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quality Stamp - Bottom Right Overlay */}
          <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-emerald-600/30 flex items-center justify-center bg-white/40 backdrop-blur-sm rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <div className="text-[6px] md:text-[7px] font-black text-emerald-700 text-center leading-tight uppercase">
                100%<br/>Purely<br/>Herbal
              </div>
            </div>
          </div>

          {/* Floating Badges - Top Right */}
          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col items-end gap-1 md:gap-1.5">
            <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider border border-slate-200 shadow-md">
              PACKAGE
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-emerald-600/95 backdrop-blur-sm text-white rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black border border-emerald-500 shadow-md">
              <Globe size={10} className="md:size-3" />
              <span>Free Shipping</span>
            </div>
          </div>

          {/* Trust Badges - Bottom Left Overlay */}
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="100% Organic">
              <Leaf size={14} className="text-emerald-600" />
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="Tested & Trusted">
              <ShieldCheck size={14} className="text-blue-600" />
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="Purely Herbal">
              <Activity size={14} className="text-orange-600" />
            </div>
          </div>

          {/* Quick View Button Overlay - Responsive & Stable */}
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <button 
              onClick={() => setIsQuickViewOpen(true)}
              className="bg-white text-slate-900 px-8 py-3 rounded-full font-black text-sm shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-emerald-600 hover:text-white active:scale-95"
            >
              Quick View
            </button>
          </div>
        </div>

        {/* Content Section - Compact & Symmetric */}
        <div className="p-4 md:p-5 flex flex-col flex-grow space-y-2 md:space-y-3">
          <div className="min-h-[80px] md:min-h-[90px]">
            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight line-clamp-2 hover:text-emerald-700 cursor-pointer mb-1">
              <span className="text-emerald-600">Natural Cure For: </span>
              {data.name}
            </h3>
            <p 
              tabIndex={0}
              onMouseEnter={() => setIsExpanded(true)}
              onMouseLeave={() => setIsExpanded(false)}
              onFocus={() => setIsExpanded(true)}
              onBlur={() => setIsExpanded(false)}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-base text-slate-600 leading-relaxed font-medium cursor-pointer transition-all duration-300 ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}
            >
              {data.description || `Complete herbal solution for ${data.name.toLowerCase()}.`}
            </p>
          </div>
          
          {/* Ratings & Trust Info */}
          <div className="flex items-center justify-between gap-1 bg-slate-50 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-slate-100">
            <div className="flex items-center gap-1 md:gap-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="fill-orange-400 text-orange-400 md:size-3" />
                ))}
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 font-black">10k+ Sold</span>
            </div>
            <div className="hidden xs:flex items-center gap-1 text-[8px] font-black text-emerald-700 uppercase tracking-widest">
              <Award size={8} className="md:size-2.5" />
              Organic
            </div>
          </div>

          {/* Health Benefits - Compact List (Using Symptoms) */}
          <div className="space-y-1 py-1 min-h-[50px] md:min-h-[60px]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Perfect for:</div>
            {(isExpanded ? data.symptoms : data.symptoms.slice(0, 2)).map((benefit, i) => (
              <div key={i} className="flex items-start gap-1.5 text-sm text-slate-700 font-bold">
                <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5 md:size-4" />
                <span className={isExpanded ? "" : "line-clamp-1"}>{benefit}</span>
              </div>
            ))}
            {!isExpanded && data.symptoms.length > 2 && (
              <button 
                onClick={() => setIsQuickViewOpen(true)}
                className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 hover:text-emerald-800 transition-colors flex items-center gap-1 group/btn"
              >
                <span className="animate-pulse">+ {data.symptoms.length - 2} Benefits</span>
                <ChevronRight size={8} className="md:size-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Price Section - Optimized Spacing */}
          <div className="pt-1.5 border-t border-slate-100 mt-auto">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-2xl font-black text-slate-900">
                    ₦{discountedPrice.toLocaleString()}
                  </span>
                  {data.discount > 0 && (
                    <span className="text-sm text-slate-400 line-through font-bold">
                      ₦{data.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-[8px] md:text-[9px] font-black text-red-600 uppercase tracking-tighter mb-0.5">
                    Only 5 Left!
                  </div>
                  <div className="w-12 md:w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-[85%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Refined Size */}
          <div className="pt-0.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const message = `Hello SD GHT Health Care, I am interested in the ${data.name} package. Could you please provide more information on how I can place an order?`;
                  window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
              >
                <Phone size={14} className="text-emerald-600" />
                Chat with us
              </button>
              <button 
                onClick={() => onOrder?.(quantity)}
                className="flex-[1.5] bg-emerald-600 text-white py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-sm md:text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] flex items-center justify-center gap-1 md:gap-2 group/order animate-shimmer"
              >
                Order Now
                <ChevronRight size={14} className="md:size-4 group-hover/order:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <CheckCircle2 size={8} className="md:size-2.5 text-emerald-600" />
              Pay on Delivery
            </div>
          </div>
        </div>
      </div>

      <PackageQuickView 
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        data={data}
        allPackages={allPackages}
        onOrder={(qty) => {
          setIsQuickViewOpen(false);
          onOrder?.(qty);
        }}
        onViewProduct={(product) => {
          setIsQuickViewOpen(false);
          onViewProduct?.(product);
        }}
      />
    </>
  );
};
