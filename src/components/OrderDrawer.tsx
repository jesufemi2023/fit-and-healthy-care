import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  MapPin, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Truck, 
  CheckCircle2,
  Phone,
  MessageSquare,
  Building2,
  Copy,
  Check,
  Plus,
  Minus,
  Upload
} from 'lucide-react';
import { PackageData, Product, PaymentMethod } from '../types';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { trackOrderStart, trackOrderComplete, trackWhatsAppClick } from '../lib/analytics';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShopMore?: () => void;
  item: PackageData | Product;
  type: 'package' | 'product';
  distributorId?: string;
  initialQuantity?: number;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onShopMore,
  item, 
  type, 
  distributorId,
  initialQuantity = 1
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [settings, setSettings] = useState<any>({
    bank_name: CONFIG.company.bankDetails.bankName,
    account_number: CONFIG.company.bankDetails.accountNumber,
    account_name: CONFIG.company.bankDetails.accountName
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          // Map snake_case from DB to camelCase if needed, or just use snake_case
          setSettings((prev: any) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity);
      setStep(1);
      setIsSuccess(false);
      setLoading(false);
      setIsUploading(false);
      trackOrderStart(item.name, type);
    }
  }, [isOpen, initialQuantity, item.name, type]);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    delivery_address: '',
    landmark: '',
    delivery_date_type: 'today' as 'today' | 'tomorrow' | 'other',
    delivery_date: new Date().toISOString().split('T')[0],
    payment_method: 'pod' as PaymentMethod,
    sender_name: '',
    payment_receipt_url: ''
  });

  const basePrice = type === 'package' 
    ? (item as PackageData).price * (1 - (item as PackageData).discount / 100)
    : (item as Product).price_naira * (1 - ((item as Product).discount_percent || 0) / 100);

  const totalPrice = basePrice * quantity;

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          
          const response = await fetch('/api/upload-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: reader.result,
              fileName,
              mimeType: file.type
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload');
          }

          const { publicUrl } = await response.json();
          setFormData({ ...formData, payment_receipt_url: publicUrl });
        } catch (error) {
          console.error('Upload error:', error);
          alert('Error uploading receipt. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        throw new Error("Failed to read file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading receipt. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    console.log("Submitting order...", formData);
    try {
      // Prepare items for the new order_items table
      let orderItems: any[] = [];
      if (type === 'package') {
        const pkg = item as PackageData;
        // If it's a package, we send all its products
        orderItems = (pkg.products || []).map(p => ({
          id: p.id,
          name: p.name,
          quantity: quantity,
          price_at_time: p.price_naira * (1 - (p.discount_percent || 0) / 100),
          is_package: true,
          package_name: pkg.name,
          package_price: basePrice
        }));
      } else {
        const prod = item as Product;
        orderItems = [{
          id: prod.id,
          name: prod.name,
          quantity: quantity,
          price_at_time: basePrice,
          is_package: false
        }];
      }

      const orderData = {
        ...formData,
        items: orderItems,
        total_amount: totalPrice,
        distributor_id: distributorId
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-access-token': localStorage.getItem('ght_access_token') || ''
        },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        console.log("Order submitted successfully");
        trackOrderComplete(item.name, totalPrice);
        setIsSuccess(true);
      } else {
        const errData = await res.json();
        console.error("Order submission failed:", errData);
        alert(`Failed to place order: ${errData.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("Connection error:", e);
      alert("Error connecting to server. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    trackWhatsAppClick("Order Confirmation");
    const message = `Hello SD GHT Health Care, I just placed an order for ${item.name}. 
Name: ${formData.full_name}
Delivery Date: ${formData.delivery_date}
Payment: ${formData.payment_method === 'pod' ? 'Pay on Delivery' : 'Bank Transfer'}`;
    
    window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[151] max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl"
          >
            <div className="max-w-3xl mx-auto p-8 md:p-12 space-y-10">
              {isSuccess ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-12 text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} className="text-emerald-600" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-900">Order Received!</h2>
                    <p className="text-slate-600 font-medium text-lg">
                      Thank you, <span className="text-slate-900 font-bold">{formData.full_name}</span>. 
                      We have received your request for <span className="text-emerald-600 font-bold">{quantity}x {item.name}</span>.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Delivery Date</span>
                      <span className="text-slate-900 font-black">{formData.delivery_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Payment</span>
                      <span className="text-slate-900 font-black">{formData.payment_method === 'pod' ? 'Pay on Delivery' : 'Bank Transfer'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={openWhatsApp}
                      className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      <MessageSquare size={28} />
                      Confirm on WhatsApp
                    </button>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-slate-500 text-sm font-medium mb-4">
                        Your health journey doesn't stop here! Explore our other natural solutions to complete your wellness kit.
                      </p>
                      <button 
                        onClick={() => {
                          onClose();
                          if (onShopMore) onShopMore();
                        }}
                        className="w-full h-16 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                      >
                        <ChevronRight size={20} className="text-emerald-600" />
                        Shop More Products
                      </button>
                    </div>

                    <button 
                      onClick={onClose}
                      className="text-slate-400 font-black uppercase tracking-widest text-sm hover:text-slate-600 pt-2"
                    >
                      Back to Home
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                        <Truck size={14} />
                        Step {step} of 3
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">
                        {step === 1 && "Who are you?"}
                        {step === 2 && "Where & When?"}
                        {step === 3 && "Payment Choice"}
                      </h2>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(step / 3) * 100}%` }}
                      className="h-full bg-emerald-600"
                    />
                  </div>

                  {/* Form Content */}
                  <div className="min-h-[400px]">
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Selected Item</p>
                            <p className="text-lg font-black text-slate-900">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-emerald-100">
                            <button 
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
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
                        <div className="space-y-4">
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Your Full Name</label>
                          <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                            <input 
                              type="text"
                              placeholder="e.g. John Doe"
                              className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-16 text-xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                              value={formData.full_name}
                              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">WhatsApp / Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                            <input 
                              type="tel"
                              placeholder="080 1234 5678"
                              className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-16 text-xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                              value={formData.phone_number}
                              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                            />
                          </div>
                          <p className="text-slate-400 text-sm font-medium italic">We will call you to confirm your health progress.</p>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="space-y-4">
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Delivery Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-5 top-6 text-slate-300" size={24} />
                            <textarea 
                              placeholder="House number, Street name, City, State"
                              className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-3xl px-16 py-6 text-lg font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                              value={formData.delivery_address}
                              onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Nearest Landmark (Optional)</label>
                          <div className="relative">
                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                            <input 
                              type="text"
                              placeholder="e.g. Near the big church or market"
                              className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-16 text-lg font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                              value={formData.landmark}
                              onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">When should we deliver?</label>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: 'today', label: 'Today' },
                              { id: 'tomorrow', label: 'Tomorrow' },
                              { id: 'other', label: 'Other Day' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  const date = new Date();
                                  if (opt.id === 'tomorrow') date.setDate(date.getDate() + 1);
                                  setFormData({ 
                                    ...formData, 
                                    delivery_date_type: opt.id as any,
                                    delivery_date: date.toISOString().split('T')[0]
                                  });
                                }}
                                className={`h-20 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${
                                  formData.delivery_date_type === opt.id 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {formData.delivery_date_type === 'other' && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                              <input 
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 text-xl font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                                value={formData.delivery_date}
                                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                              />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Summary</span>
                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Step 3</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="text-slate-400 text-xs font-bold uppercase">Item</p>
                              <p className="text-lg font-black">{item.name} x{quantity}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-slate-400 text-xs font-bold uppercase">Total Amount</p>
                              <p className="text-2xl font-black text-emerald-400">₦{totalPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button
                            onClick={() => setFormData({ ...formData, payment_method: 'pod' })}
                            className={`p-8 rounded-[32px] border-2 text-left space-y-4 transition-all ${
                              formData.payment_method === 'pod'
                                ? 'bg-emerald-50 border-emerald-600 shadow-xl'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.payment_method === 'pod' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <Truck size={28} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-slate-900">Pay on Delivery</h4>
                              <p className="text-sm text-slate-500 font-medium">Pay cash or transfer when your package arrives.</p>
                            </div>
                          </button>

                          <button
                            onClick={() => setFormData({ ...formData, payment_method: 'transfer' })}
                            className={`p-8 rounded-[32px] border-2 text-left space-y-4 transition-all ${
                              formData.payment_method === 'transfer'
                                ? 'bg-emerald-50 border-emerald-600 shadow-xl'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.payment_method === 'transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <CreditCard size={28} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-slate-900">Bank Transfer</h4>
                              <p className="text-sm text-slate-500 font-medium">Send money to our account for priority dispatch.</p>
                            </div>
                          </button>
                        </div>

                        {formData.payment_method === 'transfer' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Our Bank Details</span>
                              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Priority Dispatch</div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-400 font-bold uppercase">Bank Name</p>
                                  <p className="text-lg font-black">{settings.bank_name}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-xs text-slate-400 font-bold uppercase">Account Name</p>
                                  <p className="text-lg font-black">{settings.account_name}</p>
                                </div>
                              </div>
                              <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-white/10">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Account Number</p>
                                  <p className="text-3xl font-black tracking-wider">{settings.account_number}</p>
                                </div>
                                <button 
                                  onClick={handleCopy}
                                  className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:bg-emerald-400 transition-colors"
                                >
                                  {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Sender's Name (for verification)</label>
                              <input 
                                type="text"
                                placeholder="Who is sending the money?"
                                className="w-full h-16 bg-white/5 border-2 border-white/10 rounded-2xl px-6 text-lg font-bold focus:border-emerald-500 outline-none transition-all"
                                value={formData.sender_name}
                                onChange={e => setFormData({ ...formData, sender_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Upload Receipt (Optional)</label>
                              <div className="relative">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={isUploading}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                />
                                <div className={`w-full h-16 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 transition-all ${formData.payment_receipt_url ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/20 bg-white/5 text-slate-400 hover:border-white/40'}`}>
                                  {isUploading ? (
                                    <>
                                      <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                      <span className="font-bold">Uploading...</span>
                                    </>
                                  ) : formData.payment_receipt_url ? (
                                    <>
                                      <Check size={20} />
                                      <span className="font-bold">Receipt Uploaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={20} />
                                      <span className="font-bold">Click to upload screenshot</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-4 pt-10 border-t border-slate-100">
                    {step > 1 && (
                      <button 
                        onClick={prevStep}
                        className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center hover:bg-slate-200 transition-all"
                      >
                        <ChevronLeft size={32} />
                      </button>
                    )}
                    <button 
                      onClick={step === 3 ? handleSubmit : nextStep}
                      disabled={loading || isUploading || (step === 1 && (!formData.full_name || !formData.phone_number)) || (step === 2 && !formData.delivery_address)}
                      className="flex-grow h-20 bg-slate-900 text-white rounded-3xl font-black text-xl uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {step === 3 ? "Confirm Order Now" : "Continue"}
                          <ChevronRight size={28} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
