import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShieldCheck, ChevronRight, CheckCircle2, Globe, Truck, Info, MessageSquare, Plus, Minus, ShoppingBag, Phone } from 'lucide-react';
import { CONFIG } from '../config';
import { PackageData, Product } from '../types';

interface PackageQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  data: PackageData;
  allPackages?: PackageData[];
  onOrder?: (quantity: number) => void;
  onViewProduct?: (product: Product) => void;
}

const themeColors = {
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    text: 'text-emerald-700',
    lightBg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    gradient: 'from-emerald-500/5',
    shadow: 'shadow-emerald-100'
  }
};

export const PackageQuickView: React.FC<PackageQuickViewProps> = ({ 
  isOpen, 
  onClose, 
  data,
  allPackages,
  onOrder,
  onViewProduct
}) => {
  const theme = themeColors.emerald;
  const [quantity, setQuantity] = React.useState(1);
  const discountedPrice = data.price * (1 - (data.discount / 100));

  React.useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col lg:flex-row relative"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 z-50 bg-white p-2 rounded-full border border-slate-100 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all duration-300 shadow-sm"
              >
                <X size={20} />
              </button>

              {/* Left Side: Visuals & Browsing */}
              <div className="lg:w-[45%] bg-slate-50/50 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto custom-scrollbar">
                {/* Image Section */}
                <div className="p-8 md:p-12 flex items-center justify-center relative overflow-hidden shrink-0">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src={data.package_image_url || (data.products?.[0]?.image_url)} 
                      alt={data.name} 
                      className="w-full max-h-[400px] object-contain mix-blend-multiply drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)]" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-quick-${data.id}/800/800`;
                      }}
                    />
                  </div>
                </div>

                {/* Products in this Package (Moved to Left Column) */}
                <div className="p-6 md:p-8 space-y-6 bg-white/50 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200/50 pb-2">Included in this Package</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {(data.products || []).map((product) => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 group/prod hover:shadow-md hover:border-emerald-200 transition-all duration-300"
                      >
                        <div className="w-14 h-14 bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-center justify-center shrink-0">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/supplement-item-${product.id}/400/400`;
                            }}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h5 className="text-xs font-black text-slate-900 line-clamp-1 mb-1">{product.name}</h5>
                          <button 
                            onClick={() => onViewProduct?.(product)}
                            className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors"
                          >
                            <Info size={10} />
                            View Details
                          </button>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover/prod:text-emerald-500 group-hover/prod:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Packages Browsing List */}
                {allPackages && allPackages.length > 0 && (
                  <div className="p-6 bg-white border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Other Solutions</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {allPackages.map((pkg) => (
                        <div 
                          key={pkg.id}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-default
                            ${pkg.id === data.id 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                        >
                          {pkg.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Content */}
              <div className="lg:w-[55%] flex flex-col overflow-y-auto bg-white">
                <div className="p-8 md:p-12 space-y-10">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Premium Package
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-orange-400 text-orange-400" />
                        <span className="text-xs font-black text-slate-900">4.9</span>
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
                      {data.name} <span className="text-emerald-600">Master Kit</span>
                    </h2>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Overview</h4>
                    <p className="text-base text-slate-600 font-medium leading-relaxed">
                      {data.description}
                    </p>
                  </div>

                  {/* Benefits & Symptoms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Health Benefits</h4>
                      <div className="space-y-3">
                        {data.health_benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-1 bg-emerald-100 p-1 rounded-md">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                            </div>
                            <span className="text-sm text-slate-600 font-bold leading-tight">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Target Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.symptoms.map((symptom, i) => (
                          <span key={i} className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-100">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-10 border-t border-slate-100 space-y-8">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-bold mb-1">₦{data.price.toLocaleString()}</span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-black text-slate-900">₦{discountedPrice.toLocaleString()}</span>
                          {data.discount > 0 && (
                            <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              Save {data.discount}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Availability</div>
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          In Stock
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full justify-between">
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
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            const message = `Hello SD GHT Health Care, I am interested in the ${data.name} package. Could you please provide more information on how I can place an order?`;
                            window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex-1 h-16 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone size={20} className="text-emerald-600" />
                          Chat with us
                        </button>
                        <button 
                          onClick={() => onOrder?.(quantity)}
                          className="flex-[1.5] h-16 bg-emerald-600 text-white rounded-2xl font-black text-lg md:text-2xl uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <ShoppingBag size={22} className="md:w-[28px] md:h-[28px]" />
                          Order Now
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-slate-300" />
                        Worldwide Delivery
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-slate-300" />
                        Free Shipping Nigeria
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
