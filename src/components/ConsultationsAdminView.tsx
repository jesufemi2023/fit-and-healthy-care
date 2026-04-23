import React, { useState } from "react";
import { 
  ClipboardList, 
  User, 
  Phone, 
  Activity, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Consultation } from "../types";

interface ConsultationsAdminViewProps {
  data: Consultation[];
  adminPassword: string;
  fetchData: () => void;
}

export default function ConsultationsAdminView({ data, adminPassword, fetchData }: ConsultationsAdminViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this consultation?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/consultations/${id}`, {
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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openWhatsApp = (phone: string, name: string, illness?: string) => {
    const message = `Hello ${name}, I'm a consultant from SD GHT Health Care. I've reviewed your consultation regarding ${illness || 'your health inquiry'}...`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">No consultations found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((consultation) => (
        <div key={consultation.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div 
            className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer bg-slate-50/50"
            onClick={() => toggleExpand(consultation.id)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <ClipboardList size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{consultation.patient_name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">#{consultation.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(consultation.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Distributor</p>
                <p className="font-bold text-slate-700">{consultation.distributor_id || 'Direct'}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                {expandedId === consultation.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {expandedId === consultation.id && (
            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Patient Info & Symptoms */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User size={14} /> Patient Details
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p><span className="text-slate-500">Phone:</span> <span className="font-medium">{consultation.phone}</span></p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openWhatsApp(consultation.phone, consultation.patient_name, consultation.illness); }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </button>
                      </div>
                      <p><span className="text-slate-500">Illness:</span> <span className="font-medium">{consultation.illness || 'Not specified'}</span></p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={14} /> Symptoms
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed">
                      {consultation.symptoms}
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} /> AI Recommendation
                    </h4>
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                      {consultation.ai_recommendation || 'No recommendation generated.'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Products</h4>
                    <div className="flex flex-wrap gap-2">
                      {consultation.recommended_products && consultation.recommended_products.length > 0 ? (
                        consultation.recommended_products.map((product, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
                            {product}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific products recommended.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={() => handleDelete(consultation.id)}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} /> Delete Record
                    </button>
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
