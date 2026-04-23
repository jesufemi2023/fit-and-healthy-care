import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  Award, 
  Users, 
  ChevronRight,
  ChevronLeft,
  Activity,
  Heart,
  Zap,
  Coffee,
  ShoppingBag,
  Stethoscope,
  MessageSquare,
  ClipboardList,
  Sparkles,
  Globe,
  Truck
} from 'lucide-react';
import { Product, PackageData, BlogPost } from '../types';
import { CONFIG } from '../config';
import { ProductCard } from './ProductCard';
import { PackageCard } from './PackageCard';
import { ComboCard } from './ComboCard';
import { Testimonials } from './Testimonials';
import { getOptimizedImageUrl } from '../utils/cloudinary';

interface HomeProps {
  products: Product[];
  comboPackages: PackageData[];
  recommendedPackages?: PackageData[];
  onNavigate: (tab: string) => void;
  onOrderProduct: (product: Product) => void;
  onOrderPackage: (pkg: PackageData) => void;
  onOrderComboItem?: (item: any, type: 'package' | 'product', qty: number) => void;
  onViewProduct: (product: Product) => void;
  onSelectBlog: (id: string) => void;
  onOpenChat: () => void;
}

export function Home({ 
  products, 
  comboPackages, 
  recommendedPackages = [],
  onNavigate, 
  onOrderProduct, 
  onOrderPackage, 
  onOrderComboItem,
  onViewProduct,
  onSelectBlog,
  onOpenChat
}: HomeProps) {
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const recScrollRef = useRef<HTMLDivElement>(null);
  const comboScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          setRecentBlogs(data.slice(0, 3));
        }
      } catch (e) {
        console.error("Failed to fetch blogs", e);
      }
    };
    fetchBlogs();
  }, []);

  // Auto-scroll for Trending Products
  useEffect(() => {
    if (products.length <= 4) return;
    const timer = setInterval(() => {
      if (trendingScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = trendingScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          trendingScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          trendingScrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [products.length]);

  // Auto-scroll for Recommended Packages
  useEffect(() => {
    if (recommendedPackages.length <= 1) return;
    const timer = setInterval(() => {
      if (recScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = recScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          recScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          recScrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [recommendedPackages.length]);

  // Auto-scroll for Combo Packages
  useEffect(() => {
    if (comboPackages.length <= 1) return;
    const timer = setInterval(() => {
      if (comboScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = comboScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          comboScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          comboScrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [comboPackages.length]);

  const scrollPrev = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -ref.current.clientWidth, behavior: 'smooth' });
    }
  };

  const scrollNext = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: ref.current.clientWidth, behavior: 'smooth' });
    }
  };

  // Get top 4 products for bestsellers
  const bestSellers = products.slice(0, 4);

  const heroImages = CONFIG.heroImages;

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className="space-y-8 md:space-y-10 pb-12">
      
      {/* 1. Hero Section - Full Screen Display */}
      <section className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] w-full overflow-hidden bg-black group">
        <div className="absolute inset-0">
          {heroImages.map((img, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: index === currentHeroIndex ? 1 : 0,
              }}
              transition={{ 
                opacity: { duration: 1.2, ease: "easeInOut" }
              }}
            >
              {/* Blurred background to fill space without cropping */}
              <img 
                src={getOptimizedImageUrl(img, 1200)} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110"
                referrerPolicy="no-referrer"
              />
              {/* Main image - now using object-contain to show full image */}
              <img 
                src={getOptimizedImageUrl(img, 1200)} 
                alt={`Hero image ${index + 1}`} 
                className="relative w-full h-full object-contain z-10"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-supplement-${index}/1200/675`;
                }}
              />
              {/* Subtle Overlay for readability only if needed */}
              <div className="absolute inset-0 bg-black/20"></div>
            </motion.div>
          ))}
        </div>

        {/* Authority Labels on Sides */}
        <div className="absolute inset-0 z-20 pointer-events-none hidden lg:flex items-center justify-between px-6 xl:px-12">
          {/* Left Side Labels */}
          <div className="flex flex-col gap-6">
            {[
              { icon: Globe, title: "Free Delivery", desc: "Across Nigeria", highlight: true },
              { icon: Leaf, title: "100% Organic", desc: "Pure herbal" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + (i * 0.2) }}
                className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md border border-white/10 pointer-events-auto w-64 ${item.highlight ? 'bg-emerald-600/90 text-white shadow-2xl' : 'bg-white/10 text-white'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.highlight ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <item.icon size={24} />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-black text-sm uppercase tracking-tight leading-none mb-1 truncate">{item.title}</h4>
                  <p className={`text-[10px] font-bold truncate ${item.highlight ? 'text-emerald-100' : 'text-white/60'}`}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side Labels */}
          <div className="flex flex-col gap-6">
            {[
              { icon: Truck, title: "Worldwide", desc: "Any country", highlight: true },
              { icon: Award, title: "Expert Formulated", desc: "Backed by science" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + (i * 0.2) }}
                className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md border border-white/10 pointer-events-auto w-64 ${item.highlight ? 'bg-emerald-600/90 text-white shadow-2xl' : 'bg-white/10 text-white'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.highlight ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <item.icon size={24} />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-black text-sm uppercase tracking-tight leading-none mb-1 truncate">{item.title}</h4>
                  <p className={`text-[10px] font-bold truncate ${item.highlight ? 'text-emerald-100' : 'text-white/60'}`}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-end justify-end p-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="pointer-events-auto"
          >
            <button 
              onClick={() => onNavigate('products')}
              className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-xl hover:bg-emerald-500 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              Shop Now <ShoppingBag size={24} />
            </button>
          </motion.div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === currentHeroIndex ? "bg-emerald-400 w-12" : "bg-white/30 w-6 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Carousel Controls */}
        <div className="hidden md:block">
          <button 
            onClick={() => setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
            className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 z-20"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </section>

      {/* 2. Authority Bar (Mobile Only) */}
      <section className="lg:hidden bg-white py-6 shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Globe, title: "Free Delivery", desc: "Across Nigeria", highlight: true },
              { icon: Truck, title: "Worldwide", desc: "Any country", highlight: true },
              { icon: Leaf, title: "100% Organic", desc: "Pure herbal" },
              { icon: Award, title: "Expert Formulated", desc: "Backed by science" }
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 rounded-xl transition-all ${item.highlight ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.highlight ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className={`font-black text-[10px] uppercase tracking-tight leading-none mb-0.5 truncate ${item.highlight ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                  <p className={`text-[8px] font-bold truncate ${item.highlight ? 'text-emerald-100' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Individual Products */}
      <section className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Trending Now</h2>
            <div className="h-2 w-24 bg-emerald-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('products')} 
              className="hidden md:flex text-emerald-600 font-black text-lg items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest mr-4"
            >
              View All <ArrowRight size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollPrev(trendingScrollRef)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scrollNext(trendingScrollRef)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
        <div 
          ref={trendingScrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-6 pb-4"
        >
          {products.map(product => (
            <div 
              key={product.id} 
              className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.125rem)]"
            >
              <ProductCard 
                product={product}
                onQuickView={onViewProduct}
                onOrder={() => onOrderProduct(product)}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 text-center md:hidden">
          <button 
            onClick={() => onNavigate('products')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm shadow-lg"
          >
            View All Products
          </button>
        </div>
      </section>

      {/* 4. Expert Recommended Packages */}
      {recommendedPackages.length > 0 && (
        <section className="bg-slate-50 py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Health Solutions</h2>
                <p className="text-xl text-slate-500 font-bold">Curated packages for specific health needs.</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onNavigate('recommended')} 
                  className="hidden md:flex text-emerald-600 font-black text-lg items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest mr-4"
                >
                  View All <ArrowRight size={24} />
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scrollPrev(recScrollRef)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => scrollNext(recScrollRef)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            </div>
            <div 
              ref={recScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-8 pb-8"
            >
              {recommendedPackages.map(pkg => (
                <div 
                  key={pkg.id} 
                  className="snap-start flex-shrink-0 w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.3333%-1.5rem)]"
                >
                  <PackageCard 
                    data={pkg} 
                    allPackages={recommendedPackages} 
                    onOrder={() => onOrderPackage(pkg)} 
                    onViewProduct={onViewProduct} 
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 text-center md:hidden">
              <button 
                onClick={() => onNavigate('recommended')}
                className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm shadow-lg"
              >
                View All Solutions
              </button>
            </div>
          </div>
        </section>
      )}


      {/* 5. Combo Packs - Elderly Accessible Design */}
      {comboPackages.length > 0 && (
        <section className="bg-emerald-950 py-8 md:py-10 rounded-[3rem] mx-4 md:mx-8">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-10 space-y-6">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                Ultimate <span className="text-emerald-400">Combo Packs</span>
              </h2>
              <p className="text-2xl md:text-3xl text-emerald-100/80 max-w-4xl mx-auto font-bold leading-relaxed">
                Maximum value bundles designed for complete body restoration. Perfect for long-term wellness.
              </p>
              <div className="h-1.5 w-48 bg-emerald-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
              {comboPackages.map(pkg => (
                <div key={pkg.id} className="w-full">
                  <ComboCard 
                    data={pkg} 
                    onOrder={onOrderComboItem || ((item) => onOrderPackage(item))} 
                    onProductClick={onViewProduct} 
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <button 
                onClick={() => onNavigate('combo')} 
                className="bg-emerald-500 text-white px-16 py-6 rounded-full font-black text-2xl hover:bg-emerald-400 transition-all shadow-3xl shadow-emerald-900/50 uppercase tracking-widest"
              >
                View All Master Kits
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 6. Testimonials Section */}
      <Testimonials onViewAll={() => onNavigate('testimonials')} />

      {/* 7. Ask Virtual Guide Teaser */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 text-center border-4 border-emerald-100 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-300 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6 md:space-y-10">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-2xl text-white mb-4 md:mb-8 rotate-3">
              <Sparkles size={32} className="md:hidden" />
              <Sparkles size={48} className="hidden md:block" />
            </div>
            <h2 className="text-3xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Instant <span className="text-emerald-600">Health Chat</span>
            </h2>
            <p className="text-lg md:text-3xl text-slate-600 font-bold leading-relaxed">
              Have a quick question? Our Virtual Health Guide is available 24/7 for immediate guidance.
            </p>
            <div className="pt-4 md:pt-6">
              <button 
                onClick={onOpenChat}
                className="bg-emerald-600 text-white px-8 md:px-16 py-4 md:py-6 rounded-full font-black text-lg md:text-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 uppercase tracking-widest flex items-center justify-center gap-3 md:gap-4 mx-auto"
              >
                Chat with Virtual Guide <MessageSquare size={24} className="md:hidden" />
                <MessageSquare size={32} className="hidden md:block" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Education & Lifestyle (Blog) */}
      {recentBlogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Latest Health Insights</h2>
            <button onClick={() => onNavigate('blog')} className="text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700 transition-colors">
              Read Journal <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {recentBlogs.map((post) => (
              <div 
                key={post.id} 
                className="group cursor-pointer"
                onClick={() => onSelectBlog(post.id)}
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-4 relative">
                  <img 
                    src={getOptimizedImageUrl(post.image_url || `https://picsum.photos/seed/supplement-blog-${post.id}/600/400`, 600)} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/healthcare-blog-${post.id}/600/400`;
                    }}
                  />
                  {post.category && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {post.category}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 font-medium">
                  {post.meta_description || post.content.substring(0, 100).replace(/[#*`]/g, '') + '...'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
