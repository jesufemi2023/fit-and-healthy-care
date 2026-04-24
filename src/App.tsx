import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  ShoppingBag, 
  User, 
  Search, 
  History,
  ChevronRight, 
  Stethoscope, 
  Phone, 
  CheckCircle2,
  Database as DbIcon,
  ShieldCheck,
  LayoutGrid,
  Globe,
  Truck,
  Award,
  Menu,
  X,
  Star,
  Eye,
  Leaf,
  ArrowLeft,
  Info,
  MessageSquare,
  MapPin,
  Plus,
  Minus,
  Package,
  FileText,
  Home as HomeIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CONFIG } from "./config";
import { CacheService } from "./utils/cache";

import { Home } from "./components/Home";
import { About } from "./components/About";
import { PackageCard } from "./components/PackageCard";
import { ProductCard } from "./components/ProductCard";
import { ComboCard } from "./components/ComboCard";
import { OrderDrawer } from "./components/OrderDrawer";
import { BlogList } from "./components/blog/BlogList";
import { BlogPost } from "./components/blog/BlogPost";
import { PackageQuickView } from "./components/PackageQuickView";
import { AIChatBot } from "./components/chat/AIChatBot";
import { SearchResults } from "./components/SearchResults";
import AdminDashboard from "./components/AdminDashboard";
import { TestimonialsPage } from "./components/TestimonialsPage";
import { Product, PackageData } from "./types";
import { trackPageView, trackConsultation, trackWhatsAppClick, trackBlogView } from "./lib/analytics";

interface Consultation {
  id: string;
  patient_name: string;
  phone: string;
  illness: string;
  symptoms: string;
  ai_recommendation: string;
  recommended_products: string[];
  created_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "about" | "products" | "recommended" | "combo" | "consultation" | "history" | "product-detail" | "admin" | "blog" | "blog-post" | "search" | "testimonials">("home");
  const [previousTab, setPreviousTab] = useState<typeof activeTab>("home");

