import React, { useState } from "react";
import { 
  Edit2, 
  Save, 
  X, 
  Trash2, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Truck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Clock,
  ShoppingBag
} from "lucide-react";
import { Order, OrderStatus } from "../types";

interface OrdersAdminViewProps {
  data: Order[];
  adminPassword: string;
  fetchData: () => void;
}

export default function OrdersAdminView({ data, adminPassword, fetchData }: OrdersAdminViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("pending");
  const [editAddress, setEditAddress] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": adminPassword 
        },
        body: JSON.stringify({ status: editStatus, shipping_address: editAddress })
      });

      if (res.ok) {
        setEditingId(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert("Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
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

  const startEdit = (order: Order) => {
    setEditingId(order.id);
    setEditStatus(order.status);
    setEditAddress(order.shipping_address || "");
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'paid': return <CheckCircle2 size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <Package size={14} />;
      case 'cancelled': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  const openWhatsApp = (phone?: string, name?: string, orderId?: string) => {
    if (!phone) return;
    const message = `Hello ${name || 'Customer'}, I'm from SD GHT Health Care regarding your order #${orderId?.slice(0, 8).toUpperCase()}...`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={24} className="text-slate-300" />
        </div>
        <p className="text-slate-400 font-bold">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((order) => (
        <div key={order.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          {/* Order Header */}
          <div 
            className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer bg-slate-50/30"
            onClick={() => toggleExpand(order.id)}
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-slate-900 tracking-tight">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                  <Calendar size={12} />
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Amount</p>
                <p className="font-black text-emerald-600 text-xl tracking-tight">₦{order.total_amount?.toLocaleString()}</p>
              </div>
              <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
                {expandedId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedId === order.id && (
            <div className="p-8 border-t border-slate-100 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Customer & Payment Details */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Customer Information
                      </h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openWhatsApp((order as any).profiles?.phone_number, (order as any).profiles?.full_name, order.id); }}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl space-y-3 text-sm">
                      <p className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-900">{(order as any).profiles?.full_name || 'Unknown'}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-bold text-slate-900">{(order as any).profiles?.phone_number || 'Unknown'}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Distributor:</span> <span className="font-bold text-indigo-600">{order.distributor_id || 'Direct'}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> Payment Verification
                    </h4>
                    <div className="bg-slate-50 p-5 rounded-2xl space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-black uppercase text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg">
                          {order.payment_method === 'pod' ? 'Pay on Delivery' : order.payment_method === 'transfer' ? 'Bank Transfer' : (order.payment_method || 'N/A')}
                        </span>
                      </div>
                      {order.sender_name && (
                        <p className="flex justify-between"><span className="text-slate-500">Sender:</span> <span className="font-bold text-slate-900">{order.sender_name}</span></p>
                      )}
                      {order.payment_receipt_url && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-slate-500 mb-3 text-[10px] font-black uppercase tracking-widest">Receipt Preview</p>
                          <a href={order.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all">
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                              <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ExternalLink size={14} /> View Full Receipt
                              </span>
                            </div>
                            <img src={order.payment_receipt_url} alt="Payment Receipt" className="w-full h-40 object-contain bg-slate-100 transform group-hover:scale-110 transition-transform duration-500" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Logistics & Fulfillment
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-5 text-sm h-full border border-slate-100">
                    {editingId === order.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Update Status</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                          >
                            <option value="pending">Pending Verification</option>
                            <option value="paid">Payment Confirmed</option>
                            <option value="shipped">Order Shipped</option>
                            <option value="delivered">Order Delivered</option>
                            <option value="cancelled">Order Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping Address</label>
                          <textarea 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => handleSave(order.id)}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                          >
                            <Save size={16} /> Save Changes
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <X size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Address</p>
                            <p className="text-slate-900 font-bold leading-relaxed">{order.shipping_address || 'No address provided'}</p>
                          </div>
                          {order.landmark && (
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Landmark</p>
                              <p className="text-slate-600 font-medium">{order.landmark}</p>
                            </div>
                          )}
                          {order.delivery_date && (
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preferred Date</p>
                              <p className="text-slate-900 font-bold">{new Date(order.delivery_date).toLocaleDateString()} ({order.delivery_date_type})</p>
                            </div>
                          )}
                        </div>
                        <div className="pt-6 border-t border-slate-200 flex gap-3">
                          <button 
                            onClick={() => startEdit(order)}
                            className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-600 px-4 py-3 rounded-xl transition-all"
                          >
                            <Edit2 size={14} /> Edit Order
                          </button>
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="flex items-center justify-center p-3 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} /> Items in Order
                  </h4>
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
                    {(order as any).order_items && (order as any).order_items.length > 0 ? (
                      <ul className="space-y-4">
                        {(order as any).order_items.map((item: any) => (
                          <li key={item.id} className="flex justify-between items-start border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                                <Box size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight">{item.products?.name || 'Unknown Product'}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Qty: {item.quantity} × ₦{item.price_at_time?.toLocaleString()}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-slate-900">
                              ₦{(item.quantity * item.price_at_time).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-10">
                        <Package size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No items found</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <span className="text-lg font-black text-emerald-600 tracking-tight">₦{order.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const Box = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
