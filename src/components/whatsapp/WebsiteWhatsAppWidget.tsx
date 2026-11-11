import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Rocket,
  DollarSign,
  FileSpreadsheet,
  UserCheck,
  ChevronRight
} from 'lucide-react';

interface WebsiteWhatsAppWidgetProps {
  defaultOpen?: boolean;
}

export function WebsiteWhatsAppWidget({ defaultOpen = false }: WebsiteWhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [customQuery, setCustomQuery] = useState('');

  const officialNumber = '917079737773';

  const promptOptions = [
    {
      id: 'demo',
      icon: Rocket,
      title: '1,000 Leads Free Account & Demo',
      desc: 'Zero expiry + 1-on-1 personalized walkthrough',
      text: "Hi RealSalePro! I would like to get our free 1,000 leads account and book a live demo."
    },
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Compare Pricing Plans',
      desc: 'Free Forever tier vs ₹1,200 Pro Plan',
      text: 'Hi RealSalePro! Please share the pricing breakdown and feature comparison for your CRM plans.'
    },
    {
      id: 'masking',
      icon: ShieldCheck,
      title: 'Phone Number Masking Info',
      desc: 'Stop telecallers from stealing client database',
      text: 'Hi RealSalePro! How does staff phone number masking prevent client data theft in brokerages?'
    },
    {
      id: 'excel',
      icon: FileSpreadsheet,
      title: 'Download Free Excel CRM Template',
      desc: 'Pre-formatted sheet with Indian property stages',
      text: 'Hi RealSalePro! Please share the free download link for your Real Estate CRM Excel Template.'
    },
    {
      id: 'agent',
      icon: UserCheck,
      title: 'Live Support Available',
      desc: 'Chat directly with our support & sales team',
      text: 'Hi RealSalePro! I need live support with RealSalePro.'
    }
  ];

  const handleLaunchWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${officialNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-500/30 px-3.5 py-2 rounded-2xl shadow-xl text-xs font-semibold text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Chat with RealSalePro Bot
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open WhatsApp Sales Chatbot"
            className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.71 0 1.01.74 1.99.84 2.13.1.14 1.44 2.21 3.5 3.1 1.71.74 2.06.59 2.43.56.37-.04 1.19-.49 1.36-.96.17-.47.17-.87.12-.96-.05-.09-.19-.14-.4-.25-.21-.1-1.2-.59-1.39-.66-.19-.07-.33-.1-.47.1-.14.21-.55.69-.67.83-.12.14-.24.16-.45.05-.21-.1-.89-.33-1.69-1.05-.62-.56-1.04-1.25-1.16-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.26.31-.38.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.14-.65-1.56-.17-.41-.35-.35-.48-.36-.12-.01-.26-.01-.4-.01z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Interactive WhatsApp Chatbot Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] max-w-[95vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">
                  <span className="text-[#25D366] text-lg font-black">R</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#075E54] rounded-full" />
              </div>

              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  RealSalePro Official Assistant
                  <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
                </h4>
                <p className="text-[11px] text-emerald-200/90 font-medium">
                  +91 70797 37773 • Instant automated replies
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Background Body */}
          <div className="p-4 bg-[#e5ddd5]/25 dark:bg-slate-950/70 space-y-3 max-h-[360px] overflow-y-auto">
            {/* Bot Welcome Bubble */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[10px] text-emerald-600 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> RealSalePro Bot
              </div>
              <p>
                Namaste! 👋 I can answer questions about pricing, features, phone number masking, or set up a live demo for your team.
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                What would you like to explore?
              </p>
            </div>

            {/* Guided Prompt Options */}
            <div className="space-y-1.5">
              {promptOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleLaunchWhatsApp(opt.text)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/90 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-sm hover:shadow transition-all group flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {opt.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type custom question..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuery.trim()) {
                    handleLaunchWhatsApp(customQuery.trim());
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customQuery.trim()) {
                    handleLaunchWhatsApp(customQuery.trim());
                  }
                }}
                className="h-10 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-sm transition-all"
                aria-label="Send to WhatsApp"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Direct Meta WhatsApp Cloud API • End-to-End Encrypted
            </div>
          </div>
        </div>
      )}
    </>
  );
}