  const navigateTo = (tab: typeof activeTab) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedPackages, setRecommendedPackages] = useState<PackageData[]>([]);
  const [comboPackages, setComboPackages] = useState<PackageData[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [orderItem, setOrderItem] = useState<{ item: any, type: 'package' | 'product', qty: number } | null>(null);
  const [distributorId, setDistributorId] = useState(CONFIG.defaults.distributorId);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dId = params.get('ref') || params.get('distributor_id');
    if (dId) setDistributorId(dId);
  }, []);

  useEffect(() => {
    if (selectedProduct) setQuickViewQuantity(1);
  }, [selectedProduct]);

  const openOrderDrawer = (item: any, type: 'package' | 'product', qty: number = 1) => {
    setOrderItem({ item, type, qty });
    setIsOrderDrawerOpen(true);
    setSelectedProduct(null); // Close quick view modal if open
  };
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Robust Session Management (Anonymous RLS)
  const [accessToken] = useState(() => {
    const existing = localStorage.getItem("ght_access_token");
    if (existing) return existing;
    const newToken = crypto.randomUUID();
    localStorage.setItem("ght_access_token", newToken);
    return newToken;
  });

  // Form State - No hardcoding
  const [formData, setFormData] = useState({
    patient_name: "",
    phone: "",
    illness: "",
    symptoms: "",
    distributor_id: distributorId
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, distributor_id: distributorId }));
  }, [distributorId]);

  useEffect(() => {
    const initApp = async () => {
      // 0. CHECK VERSION FIRST: Clear cache if version mismatch (e.g. after remix or update)
      CacheService.checkVersion(CONFIG.defaults.cacheVersion);

      // 1. Try to load from cache first for instant UI
      const cachedProducts = CacheService.get(CacheService.KEYS.PRODUCTS);
      const cachedPackages = CacheService.get(CacheService.KEYS.PACKAGES);

      if (cachedProducts) setProducts(cachedProducts);
      if (cachedPackages) {
        setRecommendedPackages(cachedPackages.filter((p: any) => !p.is_combo));
        setComboPackages(cachedPackages.filter((p: any) => p.is_combo));
      }

      // 2. Check if cache is valid in background
      const isValid = await CacheService.isCacheValid();
      
      if (!isValid || !cachedProducts || !cachedPackages) {
        // Cache is stale or missing, fetch fresh data
        fetchProducts();
        fetchRecommendedPackages();
      }
    };

    initApp();
  }, []); // Only on mount

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    
    // Track Page View
    const titles: Record<string, string> = {
      home: "Home",
      about: "About Us",
      products: "All Products",
      recommended: "Expert Solutions",
      combo: "Combo Packs",
      consultation: "AI Consultation",
      history: "Consultation History",
      "product-detail": `Product: ${viewingProduct?.name || "Detail"}`,
      admin: "Admin Dashboard",
      blog: "Health Blog",
      "blog-post": "Blog Article",
      search: `Search: ${searchQuery}`,
      testimonials: "Success Stories"
    };
    trackPageView(activeTab, titles[activeTab]);
  }, [activeTab, viewingProduct, searchQuery]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for products, retrying in 2s...");
          setTimeout(fetchProducts, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        CacheService.save(CacheService.KEYS.PRODUCTS, data);
      } else {
        console.error("Products data is not an array:", data);
        setProducts([]);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setProducts([]);
    }
  };

  const fetchRecommendedPackages = async () => {
    try {
      const res = await fetch("/api/recommended-packages");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for packages, retrying in 2s...");
          setTimeout(fetchRecommendedPackages, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: PackageData[] = await res.json();
      if (Array.isArray(data)) {
        setRecommendedPackages(data.filter(p => !p.is_combo));
        setComboPackages(data.filter(p => p.is_combo));
        CacheService.save(CacheService.KEYS.PACKAGES, data);
      } else {
        setRecommendedPackages([]);
        setComboPackages([]);
      }
    } catch (e) {
      console.error("Failed to fetch recommended packages:", e);
      setRecommendedPackages([]);
      setComboPackages([]);
    }
  };

  useEffect(() => {
    if (adminPassword && activeTab === 'admin' && !isAdminAuthenticated) {
      handleAdminLogin();
    }
  }, [activeTab]);

  useEffect(() => {
    // Deep Linking Logic: Check for buy_product, buy_package, product, package, or blog in URL
    const handleDeepLinking = () => {
      if (loading) return;

      const params = new URLSearchParams(window.location.search);
      const keys = ['buy_product', 'buy_package', 'product', 'package', 'blog'];
      const presentKeys = keys.filter(k => params.has(k));
      
      if (presentKeys.length === 0) return;

      // 1. Handle Blog (Immediate)
      const blogId = params.get('blog');
      if (blogId !== null && blogId) {
        setSelectedBlogId(blogId);
        setActiveTab("blog-post");
      }

      // 2. Handle Products/Packages (Needs Data)
      const hasProductParams = presentKeys.some(k => k !== 'blog');
      const dataReady = products.length > 0 || recommendedPackages.length > 0;

      if (hasProductParams && !dataReady) {
        return; // Wait for data
      }

      if (dataReady) {
        const buyProductId = params.get('buy_product');
        const buyPackageId = params.get('buy_package');
        const productId = params.get('product');
        const packageId = params.get('package');

        if (buyProductId) {
          const product = products.find(p => p.id === buyProductId || p.product_code === buyProductId);
          if (product) openOrderDrawer(product, 'product');
        }
        if (buyPackageId) {
          const pkg = [...recommendedPackages, ...comboPackages].find(p => p.id === buyPackageId || p.package_code === buyPackageId);
          if (pkg) openOrderDrawer(pkg, 'package');
        }
        if (productId) {
          const product = products.find(p => p.id === productId || p.product_code === productId);
          if (product) {
            setViewingProduct(product);
            setActiveTab("product-detail");
          }
        }
        if (packageId) {
          const pkg = [...recommendedPackages, ...comboPackages].find(p => p.id === packageId || p.package_code === packageId);
          if (pkg) setSelectedPackage(pkg);
        }
      }

      // 3. Clear URL parameters to prevent "sticky" state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    };

    handleDeepLinking();
  }, [products, recommendedPackages, comboPackages, loading]);

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for consultation

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-access-token": accessToken
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          alert(`Consultation Submitted!\n\nExpert Recommendation: ${data.ai_recommendation}`);
          trackConsultation(formData.illness);
          setFormData({ ...formData, patient_name: "", phone: "", illness: "", symptoms: "" });
          navigateTo("history");
        }
      } else {
        const status = res.status;
        if (status === 504 || status === 503 || status === 502 || status === 500) {
          alert("The AI expert is taking a long time to analyze your symptoms or the server is busy. Your consultation might still be processing. Please check your history in a minute.");
        } else {
          alert(`The server is currently busy (Status: ${status}). Please try again in a few seconds.`);
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        alert("Request timed out. The AI is experiencing high demand. Please check your history in a moment to see if it processed.");
      } else {
        alert("Failed to submit consultation. Please check your connection or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      // Try to fetch a simple admin endpoint to verify the password
      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-password": adminPassword }
      });
      
      if (res.ok) {
        setIsAdminAuthenticated(true);
      } else {
        const data = await res.json();
        alert(data.error || "Invalid Password");
      }
    } catch (e) {
      alert("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    navigateTo("home");
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/my-consultations", { headers: { "x-access-token": accessToken } }),
        fetch("/api/my-orders", { headers: { "x-access-token": accessToken } })
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setConsultations(Array.isArray(cData) ? cData : []);
      }

      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(Array.isArray(oData) ? oData : []);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (location: string) => {
    trackWhatsAppClick(location);
    window.open(`https://wa.me/${CONFIG.whatsapp.number.replace(/\D/g, '')}?text=${encodeURIComponent(CONFIG.whatsapp.defaultMessage)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Sticky Top Navigation Container */}
      <div className="sticky top-0 z-50 shadow-sm">
        {/* Top Announcement Bar */}
        <div className="bg-emerald-900 text-white py-2 px-4 text-center text-[9px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-8">
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-emerald-400" />
              Free Delivery Across Nigeria
            </span>
            <div className="w-[1px] h-3 bg-white/20 hidden sm:block"></div>
            <span className="flex items-center gap-1.5">
              <Truck size={12} className="text-emerald-400" />
              We Deliver Worldwide
            </span>
            <div className="w-[1px] h-3 bg-white/20 hidden sm:block"></div>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Pay on Delivery
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              {CONFIG.company.logoUrl ? (
                <img 
                  src={CONFIG.company.logoUrl} 
                  alt={CONFIG.company.name} 
                  className="h-6 md:h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg mb-1">
                  <Activity size={14} className="md:hidden" />
                  <Activity size={18} className="hidden md:block" />
                </div>
              )}
              <div className="flex flex-col items-center mt-1">
                <h1 className="font-bold text-[10px] md:text-sm tracking-tight text-slate-800 leading-none">{CONFIG.company.name}</h1>
                <p className="text-[6px] md:text-[8px] uppercase tracking-wider font-semibold text-emerald-600 mt-0.5">{CONFIG.company.subtitle}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 flex-1 px-4">
              {CONFIG.navigation.filter(item => ["home", "testimonials", "products", "recommended", "combo", "blog"].includes(item.id)).map((item) => {
                const Icon = item.id === "home" ? HomeIcon :
                             item.id === "testimonials" ? MessageSquare :
                             item.id === "products" ? ShoppingBag : 
                             item.id === "recommended" ? LayoutGrid :
                             item.id === "combo" ? Package :
                             item.id === "blog" ? FileText : HomeIcon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id as any)}
                    className={`flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-bold transition-all whitespace-nowrap py-2 px-1 border-b-2 ${
                      activeTab === item.id 
                        ? "text-emerald-600 border-emerald-600" 
                        : "text-slate-500 border-transparent hover:text-emerald-500 hover:border-emerald-200"
                    }`}
                  >
                    <Icon size={16} className="xl:w-[18px] xl:h-[18px]" />
                    {item.label}
                  </button>
                );
              })}

              {/* More Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1.5 xl:gap-2 text-xs xl:text-sm font-bold transition-all whitespace-nowrap py-2 px-1 border-b-2 ${
                    ["consultation", "history", "admin", "about"].includes(activeTab)
                      ? "text-emerald-600 border-emerald-600"
                      : "text-slate-500 border-transparent hover:text-emerald-500 hover:border-emerald-200"
                  }`}
                >
                  More <ChevronRight size={16} className={`transition-transform ${isMoreMenuOpen ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                    >
                      {CONFIG.navigation.filter(item => !["home", "testimonials", "products", "recommended", "combo", "blog"].includes(item.id)).map((item) => {
                        const Icon = item.id === "about" ? Info :
                                     item.id === "consultation" ? Stethoscope : 
                                     item.id === "history" ? History :
                                     item.id === "admin" ? DbIcon : User;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigateTo(item.id as any);
                              setIsMoreMenuOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-all ${
                              activeTab === item.id 
                                ? "text-emerald-600 bg-emerald-50" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-500"
                            }`}
                          >
                            <Icon size={16} />
                            {item.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className={`flex items-center transition-all duration-300 ${isSearchVisible ? 'w-40 md:w-64' : 'w-10'}`}>
                <AnimatePresence mode="wait">
                  {isSearchVisible ? (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative flex items-center w-full"
                    >
                      <input 
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            navigateTo('search');
                            setIsSearchVisible(false);
                          }
                        }}
                        placeholder="Search health..."
                        className="w-full bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none"
                      />
                      <button 
                        onClick={() => setIsSearchVisible(false)}
                        className="absolute right-2 p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setIsSearchVisible(true)}
                      className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <Search size={20} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1 md:mx-2"></div>
              <div className="hidden xs:flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] md:text-xs font-bold border border-emerald-100">
                <ShieldCheck size={12} className="md:hidden" />
                <ShieldCheck size={14} className="hidden md:block" />
                <span className="whitespace-nowrap">RLS SECURE</span>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white border-t border-slate-100 overflow-y-auto max-h-[calc(100vh-80px)]"
              >
                <div className="px-4 py-6 space-y-4">
                  {/* Mobile Search */}
                  <div className="pb-2">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 text-slate-400" size={18} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            navigateTo('search');
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        placeholder="Search products, symptoms..."
                        className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 outline-none font-bold"
                      />
                    </div>
                  </div>

                  {CONFIG.navigation.map((item) => {
                    const Icon = item.id === "home" ? HomeIcon :
                                 item.id === "about" ? Info :
                                 item.id === "products" ? ShoppingBag : 
                                 item.id === "consultation" ? Stethoscope : 
                                 item.id === "history" ? History :
                                 item.id === "combo" ? Package :
                                 item.id === "blog" ? FileText :
                                 item.id === "admin" ? DbIcon : User;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigateTo(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-4 w-full p-4 rounded-2xl text-base font-bold transition-all ${
                          activeTab === item.id 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={22} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      <main className={`mx-auto transition-all duration-500 ${
        activeTab === "home" || activeTab === "about" || activeTab === "search" || activeTab === "testimonials"
          ? "max-w-none px-0 py-0" 
          : activeTab === "combo" 
            ? "max-w-[1440px] px-4 py-8 md:py-12" 
            : "max-w-7xl px-4 py-8 md:py-12"
      }`}>
        <AnimatePresence mode="wait">
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20"
            >
              <SearchResults 
                query={searchQuery}
                products={products}
                recommendedPackages={recommendedPackages}
                comboPackages={comboPackages}
                onClose={() => navigateTo("home")}
                onViewProduct={(p) => {
                  setViewingProduct(p);
                  navigateTo("product-detail");
                }}
                onOrderProduct={(p) => openOrderDrawer(p, "product")}
                onOrderPackage={(pkg) => openOrderDrawer(pkg, "package")}
              />
            </motion.div>
          )}
          {activeTab === "testimonials" && (
            <motion.div
              key="testimonials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TestimonialsPage onBack={() => navigateTo("home")} />
            </motion.div>
          )}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Home 
                products={products}
                comboPackages={comboPackages}
                recommendedPackages={recommendedPackages}
                onNavigate={(tab) => navigateTo(tab as any)}
                onOrderProduct={(p) => openOrderDrawer(p, 'product')}
                onOrderPackage={(pkg) => openOrderDrawer(pkg, 'package')}
                onOrderComboItem={(item, type, qty) => openOrderDrawer(item, type, qty)}
                onViewProduct={(product) => {
                  setViewingProduct(product);
                  navigateTo("product-detail");
                }}
                onSelectBlog={(id) => {
                  setSelectedBlogId(id);
                  navigateTo("blog-post");
                }}
                onOpenChat={() => setIsChatOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <About onNavigate={navigateTo} />
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Premium Health Products</h2>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base">Scientifically formulated supplements for your wellness journey.</p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name, benefit, or ailment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-3 md:gap-8">
                {products
                  .filter((p) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(query) ||
                      p.short_desc.toLowerCase().includes(query) ||
                      p.health_benefits.some((b) => b.toLowerCase().includes(query))
                    );
                  })
                  .map((product) => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onQuickView={setSelectedProduct}
                      onOrder={(p) => openOrderDrawer(p, 'product')}
                    />
                  ))}
                {products.filter((p) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.short_desc.toLowerCase().includes(query) ||
                    p.health_benefits.some((b) => b.toLowerCase().includes(query))
                  );
                }).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                      <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-6 text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-4"
                    >
                      Clear all search
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "recommended" && (
            <motion.div
              key="recommended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-20"
            >
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Expert-Curated Solutions</h2>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Discover powerful combinations designed to target specific health concerns with maximum synergy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-8 md:gap-10">
                {recommendedPackages.map((pkg) => (
                  <PackageCard 
                    key={pkg.id}
                    data={pkg}
                    allPackages={recommendedPackages}
                    onOrder={() => openOrderDrawer(pkg, 'package')}
                    onViewProduct={(product) => {
                      setViewingProduct(product);
                      navigateTo("product-detail");
                    }}
                  />
                ))}
                {recommendedPackages.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500">No recommended packages found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "combo" && (
            <motion.div
              key="combo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-32"
            >
              {/* Marketing Banner Section (828x250 Safe Zone) */}
              <div className="max-w-[828px] mx-auto aspect-[828/250] bg-emerald-900 rounded-xl overflow-hidden relative shadow-lg group">
                <img 
                  src="https://picsum.photos/seed/wellness-banner/1000/300" 
                  alt="Marketing Banner" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 space-y-2 md:space-y-4">
                  <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold w-fit uppercase tracking-widest">
                    Limited Time Offer
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    Ultimate Wellness <br /> <span className="text-amber-400">Master Kits</span>
                  </h2>
                  <p className="text-white/80 text-xs md:text-sm font-medium max-w-md hidden sm:block">
                    Comprehensive, science-backed health solutions curated for total body vitality and long-term wellness.
                  </p>
                </div>
              </div>

              {/* Amazon Style Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-4 md:gap-6">
                {comboPackages.map((pkg) => (
                  <ComboCard 
                    key={pkg.id} 
                    data={pkg} 
                    onOrder={openOrderDrawer}
                    onProductClick={(product) => {
                      setViewingProduct(product);
                      navigateTo("product-detail");
                    }}
                  />
                ))}
                {comboPackages.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">No combo packs available yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "product-detail" && viewingProduct && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-20"
            >
              {/* Breadcrumbs / Back Button */}
              <button 
                onClick={() => navigateTo(previousTab === "product-detail" ? "products" : previousTab)}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Image Gallery Style */}
                <div className="space-y-6">
                  <div 
                    className="bg-white rounded-[40px] p-8 md:p-16 border border-slate-100 shadow-sm flex items-center justify-center aspect-square relative overflow-hidden group cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                  >
                    <img 
                      src={viewingProduct.image_url} 
                      alt={viewingProduct.name}
                      className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                      style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-8 right-8 bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl animate-pulse z-10">
                      -{viewingProduct.discount_percent}% OFF
                    </div>
                    {!isZoomed && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        Hover to Zoom
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <img 
                          src={viewingProduct.image_url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Product Info */}
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        {viewingProduct.product_code}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        In Stock
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
                      {viewingProduct.name}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={20} className="fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <span className="text-slate-500 font-bold">(4.9/5 based on 2,450 reviews)</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-slate-900">
                      ₦{(viewingProduct.price_naira * (1 - viewingProduct.discount_percent / 100)).toLocaleString()}
                    </span>
                    {viewingProduct.discount_percent > 0 && (
                      <span className="text-2xl text-slate-400 line-through font-bold">
                        ₦{viewingProduct.price_naira.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xl text-slate-600 leading-relaxed font-medium">
                    {viewingProduct.short_desc}
                  </p>

                  <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-fit">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                        className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="text-xl font-black text-slate-900 w-8 text-center">{detailQuantity}</span>
                      <button 
                        onClick={() => setDetailQuantity(detailQuantity + 1)}
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
                        const message = `Hello SD GHT Health Care, I am interested in ${viewingProduct.name}. Could you please provide more information on how I can place an order?`;
                        window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-900 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                    >
                      <Phone size={24} className="text-emerald-600" />
                      Chat with us
                    </button>
                    <button 
                      onClick={() => openOrderDrawer(viewingProduct, 'product', detailQuantity)}
                      className="flex-[1.5] bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <ShoppingBag size={24} />
                      Order Now
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {[
                      { icon: ShieldCheck, label: "NAFDAC Reg.", color: "text-blue-600" },
                      { icon: Leaf, label: "100% Herbal", color: "text-emerald-600" },
                      { icon: Award, label: "Premium Quality", color: "text-orange-600" },
                      { icon: Globe, label: "Free Shipping", color: "text-purple-600" }
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 text-center">
                        <badge.icon size={24} className={badge.color} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-slate-200">
                <div className="lg:col-span-2 space-y-12">
                  <section className="space-y-4">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Description</h3>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-lg text-slate-700 leading-relaxed">
                        {viewingProduct.long_desc || "No detailed description available for this product yet. Please contact our support for more information."}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Health Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.health_benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                          </div>
                          <span className="text-lg font-bold text-slate-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Usage & Dosage</h3>
                      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {viewingProduct.usage || "Follow the instructions on the product packaging or consult with our health experts."}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Safety Warnings</h3>
                      <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {viewingProduct.warning || "Keep out of reach of children. Consult your doctor if pregnant or nursing."}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-widest">Product Specs</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">Product Code</span>
                        <span className="font-black">{viewingProduct.product_code}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">Package</span>
                        <span className="font-black">{viewingProduct.package || "Standard"}</span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-slate-400 font-bold block">Ingredients</span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {viewingProduct.ingredients || "Natural herbal extracts and proprietary blends."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-600 p-8 rounded-[40px] text-white space-y-4">
                    <h3 className="text-xl font-black">Need Help?</h3>
                    <p className="text-emerald-100 font-medium">
                      Speak with a professional health consultant about this product.
                    </p>
                    <button 
                      onClick={() => navigateTo("consultation")}
                      className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-black hover:bg-emerald-50 transition-colors"
                    >
                      Free Consultation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "blog" && (
          <BlogList 
            onSelectPost={(id) => {
              setSelectedBlogId(id);
              navigateTo("blog-post");
            }} 
          />
        )}

        {activeTab === "blog-post" && selectedBlogId && (
          <BlogPost 
            id={selectedBlogId} 
            onBack={() => navigateTo("blog")} 
            onOrderPackage={(pkg) => openOrderDrawer(pkg, 'package')}
          />
        )}

        {activeTab === "consultation" && (
            <motion.div
              key="consultation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-6 md:p-12 shadow-2xl shadow-slate-200/50">
                <div className="text-center mb-8 md:mb-12">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Stethoscope size={24} className="md:size-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Free Health Consultation</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">Get professional recommendations based on your symptoms.</p>
                </div>

                <form onSubmit={handleConsultation} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.patient_name}
                        onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="+234..."
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Primary Illness (if known)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hypertension, Diabetes"
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                      value={formData.illness}
                      onChange={(e) => setFormData({...formData, illness: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Describe Symptoms</label>
                    <textarea 
                      required
                      placeholder="Please describe what you are feeling..."
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-32 md:h-40 resize-none text-sm md:text-base"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Submitting..." : "Submit Consultation"}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}



          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">My Health Records</h2>
                  <p className="text-slate-500 text-sm">Private history secured by your unique session token.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-mono text-slate-500 border border-slate-200">
                  <ShieldCheck size={14} />
                  TOKEN: {accessToken.slice(0, 8)}...
                </div>
              </div>

              {/* Consultations Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <History className="text-emerald-600" />
                  Consultations
                </h3>
                {consultations.length > 0 ? (
                  consultations.map((c) => (
                    <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Consultation ID: {c.id}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">{c.patient_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symptoms Reported</h4>
                            <p className="text-slate-700 mt-1">{c.symptoms}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Concern</h4>
                            <p className="text-slate-700 mt-1">{c.illness || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 mb-3">
                            <CheckCircle2 size={18} />
                            <h4 className="text-sm font-bold uppercase tracking-wider">Expert Suggestion</h4>
                          </div>
                          <p className="text-emerald-900 font-medium leading-relaxed">{c.ai_recommendation}</p>
                          <div className="mt-4 pt-4 border-top border-emerald-200/50">
                            <h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Recommended Products</h5>
                            <div className="flex flex-wrap gap-2">
                              {c.recommended_products.map((p, i) => (
                                <span key={i} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-emerald-700 border border-emerald-200">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400">No consultations found.</p>
                    </div>
                  )
                )}
              </div>

              {/* Orders Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <ShoppingBag className="text-emerald-600" />
                  Orders
                </h3>
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Order ID: {o.id.slice(0, 8)}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">Order Status: {o.status}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Items Ordered</p>
                          {o.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">{item.products?.name} x{item.quantity}</span>
                              <span className="font-black text-slate-900">₦{Number(item.price_at_time).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-black text-slate-400 uppercase text-xs tracking-widest">Total Amount</span>
                            <span className="text-xl font-black text-emerald-600">₦{Number(o.total_amount).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                          <MapPin size={16} className="text-slate-300" />
                          {o.shipping_address}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400">No orders found.</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!isAdminAuthenticated ? (
                <div className="max-w-md mx-auto bg-white rounded-[32px] p-8 border border-slate-200 shadow-2xl">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    <DbIcon size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Admin Access</h2>
                  <p className="text-slate-500 text-sm mb-8">Please enter the administrative password to manage the database.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <input 
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAdminLogin();
                          }
                        }}
                        placeholder="••••••••"
                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleAdminLogin}
                      disabled={loading}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Unlock Dashboard"}
                    </button>
                  </div>
                </div>
              ) : (
                <AdminDashboard adminPassword={adminPassword} onLogout={handleAdminLogout} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 text-white py-12 md:py-20 mt-12 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex flex-col items-start mb-6">
              {CONFIG.company.logoUrl ? (
                <img 
                  src={CONFIG.company.logoUrl} 
                  alt={CONFIG.company.name} 
                  className="h-8 md:h-12 w-auto object-contain brightness-0 invert mb-3"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-3">
                  <Activity size={24} />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg md:text-xl tracking-tight leading-none">{CONFIG.company.name}</h1>
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-emerald-400 mt-1">{CONFIG.company.subtitle}</p>
              </div>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-sm md:text-base">
              Leading distributor and marketer of professional health products. 
              We are committed to providing high-quality supplements and expert health consultations 
              to improve the well-being of our community.
            </p>
          </div>
          
          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              {CONFIG.navigation.map(item => (
                <li key={item.id}>
                  <button onClick={() => navigateTo(item.id as any)} className="hover:text-emerald-400 transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Contact Us</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                {CONFIG.company.phone}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} />
                NAFDAC Registered Products
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 md:mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-[10px] md:text-xs">
          © {new Date().getFullYear()} {CONFIG.company.name} {CONFIG.company.subtitle}. All Rights Reserved.
        </div>
      </footer>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-white rounded-t-[32px] lg:rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[90vh] lg:h-auto lg:max-h-[90vh]"
            >
              {/* Mobile Drag Handle */}
              <div className="lg:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <X size={20} />
              </button>

              {/* Modal Image Section */}
              <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 h-[55vh] lg:h-auto shrink-0 overflow-y-auto custom-scrollbar">
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain mix-blend-multiply scale-150 md:scale-175 lg:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Modal Content Section */}
              <div className="w-full lg:w-1/2 p-6 lg:p-12 overflow-y-auto bg-white custom-scrollbar pb-12">
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <div className="text-emerald-600 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Award size={14} />
                      Premium Health Product
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4">
                      <div className="flex items-center gap-0.5 md:gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-orange-400 text-orange-400 md:w-[18px] md:h-[18px]" />
                        ))}
                      </div>
                      <span className="text-slate-500 font-bold text-sm md:text-base">(120+ Reviews)</span>
                    </div>
                  </div>

                  <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
                    {selectedProduct.short_desc}
                  </p>

                  <div className="space-y-3 md:space-y-4">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px] md:text-sm">Key Health Benefits:</h4>
                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {selectedProduct.health_benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5 md:w-[20px] md:h-[20px]" />
                          <span className="text-slate-800 font-bold leading-snug text-sm md:text-base">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-baseline gap-3 md:gap-4">
                      <span className="text-3xl md:text-5xl font-black text-slate-900">
                        ₦{(selectedProduct.price_naira * (1 - selectedProduct.discount_percent / 100)).toLocaleString()}
                      </span>
                      {selectedProduct.discount_percent > 0 && (
                        <span className="text-lg md:text-2xl text-slate-400 line-through font-bold">
                          ₦{selectedProduct.price_naira.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {selectedProduct.discount_percent > 0 && (
                      <div className="mt-3 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-[10px] md:text-sm font-black inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Save {selectedProduct.discount_percent}% with Senior Discount
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full justify-between">
                      <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setQuickViewQuantity(Math.max(1, quickViewQuantity - 1))}
                          className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-xl font-black text-slate-900 w-8 text-center">{quickViewQuantity}</span>
                        <button 
                          onClick={() => setQuickViewQuantity(quickViewQuantity + 1)}
                          className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const message = `Hello SD GHT Health Care, I am interested in ${selectedProduct.name}. Could you please provide more information on how I can place an order?`;
                          window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-900 py-4 md:py-6 rounded-2xl font-black text-sm md:text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Phone size={20} className="text-emerald-600" />
                        Chat with us
                      </button>
                      <button 
                        onClick={() => openOrderDrawer(selectedProduct, 'product', quickViewQuantity)}
                        className="flex-[1.5] bg-emerald-600 text-white py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] flex items-center justify-center gap-3 md:gap-4"
                      >
                        <ShoppingBag size={22} className="md:w-[28px] md:h-[28px]" />
                        Order Now
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setViewingProduct(selectedProduct);
                        setSelectedProduct(null);
                        navigateTo("product-detail");
                      }}
                      className="w-full bg-white text-emerald-600 border-2 border-emerald-600 py-3 md:py-4 rounded-2xl font-black text-base md:text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Info size={20} />
                      View Full Details
                    </button>
                    <button 
                      onClick={() => {
                        const message = `Hello SD GHT Health Care, I am interested in ${selectedProduct.name}. Could you please provide more information on how I can place an order?`;
                        window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full bg-white border-2 border-slate-200 text-slate-900 py-3 rounded-2xl font-black text-base md:text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Phone size={20} className="text-emerald-600" />
                      Chat with us
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Package Quick View Modal */}
      {selectedPackage && (
        <PackageQuickView 
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          data={selectedPackage}
          allPackages={recommendedPackages}
          onOrder={(qty) => {
            openOrderDrawer(selectedPackage, 'package', qty);
            setSelectedPackage(null);
          }}
          onViewProduct={(product) => {
            setViewingProduct(product);
            setSelectedPackage(null);
            navigateTo("product-detail");
          }}
        />
      )}

      {/* Order Drawer */}
      {orderItem && (
        <OrderDrawer 
          isOpen={isOrderDrawerOpen}
          onClose={() => {
            setIsOrderDrawerOpen(false);
            setTimeout(() => setOrderItem(null), 500); // Wait for slide-out animation
          }}
          onShopMore={() => {
            setActiveTab('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          item={orderItem.item}
          type={orderItem.type}
          distributorId={distributorId}
          initialQuantity={orderItem.qty}
        />
      )}

      {/* Smart Health Assistant */}
      <AIChatBot 
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        onProductClick={(itemId, label, type) => {
          // Clean up the ID in case the AI added quotes or prefixes
          let cleanId = itemId.replace(/['"]/g, '').trim();
          if (cleanId.toLowerCase().startsWith('id:')) {
            cleanId = cleanId.substring(3).trim();
          }
          
          const searchTerms = [cleanId.toLowerCase()];
          if (label) {
             // Extract just the product name from the label (e.g. "Order GHT Sugar Care" -> "ght sugar care")
             const cleanLabel = label.replace(/order/i, '').replace(/buy/i, '').trim().toLowerCase();
             // Only use the label for searching if it's specific enough (not just "ght" or "product")
             if (cleanLabel && cleanLabel.length > 4 && cleanLabel !== 'product' && cleanLabel !== 'package') {
               searchTerms.push(cleanLabel);
             }
          }

          const findProduct = () => products.find(p => {
            const pName = p.name.toLowerCase();
            const pIdStr = p.id ? p.id.toString() : "";
            return pIdStr === cleanId || 
                   searchTerms.some(term => 
                     pName === term || 
                     pName.includes(term) || 
                     (pName.length > 4 && term.includes(pName))
                   );
          });

          const findPackage = () => recommendedPackages.find(p => {
            const pName = p.name.toLowerCase();
            const pIdStr = p.id ? p.id.toString() : "";
            return pIdStr === cleanId || 
                   searchTerms.some(term => 
                     pName === term || 
                     pName.includes(term) || 
                     (pName.length > 4 && term.includes(pName))
                   );
          });

          let foundItem: any = null;
          let foundType = '';

          // If the AI explicitly said it's a package, check packages first
          if (type === 'package') {
            foundItem = findPackage();
            foundType = 'package';
            if (!foundItem) {
              foundItem = findProduct();
              foundType = 'product';
            }
          } else {
            // Otherwise check products first
            foundItem = findProduct();
            foundType = 'product';
            if (!foundItem) {
              foundItem = findPackage();
              foundType = 'package';
            }
          }

          if (foundItem) {
            // Add a small delay so the chat window can close before the modal/drawer opens
            setTimeout(() => {
              if (foundType === 'product') {
                setSelectedProduct(foundItem);
              } else {
                setSelectedPackage(foundItem);
              }
            }, 150);
          } else {
            console.warn("Item not found from AI link:", itemId, label, type);
            alert("Sorry, we couldn't open that specific item automatically. Please find it in our catalog.");
          }
        }}
      />
    </div>
  );
}
