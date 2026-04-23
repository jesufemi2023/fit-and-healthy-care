import React, { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Menu,
  RefreshCw, 
  Package, 
  FileText, 
  Users, 
  ClipboardList,
  Lock as LockIcon,
  Eye,
  ShoppingBag,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowUpRight,
  LayoutDashboard,
  Box,
  Layers,
  Search,
  Filter,
  Download,
  MoreVertical,
  ChevronRight,
  Link as LinkIcon,
  Check,
  Settings
} from "lucide-react";
import OrdersAdminView from "./OrdersAdminView";
import ConsultationsAdminView from "./ConsultationsAdminView";
import { Order, Consultation, BlogPost } from "../types";
import { BlogAdmin } from "./blog/BlogAdmin";
import { getOptimizedImageUrl } from "../utils/cloudinary";

interface AdminDashboardProps {
  adminPassword: string;
  onLogout: () => void;
}

type TableName = "overview" | "products" | "recommended_packages" | "consultations" | "profiles" | "orders" | "blog_posts" | "settings";

export default function AdminDashboard({ adminPassword, onLogout }: AdminDashboardProps) {
  const [activeTable, setActiveTable] = useState<TableName>("overview");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productList, setProductList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    newConsultations: 0,
    topDistributor: "N/A"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyBlogLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/?blog=${slug || id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tables: { id: TableName; label: string; icon: any; color: string }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, color: "bg-blue-500" },
    { id: "orders", label: "Orders", icon: ShoppingBag, color: "bg-emerald-500" },
    { id: "consultations", label: "Consultations", icon: ClipboardList, color: "bg-indigo-500" },
    { id: "products", label: "Products", icon: Box, color: "bg-amber-500" },
    { id: "recommended_packages", label: "Packages", icon: Layers, color: "bg-purple-500" },
    { id: "blog_posts", label: "Blog Posts", icon: FileText, color: "bg-pink-500" },
    { id: "profiles", label: "Profiles", icon: Users, color: "bg-slate-500" },
    { id: "settings", label: "Settings", icon: Settings, color: "bg-slate-700" },
  ];

  useEffect(() => {
    if (activeTable === "overview") {
      fetchOverviewStats();
    } else {
      fetchData();
    }
    if (activeTable === "recommended_packages") {
      fetchProducts();
    }
  }, [activeTable]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        setProductList(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const fetchOverviewStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, consultationsRes] = await Promise.all([
        fetch("/api/admin/orders", { headers: { "x-admin-password": adminPassword } }),
        fetch("/api/admin/consultations", { headers: { "x-admin-password": adminPassword } })
      ]);

      if (ordersRes.ok && consultationsRes.ok) {
        const orders: Order[] = await ordersRes.json();
        const consultations: Consultation[] = await consultationsRes.json();

        const totalRevenue = orders.reduce((acc: number, o: Order) => 
          (o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') ? acc + (o.total_amount || 0) : acc, 0);
        
        const pendingOrders = orders.filter((o: Order) => o.status === 'pending').length;
        const newConsultations = consultations.length;

        // Find top distributor by revenue
        const distributors: Record<string, number> = {};
        orders.forEach((o: Order) => {
          if (o.distributor_id && (o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered')) {
            distributors[o.distributor_id] = (distributors[o.distributor_id] || 0) + (o.total_amount || 0);
          }
        });
        const topDist = Object.entries(distributors).sort((a, b) => b[1] - a[1])[0]?.[0] || "Direct";

        setStats({ totalRevenue, pendingOrders, newConsultations, topDistributor: topDist });
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTable}`, {
        headers: { "x-admin-password": adminPassword }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${res.status}`;
        
        if (errorMessage.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for admin data, retrying in 2s...");
          setTimeout(fetchData, 2000);
          return;
        }
        throw new Error(errorMessage);
      }
      const result = await res.json();
      if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    setLoading(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/admin/${activeTable}/${id}` : `/api/admin/${activeTable}`;
      
      const payload = { ...editForm };
      // Remove ID and metadata from payload - ID is either generated by DB (POST) or in the URL (PUT)
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.profiles;
      delete payload.order_items;
      delete payload.package_products;

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingId(null);
        setIsAdding(false);
        setEditForm({});
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTable}/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    const form = { ...item };
    if (activeTable === "recommended_packages" && item.package_products) {
      form.product_ids = (item.package_products || []).map((pp: any) => pp.product_id);
    }
    setEditForm(form);
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    const defaults: any = {};
    if (activeTable === "products") {
      defaults.name = "";
      defaults.product_code = "";
      defaults.short_desc = "";
      defaults.long_desc = "";
      defaults.health_benefits = [];
      defaults.package = "";
      defaults.usage = "";
      defaults.ingredients = "";
      defaults.warning = "";
      defaults.price_naira = 0;
      defaults.discount_percent = 0;
      defaults.nafdac_no = "";
      defaults.image_url = "";
      defaults.image_desc_url = "";
      defaults.stock_quantity = 0;
    } else if (activeTable === "recommended_packages") {
      defaults.name = "";
      defaults.description = "";
      defaults.price = 0;
      defaults.discount = 0;
      defaults.package_image_url = "";
      defaults.health_benefits = [];
      defaults.symptoms = [];
      defaults.package_code = "";
      defaults.product_ids = [];
      defaults.is_combo = false;
    }
    setEditForm(defaults);
  };

  const generateComboImage = async () => {
    const validProductIds = (editForm.product_ids || []).filter((id: any) => id && typeof id === 'string' && id !== 'null');
    
    if (validProductIds.length === 0) {
      alert("Please select valid products first");
      return;
    }

    // Restore the original API Key Selection workflow
    const aistudio = (window as any).aistudio;
    let hasUserKey = false;
    if (aistudio) {
      try {
        hasUserKey = await aistudio.hasSelectedApiKey();
        if (!hasUserKey && editForm.product_ids?.length > 0) {
          // If they haven't selected a key, we can still try with the default one,
          // but we should warn them if it fails later.
        }
      } catch (e) {
        console.warn("API Key selection error:", e);
      }
    }

    setLoading(true);
    try {
      // 1. Fetch product image base64 data from server
      const res = await fetch("/api/admin/product-images-base64", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword 
        },
        body: JSON.stringify({
          product_ids: validProductIds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch product images");
      }

      const { images } = await res.json();
      if (!images || images.length === 0) throw new Error("No product images found");

      // 2. Call Gemini API on frontend
      // Use API_KEY (from dialog) or GEMINI_API_KEY (platform default)
      let apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : undefined) || process.env.GEMINI_API_KEY;
      if (apiKey === "MY_GEMINI_API_KEY") apiKey = undefined;
      
      const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
      
      const parts: any[] = [];

      for (const img of images) {
        parts.push({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType
          }
        });
      }

      parts.push({ text: `Generate a professional studio photograph of a premium wellness combo package named "${editForm.name || 'Wellness Kit'}". It should look like a cohesive "Master Kit" or "Luxury Collection". The kit contains ${editForm.product_ids.length} products in total. Use the provided product images as visual references for the branding, bottle shapes, and label styles. Arrange them elegantly with soft lighting and emerald green accents.` });

      // Use gemini-3.1-flash-image-preview if user has selected a key, otherwise fallback to 2.5
      const modelName = hasUserKey ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageUrl = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        setEditForm({ ...editForm, package_image_url: imageUrl });
      } else {
        throw new Error("Failed to generate image from AI");
      }
    } catch (e: any) {
      console.error("Image generation error:", e);
      const errStr = String(e).toLowerCase();
      const isQuota = errStr.includes("quota") || errStr.includes("exhausted") || errStr.includes("429");
      
      // Fallback to high-quality placeholder if AI fails
      const fallbackUrl = `https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=1000&auto=format&fit=crop`;
      setEditForm({ ...editForm, package_image_url: fallbackUrl });

      if (isQuota) {
        console.warn("AI Quota exceeded, using high-quality fallback image.");
        // We don't alert here to avoid interrupting the flow, just use the fallback
      } else if (e.message?.includes("permission") || e.message?.includes("403")) {
        alert("Permission Denied: Your API key might not have access to this model. Using fallback image.");
      } else {
        console.error("Image generation failed, using fallback:", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (key: string, value: any) => {
    if (key === "id" || key === "created_at" || key === "updated_at") {
      return <span key={key} className="text-slate-400 text-[10px] font-mono">{value}</span>;
    }

    // Ignore joined data from Supabase
    if (["profiles", "order_items", "package_products"].includes(key)) {
      return null;
    }

    // Robust check: Ignore any other objects that might have been joined
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return null;
    }

    if (key === "product_ids" && activeTable === "recommended_packages") {
      return (
        <div key={key} className="space-y-4 col-span-full">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Products for Package</label>
            {editForm.is_combo && (
              <button 
                type="button"
                onClick={generateComboImage}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Activity size={14} />
                Generate AI Master Kit Image
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {productList.map(product => (
              <label key={product.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-emerald-600 transition-colors">
                <input 
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={editForm.product_ids?.includes(product.id)}
                  onChange={(e) => {
                    const ids = [...(editForm.product_ids || [])];
                    if (e.target.checked) {
                      ids.push(product.id);
                    } else {
                      const index = ids.indexOf(product.id);
                      if (index > -1) ids.splice(index, 1);
                    }
                    setEditForm({ ...editForm, product_ids: ids });
                  }}
                />
                {product.name}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (key === "is_combo") {
      return (
        <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <input 
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            checked={!!value}
            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.checked })}
          />
          <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Is Combo Pack?</label>
        </div>
      );
    }

    const label = key.replace(/_/g, " ").toUpperCase();

    if (Array.isArray(value)) {
      // If it's an array of objects, skip it (likely joined data)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return null;
      }

      return (
        <div key={key} className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
            <span>{label}</span>
            <span className="text-emerald-500 lowercase font-medium">Comma separated list</span>
          </label>
          <div className="relative">
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
              value={value.join(", ")}
              onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value.split(",").map(s => s.trim()).filter(s => s !== "") })}
              placeholder="e.g. Item 1, Item 2, Item 3"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">
              {value.length} items
            </div>
          </div>
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {value.map((item, i) => (
                <span key={i} className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "number" || (typeof value === "string" && !isNaN(parseFloat(value)) && isFinite(Number(value)))) {
      const numericValue = typeof value === "string" ? parseFloat(value) : value;
      return (
        <div key={key} className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          <input 
            type="number"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            value={isNaN(numericValue) ? "" : numericValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setEditForm({ ...editForm, [key]: isNaN(val) ? 0 : val });
            }}
          />
        </div>
      );
    }

    if (key === "content" || key === "symptoms" || key === "ai_recommendation" || key === "description" || key === "long_desc") {
      return (
        <div key={key} className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs h-32 resize-none font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            value={value || ""}
            onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
          />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <input 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          value={value || ""}
          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
        />
      </div>
    );
  };

  const activeTableLabel = tables.find(t => t.id === activeTable)?.label || activeTable;

  return (
    <div className="bg-[#F9F8F6] min-h-screen flex relative overflow-x-hidden font-sans">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100"
            >
              <LockIcon size={20} className="text-white" />
            </motion.div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-slate-900 leading-none">ADMIN</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SD GHT Health</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => { 
                setActiveTable(table.id); 
                setIsAdding(false); 
                setEditingId(null);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                activeTable === table.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${table.color} ${activeTable === table.id ? "ring-4 ring-white/20" : "opacity-40"}`} />
                <table.icon size={18} className={`transition-colors ${activeTable === table.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                {table.label}
              </div>
              {activeTable === table.id && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" />
              )}
              <ChevronRight size={14} className={`transition-transform ${activeTable === table.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                AD
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Super Admin</p>
              <p className="text-[10px] text-slate-500 font-medium">Full Access</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
          >
            <Eye size={14} />
            View Website
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
          >
            <LockIcon size={14} />
            Logout Securely
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-10 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 transition-colors shadow-sm"
              >
                <Menu size={20} />
              </button>
              <div>
                <motion.h2 
                  key={activeTable}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl md:text-2xl font-black text-slate-900 tracking-tight"
                >
                  {activeTableLabel}
                </motion.h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Live System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search size={16} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  className="bg-transparent border-none outline-none text-xs font-medium w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block" />

              <button 
                onClick={activeTable === "overview" ? fetchOverviewStats : fetchData}
                className="p-2.5 text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md active:scale-95"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              
              {activeTable !== "overview" && activeTable !== "profiles" && (
                <button 
                  onClick={startAdd}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Plus size={16} />
                  Add New
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTable}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTable === "overview" ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stats Cards */}
                    <StatCard 
                      label="Total Revenue" 
                      value={`₦${stats.totalRevenue.toLocaleString()}`} 
                      icon={DollarSign} 
                      trend="+12.5%" 
                      color="emerald" 
                    />
                    <StatCard 
                      label="Pending Orders" 
                      value={stats.pendingOrders} 
                      icon={ShoppingBag} 
                      trend="Action Required" 
                      color="amber" 
                    />
                    <StatCard 
                      label="Consultations" 
                      value={stats.newConsultations} 
                      icon={Activity} 
                      trend="New" 
                      color="indigo" 
                    />
                    <StatCard 
                      label="Top Distributor" 
                      value={stats.topDistributor} 
                      icon={TrendingUp} 
                      trend="Top Partner" 
                      color="slate" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="font-black text-xl text-slate-900 tracking-tight">Recent Activity</h4>
                          <p className="text-xs text-slate-400 font-medium mt-1">Real-time updates from your store</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                          <MoreVertical size={20} className="text-slate-400" />
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <ActivityItem 
                          icon={ShoppingBag} 
                          title="New Order #F8291" 
                          desc="Customer: John Doe • ₦45,000" 
                          time="2 mins ago" 
                          color="emerald" 
                        />
                        <ActivityItem 
                          icon={ClipboardList} 
                          title="New Consultation" 
                          desc="Patient: Sarah Smith • Symptoms: Fever" 
                          time="15 mins ago" 
                          color="indigo" 
                        />
                        <ActivityItem 
                          icon={Users} 
                          title="New Profile Created" 
                          desc="User: Michael Brown joined the platform" 
                          time="1 hour ago" 
                          color="amber" 
                        />
                        <ActivityItem 
                          icon={RefreshCw} 
                          title="Stock Updated" 
                          desc="Product: GHT Master Kit • +50 units" 
                          time="3 hours ago" 
                          color="slate" 
                        />
                      </div>

                      <button className="w-full mt-8 py-3 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                        View Full History
                      </button>
                    </div>

                    {/* System Health & Quick Actions */}
                    <div className="space-y-8">
                      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-slate-200 text-white relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                            <h4 className="font-black text-xl tracking-tight">System Health</h4>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          </div>
                          
                          <div className="space-y-5">
                            <HealthRow label="Supabase Database" status="Operational" />
                            <HealthRow label="Gemini AI Engine" status="Active" />
                            <HealthRow label="Cloudinary Storage" status="Operational" />
                            <HealthRow label="Email Service" status="Operational" />
                          </div>

                          <div className="mt-10 pt-8 border-t border-white/10">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Quick Actions</p>
                            <div className="grid grid-cols-2 gap-3">
                              <QuickAction icon={Download} label="Export Data" />
                              <QuickAction icon={RefreshCw} label="Sync Stock" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                        <h5 className="text-emerald-900 font-black text-sm uppercase tracking-tight mb-2">Pro Tip</h5>
                        <p className="text-emerald-700 text-xs leading-relaxed font-medium">
                          You can generate AI images for your packages using the "Packages" tab. It uses Gemini 3.1 for high-quality results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTable === "orders" ? (
                <OrdersAdminView data={data} adminPassword={adminPassword} fetchData={fetchData} />
              ) : activeTable === "consultations" ? (
                <ConsultationsAdminView data={data} adminPassword={adminPassword} fetchData={fetchData} />
              ) : activeTable === "blog_posts" ? (
                <div className="space-y-12">
                  <BlogAdmin onBlogGenerated={fetchData} adminPassword={adminPassword} />
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Existing Articles</h3>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.length} Articles Total</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="py-5 px-6 text-[10px] uppercase font-black text-slate-400 tracking-widest">Article Details</th>
                            <th className="py-5 px-6 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-8 px-6">
                                {editingId === item.id ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.keys(editForm).map(key => renderField(key, editForm[key]))}
                                  </div>
                                ) : (
                                  <div className="flex gap-6">
                                    <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                                      <img src={getOptimizedImageUrl(item.image_url, 300)} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="font-black text-slate-900 text-lg tracking-tight">{item.title}</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {item.tags?.map((tag: string, i: number) => (
                                          <span key={i} className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded border border-emerald-100 font-bold uppercase tracking-widest">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 font-medium">{item.content.slice(0, 150)}...</p>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="py-8 px-6 text-right align-top">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                    {editingId === item.id ? (
                                      <>
                                        <button onClick={() => handleSave(item.id)} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                                          <Save size={18} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300">
                                          <X size={18} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => copyBlogLink(item.slug, item.id)} 
                                          className={`p-2.5 rounded-xl transition-all ${copiedId === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                          title="Copy Article Link"
                                        >
                                          {copiedId === item.id ? <Check size={18} /> : <LinkIcon size={18} />}
                                        </button>
                                        <button onClick={() => startEdit(item)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                          <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                          <Trash2 size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTable === "settings" ? (
                <SettingsAdminView adminPassword={adminPassword} />
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="py-5 px-6 text-[10px] uppercase font-black text-slate-400 tracking-widest">Data Entry</th>
                          <th className="py-5 px-6 text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {isAdding && (
                          <tr className="bg-emerald-50/30">
                            <td className="py-8 px-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.keys(editForm).map(key => renderField(key, editForm[key]))}
                              </div>
                            </td>
                            <td className="py-8 px-6 text-right align-top">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleSave()} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                                  <Save size={18} />
                                </button>
                                <button onClick={() => setIsAdding(false)} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300">
                                  <X size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {data.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-8 px-6">
                              {editingId === item.id ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {Object.keys(editForm).map(key => renderField(key, editForm[key]))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900 text-lg tracking-tight">{item.name || item.title || item.patient_name || item.full_name || "Untitled"}</span>
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {item.id.slice(0,8)}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                                    {Object.entries(item)
                                      .filter(([k]) => !["id", "name", "title", "patient_name", "full_name", "created_at", "updated_at", "long_desc", "content", "ai_recommendation", "symptoms", "profiles", "order_items", "package_products", "product_ids"].includes(k))
                                      .map(([k, v]) => (
                                        <div key={k} className="truncate">
                                          <span className="font-bold text-slate-400 uppercase text-[9px] mr-1">{k}:</span>
                                          <span className="text-slate-600">{Array.isArray(v) ? `[${v.length} items]` : String(v)}</span>
                                        </div>
                                      ))}
                                    {item.profiles && (
                                      <div className="col-span-full mt-1 pt-1 border-t border-slate-100 flex items-center gap-2">
                                        <span className="font-bold text-slate-400 uppercase text-[9px]">Linked Profile:</span>
                                        <span className="text-indigo-600 font-bold">{item.profiles.full_name} ({item.profiles.phone_number})</span>
                                      </div>
                                    )}
                                    {item.package_products && (
                                      <div className="col-span-full mt-1 pt-1 border-t border-slate-100 flex items-center gap-2">
                                        <span className="font-bold text-slate-400 uppercase text-[9px]">Included Products:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {item.package_products.map((pp: any, i: number) => (
                                            <span key={i} className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                                              {pp.products?.name || 'Unknown'}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-8 px-6 text-right align-top">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                {editingId === item.id ? (
                                  <>
                                    <button onClick={() => handleSave(item.id)} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                                      <Save size={18} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300">
                                      <X size={18} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(item)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                      <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sub-components for better organization
const StatCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>
        <Icon size={20} />
      </div>
      <span className={`text-[10px] font-black text-${color}-600 bg-${color}-50 px-2 py-1 rounded-lg uppercase tracking-widest`}>
        {trend}
      </span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
  </motion.div>
);

const ActivityItem = ({ icon: Icon, title, desc, time, color }: any) => (
  <div className="flex items-start gap-4 group cursor-pointer">
    <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl group-hover:scale-110 transition-transform`}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <h5 className="text-sm font-black text-slate-900 tracking-tight">{title}</h5>
      <p className="text-xs text-slate-500 font-medium truncate">{desc}</p>
    </div>
    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{time}</span>
  </div>
);

const HealthRow = ({ label, status }: any) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-white/50 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      <span className="font-black uppercase tracking-widest text-[10px]">{status}</span>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label }: any) => (
  <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
    <Icon size={18} className="text-white/60 group-hover:text-white transition-colors" />
    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">{label}</span>
  </button>
);

const SettingsAdminView = ({ adminPassword }: { adminPassword: string }) => {
  const [settings, setSettings] = useState<any>({
    bank_name: "",
    account_number: "",
    account_name: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || err.message || "Failed to save settings."}`);
      }
    } catch (e) {
      console.error("Error saving settings:", e);
      setMessage("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Bank Transfer Details</h3>
          <Settings className="text-slate-300" size={24} />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
            <input 
              type="text"
              value={settings.bank_name}
              onChange={e => setSettings({ ...settings, bank_name: e.target.value })}
              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g. ZENITH BANK"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
            <input 
              type="text"
              value={settings.account_number}
              onChange={e => setSettings({ ...settings, account_number: e.target.value })}
              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g. 1234567890"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
            <input 
              type="text"
              value={settings.account_name}
              onChange={e => setSettings({ ...settings, account_name: e.target.value })}
              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g. SD GHT HEALTH CARE LTD"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <p className={`text-xs font-bold transition-opacity ${message ? 'opacity-100' : 'opacity-0'} ${message.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </p>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            Save Settings
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
          <Activity size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-900">Important Note</h4>
          <p className="text-xs text-amber-700 font-medium leading-relaxed">
            Changing these details will immediately update the checkout form for all customers. 
            Ensure the account details are correct to avoid payment verification issues.
          </p>
        </div>
      </div>
    </div>
  );
};
