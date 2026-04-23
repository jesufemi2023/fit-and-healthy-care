import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, Loader2, ShoppingBag } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface AIChatBotProps {
  onProductClick?: (itemId: string, label: string, type: 'product' | 'package' | 'id') => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ onProductClick, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Hello! I am Dr. GHT, your Smart Health Assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const renderMessageContent = (content: string) => {
    // Split by the markdown link format [Text](type:id) allowing optional spaces
    const parts = content.split(/(\[[^\]]+\]\((?:product|package|id):\s*[^)]+\))/gi);
    
    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+)\]\((product|package|id):\s*([^)]+)\)/i);
      if (match) {
        const label = match[1];
        const type = match[2].toLowerCase() as 'product' | 'package' | 'id';
        const itemId = match[3].trim();
        return (
          <button
            key={i}
            onClick={() => {
              onProductClick?.(itemId, label, type);
              setIsOpen(false); // Close chat to reveal the product modal
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-all my-1 shadow-sm active:scale-95"
          >
            <ShoppingBag size={14} />
            {label}
          </button>
        );
      }
      
      // Render basic bold text **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={j} className="font-bold text-gray-900">{bp.slice(2, -2)}</strong>;
            }
            return <span key={j}>{bp}</span>;
          })}
        </span>
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get response');

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.reply
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Handle non-JSON response (likely a Vercel timeout or error page)
        const status = res.status;
        if (status === 504 || status === 503 || status === 502 || status === 500) {
          throw new Error("The AI is taking a bit longer than usual to think or the server is busy. Please try again in a moment.");
        }
        throw new Error(`Connection issue (Status: ${status}). Please check your internet or try again later.`);
      }
    } catch (error: any) {
      let friendlyMessage = error.message || "I'm sorry, I encountered an error. Please try again later.";
      
      if (error.name === 'AbortError') {
        friendlyMessage = "Request timed out. The AI is experiencing high demand. Please try a shorter question.";
      } else if (friendlyMessage.includes('Unexpected token') || friendlyMessage.includes('doctype')) {
        friendlyMessage = "The server is currently busy or experiencing a timeout. Please try again in a few seconds.";
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: friendlyMessage
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="!fixed bottom-6 right-6 md:bottom-10 md:right-10 p-4 md:p-5 bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-700 transition-all z-[9999] flex items-center justify-center group"
          >
            {/* Pulsing ring effect */}
            <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-75"></span>
            
            {/* Tooltip to draw attention */}
            <span className="absolute -top-14 right-0 bg-white text-emerald-700 px-5 py-3 rounded-2xl text-sm md:text-base font-black shadow-2xl whitespace-nowrap border-2 border-emerald-100 animate-bounce">
              Ask Dr. GHT ✨
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b-2 border-r-2 border-emerald-100 transform rotate-45"></div>
            </span>
            
            <Bot size={32} className="relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="!fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100%-2rem)] md:w-full max-w-[380px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Instant Health Chat</h3>
                  <p className="text-emerald-100 text-xs">Dr. GHT • Online 24/7</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={18} />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                    }`}
                  >
                    {/* Basic markdown rendering (newlines and custom links) */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about symptoms or products..."
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-full px-4 py-3 text-sm transition-all outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">Our assistant can make mistakes. Consult a doctor for emergencies.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
