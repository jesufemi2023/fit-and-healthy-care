import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star, ShieldCheck, CheckCircle2, Globe, Truck, Award, Plus, Minus, ShoppingBag, Phone, Leaf } from 'lucide-react';
import { CONFIG } from '../config';
import { PackageData, Product } from '../types';

interface PackageDetailPageProps {
  data: PackageData;
  onBack: () => void;
  onOrder: (quantity: number) => void;
  onViewProduct: (product: Product) => void;
}

export const PackageDetailPage: React.FC<PackageDetailPageProps> = ({
  data,
  onBack,
  onOrder,
  onViewProduct
}) => {
  const [quantity, setQuantity] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const discountedPrice = data.price * (1 - (data.discount / 100));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-8 pt-8"
    >
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image & Included Products */}
        <div className="space-y-8">
          <div 
            className="bg-white rounded-[40px] p-8 md:p-16 border border-slate-100 shadow-sm flex items-center justify-center aspect-square relative overflow-hidden group cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <img 
              src={(data.package_image_url || data.products?.[0]?.image_url) || null} 
              alt={data.name}
              className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              referrerPolicy="no-referrer"
            />
            {data.discount > 0 && (
              <div className="absolute top-8 right-8 bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl animate-pulse z-10">
                -{data.discount}% OFF
              </div>
            )}
            {!isZoomed && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                Hover to Zoom
              </div>
            )}
          </div>

          {/* Included Products List */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              Included Products in this Package ({data.products?.length || 0})
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {(data.products || []).map((product) => (
                <div 
                  key={product.id}
                  onClick={() => onViewProduct(product)}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-white rounded-xl p-2 shrink-0 border border-slate-100 flex items-center justify-center">
                    <img 
                      src={product.image_url || null} 
                      alt={product.name} 
                      className="w-full h-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">{product.product_code}</p>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{product.name}</h4>
                    <p className="text-sm text-slate-500 font-bold">₦{product.price_naira?.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-black bg-white px-3 py-1.5 rounded-xl text-slate-600 border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    View
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Package Info */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                {data.package_code || "PACKAGE"}
              </span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Curated Health Kit
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
              {data.name}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="fill-orange-400 text-orange-400" />
                ))}
              </div>
              <span className="text-slate-500 font-bold">(4.9/5 based on 3,120 wellness reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 pt-4 border-t border-slate-100">
            <span className="text-5xl font-black text-slate-900">
              ₦{discountedPrice.toLocaleString()}
            </span>
            {data.discount > 0 && (
              <span className="text-2xl text-slate-400 line-through font-bold">
                ₦{data.price.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-xl text-slate-600 leading-relaxed font-medium">
            {data.description}
          </p>

          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-fit">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Quantity</span>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <Minus size={18} />
              </button>
              <span className="text-xl font-black text-slate-900 w-8 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => {
                const message = `Hello SD GHT Health Care, I am interested in ${data.name}. Could you please provide more information on how I can place an order?`;
                window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-900 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
            >
              <Phone size={24} className="text-emerald-600" />
              Chat with us
            </button>
            <button 
              onClick={() => onOrder(quantity)}
              className="flex-[1.5] bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ShoppingBag size={24} />
              Order Package Now
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { icon: ShieldCheck, label: "NAFDAC Reg.", color: "text-blue-600" },
              { icon: Leaf, label: "100% Herbal", color: "text-emerald-600" },
              { icon: Award, label: "Expert Formulated", color: "text-orange-600" },
              { icon: Globe, label: "Free Shipping", color: "text-purple-600" }
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 text-center">
                <badge.icon size={24} className={badge.color} />
                <span className="text-xs font-black text-slate-700">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
