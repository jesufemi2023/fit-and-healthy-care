import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
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
  Upload,
  X,
  ShoppingBag
} from 'lucide-react';
import { PackageData, Product, PaymentMethod } from '../types';
import { CONFIG } from '../config';
import { trackOrderStart, trackOrderComplete, trackWhatsAppClick } from '../lib/analytics';

interface OrderCheckoutPageProps {
  item: PackageData | Product;
  type: 'package' | 'product';
  distributorId?: string;
  initialQuantity?: number;
  onBack: () => void;
  onShopMore: () => void;
}

export const OrderCheckoutPage: React.FC<OrderCheckoutPageProps> = ({
  item,
  type,
  distributorId = CONFIG.defaults.distributorId,
  initialQuantity = 1,
  onBack,
  onShopMore
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
          setSettings((prev: any) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    setQuantity(initialQuantity);
    setStep(1);
    setIsSuccess(false);
    setLoading(false);
    setIsUploading(false);
    trackOrderStart(item.name, type);
  }, [initialQuantity, item.name, type]);

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
    try {
      let orderItems: any[] = [];
      if (type === 'package') {
        const pkg = item as PackageData;
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit order');
      }

      setIsSuccess(true);
      trackOrderComplete(item.name, totalPrice);
    } catch (error: any) {
      console.error('Submit order error:', error);
      alert(error.message || 'Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    trackWhatsAppClick("Checkout Success");
    const message = `Hello SD GHT Health Care, I have just placed an order for ${quantity}x ${item.name} (Total: ₦${totalPrice.toLocaleString()}). My name is ${formData.full_name}. Please confirm my order.`;
    window.open(`https://wa.me/${CONFIG.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-24"
    >
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-8 md:p-12 space-y-8">
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
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Order Received!</h2>
              <p className="text-slate-600 font-medium text-lg">
                Thank you, <span className="text-slate-900 font-bold">{formData.full_name}</span>. 
                We have received your request for <span className="text-emerald-600 font-bold">{quantity}x {item.name}</span>.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Delivery Date</span>
                <span className="text-slate-900 font-black">{formData.delivery_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Payment</span>
                <span className="text-slate-900 font-black">{formData.payment_method === 'pod' ? 'Pay on Delivery' : 'Bank Transfer'}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200/50 pt-3">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Total Amount</span>
                <span className="text-emerald-600 font-black">₦{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <button 
                onClick={openWhatsApp}
                className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <MessageSquare size={28} />
                Confirm on WhatsApp
              </button>
              
              <button 
                onClick={onShopMore}
                className="w-full h-16 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
              >
                <ShoppingBag size={20} className="text-emerald-600" />
                Shop More Products
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                  <Truck size={14} />
                  Secure Checkout — Step {step} of 3
                </div>
                <h1 className="text-3xl font-black text-slate-900">
                  {step === 1 && "Who are you?"}
                  {step === 2 && "Where & When?"}
                  {step === 3 && "Payment Choice"}
                </h1>
              </div>
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
                      <p className="text-sm font-bold text-slate-600">₦{basePrice.toLocaleString()} each</p>
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
                    <p className="text-slate-400 text-sm font-medium italic">We will call you to confirm your delivery and health progress.</p>
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
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Final Step</span>
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
                        <p className="text-sm text-slate-500 font-medium">Pay cash or transfer when your package arrives at your doorstep.</p>
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
                        <p className="text-sm text-slate-500 font-medium">Transfer directly to our official company bank account.</p>
                      </div>
                    </button>
                  </div>

                  {formData.payment_method === 'transfer' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                      <h4 className="text-lg font-black text-slate-900">Bank Account Details</h4>
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{settings.bank_name}</p>
                          <p className="text-2xl font-black text-slate-900 tracking-wider">{settings.account_number}</p>
                          <p className="text-sm font-bold text-emerald-600">{settings.account_name}</p>
                        </div>
                        <button
                          onClick={handleCopy}
                          className="h-14 px-6 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Your Account Name (Sender)</label>
                        <input 
                          type="text"
                          placeholder="Name used to make transfer"
                          className="w-full h-16 bg-white border-2 border-slate-200 rounded-2xl px-6 text-lg font-bold outline-none focus:border-emerald-500"
                          value={formData.sender_name}
                          onChange={e => setFormData({ ...formData, sender_name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Upload Payment Receipt</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-white hover:border-emerald-500 transition-colors cursor-pointer relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={28} className="text-emerald-600" />
                            <p className="text-sm font-bold text-slate-700">
                              {isUploading ? "Uploading receipt..." : formData.payment_receipt_url ? "Receipt Uploaded Successfully ✓" : "Click to upload payment receipt"}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">PNG, JPG, PDF up to 5MB</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="h-16 px-8 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!formData.full_name || !formData.phone_number)) {
                      alert("Please enter your name and phone number.");
                      return;
                    }
                    if (step === 2 && !formData.delivery_address) {
                      alert("Please enter your delivery address.");
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="h-16 px-10 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  Continue
                  <ArrowLeft size={18} className="rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="h-16 px-12 bg-emerald-600 text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? "Submitting Order..." : "Complete Order"}
                  <CheckCircle2 size={20} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
