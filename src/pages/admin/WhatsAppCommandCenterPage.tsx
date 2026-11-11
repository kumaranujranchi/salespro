import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Users,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Phone,
  Sparkles,
  ExternalLink,
  Copy,
  Radio,
  FileText,
  Plus,
  Play,
  Pause,
  Key,
  Flame,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { whatsappHubService } from '../../lib/services';
import { formatPhoneDisplay } from '../../../server/src/services/whatsappHubService';

export function WhatsAppCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast' | 'templates' | 'otp' | 'settings'>('inbox');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Inbox state
  const [conversations, setConversations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en',
    bodyText: '',
  });

  // Broadcast state
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    customMessage: '',
    targetAudience: 'all_leads',
  });
  const [creatingBroadcast, setCreatingBroadcast] = useState(false);

  // OTP state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifyResult, setOtpVerifyResult] = useState<any>(null);

  // Config state
  const [config, setConfig] = useState<any>({
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: 'realsalepro_wa_secret',
    botEnabled: true,
    deepseekApiKey: '',
    aiModel: 'deepseek-chat',
    aiEnabled: true,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Load Initial Data
  useEffect(() => {
    loadConfig();
    loadConversations();
  }, [statusFilter]);

  // Periodic poll for new messages in inbox
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(true);
      if (selectedConv) {
        loadMessages(selectedConv.id, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  const loadConfig = async () => {
    try {
      const res = await whatsappHubService.getConfig();
      if (res?.config) {
        setConfig(res.config);
      }
    } catch (err) {
      console.warn('Failed loading WhatsApp config:', err);
    }
  };

  const checkConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await whatsappHubService.testConnection();
      setConnectionStatus(res);
    } catch (err: any) {
      setConnectionStatus({ success: false, error: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const loadConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await whatsappHubService.listConversations({
        status: statusFilter,
        search: searchQuery,
      });
      if (res?.conversations) {
        setConversations(res.conversations);
        setSummary(res.summary || {});
        // Auto-select first conversation if none selected
        if (!selectedConv && res.conversations.length > 0) {
          selectConversation(res.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    await loadMessages(conv.id);
  };

  const loadMessages = async (convId: string, silent = false) => {
    try {
      const res = await whatsappHubService.getMessages(convId);
      if (res?.messages) {
        setMessages(res.messages);
        if (!silent) {
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConv || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      await whatsappHubService.sendReply(selectedConv.id, replyText.trim());
      setReplyText('');
      await loadMessages(selectedConv.id);
      await loadConversations(true);
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleBot = async (status: string) => {
    if (!selectedConv) return;
    try {
      const res = await whatsappHubService.toggleBot(selectedConv.id, status);
      setSelectedConv(res.conversation);
      await loadConversations(true);
    } catch (err: any) {
      alert(`Error toggling bot status: ${err.message}`);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await whatsappHubService.saveConfig(config);
      alert('WhatsApp Cloud API configuration saved successfully!');
      await checkConnection();
    } catch (err: any) {
      alert(`Failed to save config: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await whatsappHubService.listTemplates();
      if (res?.templates) {
        setTemplates(res.templates);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await whatsappHubService.createTemplate({
        name: newTemplate.name,
        category: newTemplate.category,
        language: newTemplate.language,
        components: [
          {
            type: 'BODY',
            text: newTemplate.bodyText,
          },
        ],
      });
      alert('Template submitted to Meta for review!');
      setIsTemplateModalOpen(false);
      setNewTemplate({ name: '', category: 'MARKETING', language: 'en', bodyText: '' });
      await loadTemplates();
    } catch (err: any) {
      alert(`Failed to submit template: ${err.message}`);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const res = await whatsappHubService.listBroadcasts();
      if (res?.broadcasts) {
        setBroadcasts(res.broadcasts);
      }
    } catch (err) {
      console.error('Error loading broadcasts:', err);
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.customMessage) return;
    setCreatingBroadcast(true);
    try {
      await whatsappHubService.createBroadcast(newBroadcast);
      alert('Broadcast campaign queued for delivery!');
      setNewBroadcast({ title: '', customMessage: '', targetAudience: 'all_leads' });
      await loadBroadcasts();
    } catch (err: any) {
      alert(`Error creating broadcast: ${err.message}`);
    } finally {
      setCreatingBroadcast(false);
    }
  };

  const handleSendTestOtp = async () => {
    if (!otpPhone) return;
    try {
      const res = await whatsappHubService.sendOtp(otpPhone, 'test_verification');
      if (res.success) {
        setOtpSent(true);
        setOtpVerifyResult(null);
        alert(`OTP code dispatched via WhatsApp to ${otpPhone}!`);
      }
    } catch (err: any) {
      alert(`Failed to send OTP: ${err.message}`);
    }
  };

  const handleVerifyTestOtp = async () => {
    if (!otpPhone || !otpCode) return;
    try {
      const res = await whatsappHubService.verifyOtp(otpPhone, otpCode, 'test_verification');
      setOtpVerifyResult(res);
    } catch (err: any) {
      setOtpVerifyResult({ success: false, error: err.message });
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin.replace('3000', '5001')}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                WhatsApp Command Center
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Official +91 70797 37773
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                100% In-House Meta WhatsApp Cloud Engine · Landing Page Bot · Live 2-Way Chat · Broadcasts · OTPs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            {testingConnection ? 'Testing Meta API...' : 'Test Connection'}
          </button>

          {connectionStatus && (
            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${connectionStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'}`}>
              {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              {connectionStatus.success ? `Connected: ${connectionStatus.displayPhoneNumber}` : 'Disconnected'}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'inbox'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Live Chat Inbox
          {summary.agent_requested_count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-400 text-slate-950 font-bold rounded-full animate-pulse">
              {summary.agent_requested_count}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('broadcast'); loadBroadcasts(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          Bulk Broadcasts
        </button>

        <button
          onClick={() => { setActiveTab('templates'); loadTemplates(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Meta Templates Hub
        </button>

        <button
          onClick={() => setActiveTab('otp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'otp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          WhatsApp OTP Tester
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Meta API Credentials
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE CHAT INBOX                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] h-[75vh]">
          {/* Left: Conversation List */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
            {/* Search & Filter */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search visitor phone or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadConversations()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg ${statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  All ({summary.total || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('agent_requested')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${statusFilter === 'agent_requested' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}
                >
                  Needs Agent ({summary.agent_requested_count || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('bot_active')}
                  className={`px-2.5 py-1 rounded-lg ${statusFilter === 'bot_active' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}
                >
                  Bot Active ({summary.bot_active_count || 0})
                </button>
              </div>
            </div>

            {/* Conversation List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loading && conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">No WhatsApp chats found</p>
                  <p className="text-[11px] text-slate-400">Website visitors who start a WhatsApp conversation will appear here instantly.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const isAgentNeeded = conv.status === 'agent_requested';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {conv.customer_name ? conv.customer_name[0].toUpperCase() : 'V'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {conv.customer_name || 'Website Visitor'}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                          {conv.phone}
                        </p>

                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                          {conv.last_message || 'Started conversation'}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isAgentNeeded
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                              : conv.status === 'agent_chatting'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isAgentNeeded ? <Flame className="w-3 h-3 text-amber-600" /> : conv.status === 'agent_chatting' ? <User className="w-3 h-3 text-blue-600" /> : <Bot className="w-3 h-3 text-emerald-600" />}
                            {isAgentNeeded ? 'Agent Needed' : conv.status === 'agent_chatting' ? 'Agent Active' : 'Bot Active'}
                          </span>

                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Window */}
          <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900">
            {selectedConv ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedConv.customer_name ? selectedConv.customer_name[0].toUpperCase() : 'V'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedConv.customer_name || 'Website Visitor'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{selectedConv.phone}</span>
                        <span>•</span>
                        <a href={`tel:${selectedConv.phone}`} className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Bot Toggle & Status Controls */}
                  <div className="flex items-center gap-2">
                    {selectedConv.status === 'bot_active' ? (
                      <button
                        onClick={() => handleToggleBot('agent_chatting')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
                        title="Pauses the automated bot so you can chat as a human"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause Bot (Human Mode)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleBot('bot_active')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        title="Resumes automated prospect bot"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Bot
                      </button>
                    )}
                  </div>
                </div>

                {/* Chat History Bubbles */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5]/20 dark:bg-slate-950/60">
                  {messages.map((m) => {
                    const isInbound = m.direction === 'inbound';
                    const isBot = m.sender_type === 'bot';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed whitespace-pre-wrap ${
                            isInbound
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm border border-slate-200/60 dark:border-slate-700'
                              : isBot
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 rounded-tr-sm border border-emerald-200/50 dark:border-emerald-800/40'
                              : 'bg-emerald-600 text-white rounded-tr-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-bold opacity-70">
                            <span>{m.sender_name || (isInbound ? 'Visitor' : isBot ? 'Bot' : 'Agent')}</span>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {m.body}

                          {!isInbound && (
                            <div className="flex justify-end mt-1 text-[10px] opacity-75">
                              {m.status === 'read' ? (
                                <CheckCheck className="w-3 h-3 text-sky-400" />
                              ) : m.status === 'delivered' ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Message Input & Canned Actions */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  {/* Canned responses */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Quick Replies:
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyText('Hi! You can start immediately with our 100% Free Forever Tier (up to 1,000 leads). Sign up here: https://realsalepro.com/register')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      🚀 Send Free Trial Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText('Our Pro Plan is ₹1,200/month (billed semi-annually) and gives you up to 2,00,000 leads, unlimited user seats, and Meta CAPI webhooks. See full breakdown: https://realsalepro.com/pricing')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      💰 Send Pricing Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText('Would tomorrow at 11:30 AM or 4:00 PM work for a quick 15-minute Google Meet walkthrough of RealSalePro?')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      📅 Propose Demo Call
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Type human reply to send directly to customer's WhatsApp... (Press Enter to Send)"
                      className="flex-1 text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="h-14 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-2">
                <MessageSquare className="w-12 h-12 text-slate-300 stroke-1" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select a visitor conversation</p>
                <p className="text-xs text-slate-400">All WhatsApp interactions from the landing page appear here in real time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK BROADCASTS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600" />
              Send Bulk WhatsApp Campaign
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Dispatch broadcast updates to prospective leads and demo inquiries using official Meta Cloud API with anti-rate-limit throttling.
            </p>

            <form onSubmit={handleCreateBroadcast} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Early-Bird Pro Plan Offer"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={newBroadcast.targetAudience}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all_leads">All Captured Leads & Website Visitors</option>
                  <option value="recent_visitors">Visitors from Last 7 Days</option>
                  <option value="inactive_trials">Inactive Free Trials</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content (Markdown formatting supported)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Namaste! RealSalePro just launched automated WhatsApp Site Visit Dispatching. Would you like a 10-minute demo this week? Reply YES to connect!"
                  value={newBroadcast.customMessage}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, customMessage: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={creatingBroadcast}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {creatingBroadcast ? 'Queuing Broadcast...' : 'Launch Broadcast Campaign'}
              </button>
            </form>
          </div>

          {/* Broadcasts History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Past Broadcast Campaigns</h3>
            {broadcasts.length === 0 ? (
              <p className="text-xs text-slate-400">No broadcast campaigns launched yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Target</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Sent</th>
                      <th className="pb-3">Failed</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {broadcasts.map((b) => (
                      <tr key={b.id} className="text-slate-700 dark:text-slate-300">
                        <td className="py-3 font-semibold">{b.title}</td>
                        <td className="py-3">{b.target_audience}</td>
                        <td className="py-3 font-mono font-bold">{b.total_recipients}</td>
                        <td className="py-3 text-emerald-600 font-mono font-bold">{b.sent_count}</td>
                        <td className="py-3 text-rose-500 font-mono">{b.failed_count}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: META TEMPLATES HUB                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Meta Message Templates &amp; Direct Approval Hub
              </h2>
              <p className="text-xs text-slate-500">
                View, create, and submit WhatsApp pre-approved message templates directly to Meta Graph API.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadTemplates}
                disabled={loadingTemplates}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTemplates ? 'animate-spin' : ''}`} />
                Sync with Meta
              </button>

              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create New Template
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tpl.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : tpl.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {tpl.status}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">{tpl.category}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{tpl.name}</h4>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed min-h-[90px]">
                  {tpl.components?.find((c: any) => c.type === 'BODY')?.text || 'Template Body'}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Language: {tpl.language}</span>
                  <span>ID: {tpl.meta_template_id || 'Local'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Template Modal */}
          {isTemplateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create WhatsApp Template</h3>
                <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Template Name (lowercase, snake_case)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. realsalepro_trial_welcome"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Category</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="MARKETING">Marketing (Offers, Announcements)</option>
                      <option value="UTILITY">Utility (Account alerts, Billing)</option>
                      <option value="AUTHENTICATION">Authentication (OTPs, Security Codes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Body Text (use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for dynamic variables)</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Namaste &#123;&#123;1&#125;&#125;! Welcome to RealSalePro. Your demo account is ready."
                      value={newTemplate.bodyText}
                      onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Submit to Meta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WHATSAPP OTP TESTER                                                */}
      {/* ========================================================================= */}
      {activeTab === 'otp' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600" />
              WhatsApp OTP Verification Service
            </h2>
            <p className="text-xs text-slate-500">
              Dispatches instant 6-digit cryptographic security codes directly to customer WhatsApp numbers for signup &amp; password reset.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Customer Mobile Number (with or without country code)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 7079737773 or 9876543210"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendTestOtp}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send OTP
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  ✔ 6-Digit OTP sent to WhatsApp! Enter it below to verify:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-center font-mono text-base tracking-widest font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyTestOtp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Verify Code
                  </button>
                </div>

                {otpVerifyResult && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold ${otpVerifyResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                    {otpVerifyResult.success ? '🎉 Verification Successful!' : `❌ ${otpVerifyResult.error}`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: META API CREDENTIALS & WEBHOOK SETTINGS                           */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Webhook Callback Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Meta Developer Webhook Configuration
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              In your Meta for Developers App &gt; <strong>WhatsApp &gt; Configuration</strong>, paste this Callback URL and Verify Token to receive live messages and status updates:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://api.realsalepro.com/api/whatsapp/webhook"
                  className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-mono text-emerald-950 dark:text-emerald-200 font-semibold"
                />
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedWebhook ? 'Copied!' : 'Copy URL'}
                </button>
              </div>

              <div className="text-xs text-emerald-800 dark:text-emerald-400">
                Verify Token: <code className="bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded font-mono font-bold">{config.webhookVerifyToken}</code>
              </div>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official WhatsApp Cloud API Credentials</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Phone Number ID (from Meta WhatsApp App)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104859382019485"
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 103948572019483"
                  value={config.wabaId}
                  onChange={(e) => setConfig({ ...config, wabaId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Permanent System User Access Token
                </label>
                <input
                  type="password"
                  placeholder="EAAB..."
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Generated under Meta Business Settings &gt; System Users &gt; Generate Token with <code>whatsapp_business_messaging</code> permission.</p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={config.webhookVerifyToken}
                  onChange={(e) => setConfig({ ...config, webhookVerifyToken: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.botEnabled}
                    onChange={(e) => setConfig({ ...config, botEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Enable Landing Page Automatic Prospect Bot
                  </span>
                </label>
              </div>

              {/* DeepSeek AI Interactive Sales Copilot Settings */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      DeepSeek AI Interactive Sales Copilot
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Answers visitor questions about RealSalePro, pricing, phone masking, and real estate CRM dynamically in Hindi, English & Hinglish.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.aiEnabled ?? true}
                      onChange={(e) => setConfig({ ...config, aiEnabled: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enable AI
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={config.deepseekApiKey || ''}
                    onChange={(e) => setConfig({ ...config, deepseekApiKey: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your API key from <code>platform.deepseek.com</code>. If not set, bot uses real-estate keyword intent engine.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    DeepSeek Model
                  </label>
                  <select
                    value={config.aiModel || 'deepseek-chat'}
                    onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 - Ultra Fast & Recommended)</option>
                    <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 - Deep Thinking Model)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

