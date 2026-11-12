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
  XCircle,
  Brain,
  Shield,
  ShieldAlert,
  Zap,
  TrendingUp,
  Globe,
  Code,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { whatsappHubService, formatPhoneDisplay } from '../../lib/services';

export function WhatsAppCommandCenterPage() {
  const { tenant, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'api_setup' | 'templates' | 'widget' | 'automations' | 'broadcast' | 'otp' | 'intelligence' | 'settings'>('inbox');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);

  // Intelligence & Learning Patterns state
  const [learningPatterns, setLearningPatterns] = useState<any[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [labelingConv, setLabelingConv] = useState(false);

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToChatBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

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
    templateName: '',
    customMessage: '',
    targetAudience: 'all_leads',
  });
  const [creatingBroadcast, setCreatingBroadcast] = useState(false);

  // OTP state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifyResult, setOtpVerifyResult] = useState<any>(null);

  // Website Widget Simulator state
  const [simulatorMessages, setSimulatorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Namaste! 👋 Welcome to our website. Which property type or location are you looking for today?' }
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorLeadCaptured, setSimulatorLeadCaptured] = useState<string | null>(null);
  const [copiedWidgetSnippet, setCopiedWidgetSnippet] = useState(false);

  // Lead Confirmations state
  const [testConfirmPhone, setTestConfirmPhone] = useState('');
  const [testingConfirm, setTestingConfirm] = useState(false);
  const [testConfirmResult, setTestConfirmResult] = useState<any>(null);

  // Config state
  const [config, setConfig] = useState<any>({
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: 'realsalepro_wa_secret',
    botEnabled: true,
    aiProvider: 'builtin',
    aiApiKey: '',
    aiModel: 'deepseek-chat',
    aiEnabled: true,
    widget: {
      enabled: true,
      position: 'bottom-right',
      primaryColor: '#25D366',
      welcomeMessage: 'Hi there! 👋 How can we help you find your dream property today?',
      businessName: tenant?.name || 'RealSalePro Properties',
      agentName: 'AI Property Advisor',
      displayPhone: '917079737773',
      knowledgeBase: '',
    },
    leadConfirmation: {
      autoConfirmMetaAds: true,
      autoConfirmGoogleAds: true,
      autoConfirmWebsiteForms: true,
      templateType: 'custom_message',
      customMessage: 'Hello {customer_name}! 👋 Thank you for inquiring about {project_name}. Our senior property specialist {sales_rep} will connect with you shortly. You can also view project details here: {brochure_url}',
      metaTemplateName: 'lead_welcome_v1',
      excludeManualLeads: true,
    },
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
        setConfig((prev: any) => ({
          ...prev,
          ...res.config,
          widget: {
            ...(prev.widget || {}),
            ...(res.config.widget || {}),
            businessName: res.config.widget?.businessName || tenant?.name || prev.widget?.businessName,
          },
          leadConfirmation: {
            ...(prev.leadConfirmation || {}),
            ...(res.config.leadConfirmation || {}),
            excludeManualLeads: true,
          },
        }));
      }
    } catch (err) {
      console.warn('Failed loading WhatsApp config:', err);
    }
  };

  const handleSimulatorSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simulatorInput.trim() || simulatorLoading) return;
    const userText = simulatorInput.trim();
    setSimulatorInput('');
    const newHistory = [...simulatorMessages, { role: 'user' as const, text: userText }];
    setSimulatorMessages(newHistory);
    setSimulatorLoading(true);

    const phoneMatch = userText.match(/(?:\+91|91|0)?[6-9]\d{9}/);
    if (phoneMatch) {
      setSimulatorLeadCaptured(phoneMatch[0]);
    }

    try {
      const res = await whatsappHubService.sendWidgetChat({
        tenantId: tenant?.id || config.tenantId || 'default',
        message: userText,
        conversationHistory: newHistory.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
        })),
      });
      if (res?.reply) {
        setSimulatorMessages([...newHistory, { role: 'assistant' as const, text: res.reply }]);
      }
      if (res?.detectedPhone) {
        setSimulatorLeadCaptured(res.detectedPhone);
      }
    } catch (err: any) {
      setSimulatorMessages([
        ...newHistory,
        { role: 'assistant' as const, text: 'Bot response: ' + (err.message || 'Please check your AI API key & connection.') },
      ]);
    } finally {
      setSimulatorLoading(false);
    }
  };

  const handleTestConfirmation = async () => {
    if (!testConfirmPhone.trim()) {
      alert('Please enter a test mobile number with country code (e.g. 919876543210)');
      return;
    }
    setTestingConfirm(true);
    setTestConfirmResult(null);
    try {
      const res = await whatsappHubService.testConfirmation({
        testPhone: testConfirmPhone.trim(),
        customMessage: config.leadConfirmation?.customMessage,
      });
      setTestConfirmResult(res);
    } catch (err: any) {
      setTestConfirmResult({ success: false, error: err.message });
    } finally {
      setTestingConfirm(false);
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
          setTimeout(() => scrollToChatBottom(false), 50);
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
      setTimeout(() => scrollToChatBottom(true), 100);
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

  const loadLearningPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const res = await whatsappHubService.getLearningPatterns();
      if (res?.patterns) {
        setLearningPatterns(res.patterns);
      }
    } catch (err: any) {
      console.error('Error fetching learning patterns:', err);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleLabelConversation = async (conversationId: string, label: string) => {
    setLabelingConv(true);
    try {
      const res = await whatsappHubService.labelConversation(conversationId, label);
      alert(`🎯 Continuous Learning Feedback Saved! Bot intelligence pattern updated for [${label.replace(/_/g, ' ')}]. Authenticity score updated to ${res.authenticityScore}/100.`);
      await loadConversations(true);
      if (selectedConv?.id === conversationId) {
        setSelectedConv((prev: any) => ({
          ...prev,
          metadata: {
            ...(prev?.metadata || {}),
            lead_classification: label,
            authenticity_score: res.authenticityScore,
          },
        }));
      }
    } catch (err: any) {
      alert(`Error saving learning feedback: ${err.message}`);
    } finally {
      setLabelingConv(false);
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
      setNewBroadcast({ title: '', templateName: '', customMessage: '', targetAudience: 'all_leads' });
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
    <div className="space-y-6 pb-12 pt-3 md:pt-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'inbox'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Live Chat
          {summary.agent_requested_count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-400 text-slate-950 font-bold rounded-full animate-pulse">
              {summary.agent_requested_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('api_setup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'api_setup' || activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          API Setup
        </button>

        <button
          onClick={() => { setActiveTab('templates'); loadTemplates(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Templates
        </button>

        <button
          onClick={() => setActiveTab('widget')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'widget'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Website Widget & AI Bot
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'automations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          Lead Automations
        </button>

        <button
          onClick={() => { setActiveTab('broadcast'); loadBroadcasts(); loadTemplates(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          Bulk Broadcasts
        </button>

        <button
          onClick={() => setActiveTab('otp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'otp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          OTP Engine
        </button>

        <button
          onClick={() => { setActiveTab('intelligence'); loadLearningPatterns(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'intelligence'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4 text-purple-300" />
          AI Learning
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE CHAT INBOX                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-16.5rem)] min-h-[480px]">
          {/* Left: Conversation List */}
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-0 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
            {/* Search & Filter */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-slate-800">
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
                          {conv.metadata?.city ? ` • 📍 ${conv.metadata.city}` : ''}
                          {conv.metadata?.company_name ? ` • 🏢 ${conv.metadata.company_name}` : ''}
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

                          <div className="flex items-center gap-1.5">
                            {conv.metadata?.authenticity_score !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                conv.metadata.authenticity_score >= 70
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : conv.metadata.authenticity_score >= 40
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`} title="Authenticity & Threat Score">
                                {conv.metadata.authenticity_score}%
                              </span>
                            )}
                            {conv.unread_count > 0 && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Window */}
          <div className="md:col-span-8 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
            {selectedConv ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedConv.customer_name ? selectedConv.customer_name[0].toUpperCase() : 'V'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedConv.customer_name || 'Website Visitor'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-mono">{selectedConv.phone}</span>
                        {selectedConv.metadata?.city && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-950/60 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            📍 {selectedConv.metadata.city}
                          </span>
                        )}
                        {selectedConv.metadata?.company_name && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950/60 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                            🏢 {selectedConv.metadata.company_name}
                          </span>
                        )}
                        <span>•</span>
                        <a href={`tel:${selectedConv.phone}`} className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3" /> Call Prospect
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

                {/* Lead Authenticity & Continuous Learning Banner */}
                <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Authenticity:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                      (selectedConv.metadata?.authenticity_score ?? 50) >= 70
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : (selectedConv.metadata?.authenticity_score ?? 50) >= 40
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {(selectedConv.metadata?.authenticity_score ?? 50) >= 70 ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (selectedConv.metadata?.authenticity_score ?? 50) >= 40 ? (
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      Score: {selectedConv.metadata?.authenticity_score ?? 50}/100
                      {selectedConv.metadata?.token_shield_active && ' • 🛡️ Token Shield Active'}
                    </span>
                    {selectedConv.metadata?.lead_classification && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold uppercase text-[10px]">
                        {selectedConv.metadata.lead_classification.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* 1-Click Classification Feedback buttons (Train the Bot) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Teach Bot:</span>
                    <button
                      onClick={() => handleLabelConversation(selectedConv.id, 'genuine_builder')}
                      disabled={labelingConv}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Reinforce as genuine builder pattern"
                    >
                      ✓ Builder
                    </button>
                    <button
                      onClick={() => handleLabelConversation(selectedConv.id, 'genuine_broker')}
                      disabled={labelingConv}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Reinforce as genuine broker pattern"
                    >
                      ✓ Broker
                    </button>
                    <button
                      onClick={() => handleLabelConversation(selectedConv.id, 'competitor_probe')}
                      disabled={labelingConv}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Flag competitor probing"
                    >
                      ⚠️ Competitor
                    </button>
                    <button
                      onClick={() => handleLabelConversation(selectedConv.id, 'spammer_token_drain')}
                      disabled={labelingConv}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Flag spam / token drain"
                    >
                      🚫 Token Drain
                    </button>
                  </div>
                </div>

                {/* Chat History Bubbles */}
                <div ref={chatContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-contain space-y-3 bg-[#e5ddd5]/20 dark:bg-slate-950/60">
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
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
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
      {/* TAB: AI LEAD INTELLIGENCE & CONTINUOUS LEARNING PATTERNS                  */}
      {/* ========================================================================= */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Top Engine Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authenticity Engine</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">Active & Live</div>
              <p className="text-xs text-slate-500 mt-1">Evaluates 6 signal vectors per message</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Token Shield</span>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">Zero Token Drain</div>
              <p className="text-xs text-slate-500 mt-1">Halts LLM on spammers & competitors</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Continuous Learning</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">Online Reinforcement</div>
              <p className="text-xs text-slate-500 mt-1">Self-learns from signups & admin tags</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Learned Patterns</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{learningPatterns.length} Signatures</div>
              <p className="text-xs text-slate-500 mt-1">Persisted in Postgres pattern store</p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-purple-900/10 via-emerald-900/10 to-blue-900/10 border border-purple-200/50 dark:border-purple-800/40 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">How Continuous Learning Works in RealSalePro</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Every time a prospect chats on WhatsApp, the model calculates their <strong>Authenticity Score (0-100)</strong> based on real estate domain signals (RERA, units, telecaller masking, lead portals). If a user registers their company or is verified by you in Live Chat, their linguistic signature is reinforced with positive reward weights. If a visitor asks evasive questions or acts like a competitor, the <strong>Token Shield</strong> switches to deterministic gatekeeping to eliminate API token costs.
                </p>
              </div>
            </div>
          </div>

          {/* Learned Patterns Knowledge Base */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Active Learned Domain Signatures & Qualification Probes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These real estate intent patterns and dynamic qualification questions are actively injected into the DeepSeek AI prompt.
                </p>
              </div>
              <button
                onClick={loadLearningPatterns}
                disabled={loadingPatterns}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPatterns ? 'animate-spin' : ''}`} />
                Refresh Patterns
              </button>
            </div>

            {loadingPatterns && learningPatterns.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading pattern signatures...</div>
            ) : learningPatterns.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No patterns recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3 pr-4">Pattern Category</th>
                      <th className="pb-3 px-4">Sample Visitor Phrase</th>
                      <th className="pb-3 px-4">Effective Qualification Probe</th>
                      <th className="pb-3 px-4 text-center">Confidence</th>
                      <th className="pb-3 px-4 text-center">Matches / Converted</th>
                      <th className="pb-3 pl-4">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {learningPatterns.map((pat) => {
                      const isGenuine = pat.pattern_type.startsWith('genuine');
                      const isCompetitor = pat.pattern_type === 'competitor_probe';
                      const isSpam = pat.pattern_type === 'spammer_token_drain';

                      return (
                        <tr key={pat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              isGenuine
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isCompetitor
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : isSpam
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}>
                              {isGenuine ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : isCompetitor ? <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                              {pat.pattern_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                            "{pat.sample_phrase}"
                          </td>
                          <td className="py-3.5 px-4 max-w-sm text-slate-600 dark:text-slate-300 font-medium italic">
                            "{pat.effective_probe_question || 'N/A'}"
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {Math.round(Number(pat.confidence_score) * 100)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{pat.times_matched || 1}</span>
                            {' / '}
                            <span className="font-semibold text-emerald-600">{pat.times_converted || 0}</span>
                          </td>
                          <td className="py-3.5 pl-4 whitespace-nowrap text-slate-400 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              {pat.source}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                  <span>📍 <strong>Contact Sources:</strong> Unified auto-sync from CRM Leads (Meta Ads, Google, 99acres, Magicbricks) + WhatsApp Landing Inquiries.</span>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Use Pre-Approved Meta Template (Recommended for 100% Delivery)
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('templates'); loadTemplates(); }}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    + Create / Approve Template in Meta Hub
                  </button>
                </div>
                <select
                  value={newBroadcast.templateName}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const matched = templates.find((t) => t.name === selName);
                    const bodyText = matched?.components?.find((c: any) => c.type === 'BODY')?.text || '';
                    setNewBroadcast({
                      ...newBroadcast,
                      templateName: selName,
                      customMessage: bodyText || newBroadcast.customMessage,
                    });
                  }}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">None (Send as Custom Text Message)</option>
                  {templates.filter((t) => t.status === 'APPROVED').map((t) => (
                    <option key={t.name} value={t.name}>
                      ✓ {t.name} ({t.category} - {t.language})
                    </option>
                  ))}
                  {templates.filter((t) => t.status !== 'APPROVED').map((t) => (
                    <option key={t.name} value={t.name} disabled>
                      ⏳ {t.name} ({t.status})
                    </option>
                  ))}
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
      {/* TAB 2: WHATSAPP API SETUP & CONNECTION STATUS                              */}
      {/* ========================================================================= */}
      {(activeTab === 'api_setup' || activeTab === 'settings') && (
        <div className="space-y-6 max-w-4xl">
          {/* Connection Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Meta WhatsApp Cloud API Connection Status
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Direct connection with official Meta Cloud API servers. Zero 3rd party middleman markups.
                </p>
              </div>

              <button
                type="button"
                onClick={checkConnection}
                disabled={testingConnection}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                {testingConnection ? 'Testing Meta Handshake...' : 'Test Meta API Connection'}
              </button>
            </div>

            {connectionStatus && (
              <div className={`mt-4 p-4 rounded-xl border text-xs ${connectionStatus.success ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span>{connectionStatus.success ? 'Official Meta API Connected & Ready' : 'Connection Failed'}</span>
                </div>
                {connectionStatus.success ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">VERIFIED BUSINESS NAME</span>
                      <strong className="font-semibold">{connectionStatus.verifiedName || 'RealSalePro Properties'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">DISPLAY PHONE NUMBER</span>
                      <strong className="font-mono">{connectionStatus.displayPhoneNumber || '+91 70797 37773'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">META QUALITY RATING</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {connectionStatus.qualityRating || 'GREEN (High Quality)'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-[11px]">{connectionStatus.error || 'Invalid credentials or expired access token.'}</p>
                )}
              </div>
            )}
          </div>

          {/* Webhook Callback Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Meta Inbound Webhook Configuration
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              In your Meta for Developers App &gt; <strong>WhatsApp &gt; Configuration</strong>, paste this Callback URL and Verify Token to receive live messages and status updates:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/whatsapp/webhook`}
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
                Verify Token: <code className="bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded font-mono font-bold">{config.webhookVerifyToken || 'realsalepro_wa_secret'}</code>
              </div>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official WhatsApp Cloud API Credentials</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Phone Number ID (from Meta WhatsApp App)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1435084146353236"
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
                  placeholder="e.g. 1137788795833452"
                  value={config.wabaId}
                  onChange={(e) => setConfig({ ...config, wabaId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Permanent System User Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showToken ? 'Hide Token' : 'Show Token'}
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
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
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save API Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEBSITE WHATSAPP WIDGET WITH AI CHATBOT                            */}
      {/* ========================================================================= */}
      {activeTab === 'widget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Embed & Settings */}
          <div className="lg:col-span-7 space-y-6">
            {/* Embed Code Snippet */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-600" />
                  Website Embed Snippet
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  1-Line Integration
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Copy and paste this script tag right before the closing <code>&lt;/body&gt;</code> tag on your WordPress, Webflow, Shopify, or custom HTML website.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value={`<script src="${window.location.origin}/api/whatsapp/widget.js" data-tenant="${tenant?.id || config.tenantId || 'default'}"></script>`}
                  className="w-full p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const snippet = `<script src="${window.location.origin}/api/whatsapp/widget.js" data-tenant="${tenant?.id || config.tenantId || 'default'}"></script>`;
                    navigator.clipboard.writeText(snippet);
                    setCopiedWidgetSnippet(true);
                    setTimeout(() => setCopiedWidgetSnippet(false), 2000);
                  }}
                  className="absolute right-2.5 top-2.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedWidgetSnippet ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Widget Design & Basic Settings */}
            <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Widget Customization & Appearance
                  </h3>
                  <p className="text-xs text-slate-500">Customize how your floating WhatsApp chat bubble appears to visitors.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.widget?.enabled ?? true}
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Widget Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Business Display Name</label>
                  <input
                    type="text"
                    value={config.widget?.businessName || ''}
                    placeholder="e.g. Apex Realty"
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), businessName: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">AI Agent / Consultant Name</label>
                  <input
                    type="text"
                    value={config.widget?.agentName || ''}
                    placeholder="e.g. Rahul (Property Consultant)"
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), agentName: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Direct WhatsApp Mobile Number</label>
                  <input
                    type="text"
                    value={config.widget?.displayPhone || ''}
                    placeholder="e.g. 917079737773"
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), displayPhone: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.widget?.primaryColor || '#25D366'}
                      onChange={(e) => setConfig({
                        ...config,
                        widget: { ...(config.widget || {}), primaryColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={config.widget?.primaryColor || '#25D366'}
                      onChange={(e) => setConfig({
                        ...config,
                        widget: { ...(config.widget || {}), primaryColor: e.target.value }
                      })}
                      className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Initial Greeting Message</label>
                  <input
                    type="text"
                    value={config.widget?.welcomeMessage || ''}
                    placeholder="Hi there! 👋 How can we help you find your dream property today?"
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), welcomeMessage: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* AI Chatbot Configuration */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    AI Chatbot Engine & Custom API Key
                  </h4>
                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    Auto-Trained on CRM Data
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">AI Engine Provider</label>
                    <select
                      value={config.widget?.aiProvider || config.aiProvider || 'builtin'}
                      onChange={(e) => setConfig({
                        ...config,
                        aiProvider: e.target.value,
                        widget: { ...(config.widget || {}), aiProvider: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="builtin">Built-in Real Estate Engine (Zero Config)</option>
                      <option value="openai">Custom OpenAI (GPT-4o / GPT-4o-mini)</option>
                      <option value="gemini">Custom Google Gemini (Gemini 1.5 Flash)</option>
                      <option value="deepseek">Custom DeepSeek (DeepSeek V3 / R1)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">Custom AI API Key</label>
                      <button
                        type="button"
                        onClick={() => setShowAiKey(!showAiKey)}
                        className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {showAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showAiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      placeholder="e.g. sk-proj-... / AIzaSy..."
                      value={config.widget?.aiApiKey || config.aiApiKey || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig({
                          ...config,
                          aiApiKey: val,
                          widget: { ...(config.widget || {}), aiApiKey: val }
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Business Knowledge Base Training */}
                <div className="text-xs space-y-1.5">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Business Knowledge Base & FAQs (Trained into AI Bot)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter key property details, price per sqft, payment plans, site visit timings, amenities, and FAQs. The AI chatbot will use this data to answer visitor questions accurately."
                    value={config.widget?.knowledgeBase || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      widget: { ...(config.widget || {}), knowledgeBase: e.target.value }
                    })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Your active CRM property projects and listings are automatically included in the AI context.</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {savingConfig ? 'Saving...' : 'Save Widget & AI Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Interactive Widget Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Widget Simulator</h4>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Interactive Test
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Type questions below to test how your AI chatbot responds to potential buyers before deploying to your website.
              </p>

              {/* Chat Container */}
              <div className="mt-4 bg-[#0B141A] rounded-xl overflow-hidden border border-slate-800 flex flex-col h-[420px]">
                {/* Header */}
                <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3 border-b border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                    {config.widget?.agentName?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {config.widget?.businessName || tenant?.name || 'RealSalePro Properties'}
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {config.widget?.agentName || 'AI Assistant'} • Online
                    </div>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs bg-[#0c1317]">
                  {simulatorMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed text-xs ${
                          msg.role === 'user'
                            ? 'bg-[#005C4B] text-white rounded-br-sm'
                            : 'bg-[#202C33] text-slate-100 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {simulatorLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#202C33] text-slate-300 rounded-2xl px-3.5 py-2 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lead Captured Alert */}
                {simulatorLeadCaptured && (
                  <div className="px-3 py-1.5 bg-emerald-950/80 border-t border-emerald-800 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>🎯 Lead captured: <strong>{simulatorLeadCaptured}</strong></span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Auto-saved to CRM</span>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSimulatorSend} className="p-2.5 bg-[#1F2C34] flex items-center gap-2 border-t border-slate-700/50">
                  <input
                    type="text"
                    value={simulatorInput}
                    onChange={(e) => setSimulatorInput(e.target.value)}
                    placeholder="Ask about properties, pricing, or enter phone..."
                    className="flex-1 bg-[#2A3942] text-white text-xs px-3.5 py-2 rounded-xl focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={simulatorLoading || !simulatorInput.trim()}
                    className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUTOMATED WHATSAPP CONFIRMATION FOR LEADS                          */}
      {/* ========================================================================= */}
      {activeTab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Strict Manual Exclusion Policy Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Strict Automation Rule: Manual Leads 100% Excluded</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Automated WhatsApp greetings trigger <strong>ONLY for digitally generated leads</strong> entering via Meta Ads, Google Ads, or Website Webhooks. Leads entered manually by sales reps or CRM staff are strictly excluded from automated dispatches.
              </p>
            </div>

            {/* Inbound Digital Channels Configuration */}
            <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Active Digital Inbound Channels
              </h3>

              <div className="space-y-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Meta Ads (Facebook &amp; Instagram Lead Forms)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dispatches instant WhatsApp confirmation upon form submission on Facebook / Instagram.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.leadConfirmation?.autoConfirmMetaAds ?? true}
                    onChange={(e) => setConfig({
                      ...config,
                      leadConfirmation: {
                        ...(config.leadConfirmation || {}),
                        autoConfirmMetaAds: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Google Ads Inbound Leads (GCLID Forms)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Welcomes Google Search and Display campaign inquiries directly on WhatsApp.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.leadConfirmation?.autoConfirmGoogleAds ?? true}
                    onChange={(e) => setConfig({
                      ...config,
                      leadConfirmation: {
                        ...(config.leadConfirmation || {}),
                        autoConfirmGoogleAds: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Website Inbound Forms &amp; Landing Page Webhooks
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Triggers instant confirmation for website inquiries from WordPress, Elementor, and custom webhooks.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.leadConfirmation?.autoConfirmWebsiteForms ?? true}
                    onChange={(e) => setConfig({
                      ...config,
                      leadConfirmation: {
                        ...(config.leadConfirmation || {}),
                        autoConfirmWebsiteForms: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>
              </div>

              {/* Message Template Customizer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lead Confirmation Message Template
                  </label>
                  <span className="text-[11px] text-slate-400">Click a tag to insert</span>
                </div>

                {/* Variable Tag Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{customer_name}',
                    '{project_name}',
                    '{sales_rep}',
                    '{company_name}',
                    '{brochure_url}',
                    '{lead_source}',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = config.leadConfirmation?.customMessage || '';
                        setConfig({
                          ...config,
                          leadConfirmation: {
                            ...(config.leadConfirmation || {}),
                            customMessage: `${current} ${tag}`,
                          }
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-semibold transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={config.leadConfirmation?.customMessage || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    leadConfirmation: {
                      ...(config.leadConfirmation || {}),
                      customMessage: e.target.value,
                    }
                  })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {savingConfig ? 'Saving...' : 'Save Automation Rules'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile Preview & Test Dispatcher */}
          <div className="lg:col-span-5 space-y-6">
            {/* Mobile WhatsApp Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Customer Mobile Preview (WhatsApp)
              </h4>

              <div className="bg-[#ECE5DD] dark:bg-[#0c1317] p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[220px] flex flex-col justify-end">
                <div className="bg-white dark:bg-[#202C33] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-bl-sm shadow-sm text-xs leading-relaxed max-w-[90%]">
                  <p className="whitespace-pre-wrap">
                    {(config.leadConfirmation?.customMessage || 'Hello {customer_name}! 👋 Thank you for inquiring about {project_name}.')
                      .replace('{customer_name}', 'Rahul Sharma')
                      .replace('{project_name}', 'Devashree Residency')
                      .replace('{sales_rep}', 'Gaurav Singh')
                      .replace('{company_name}', tenant?.name || 'RealSalePro Properties')
                      .replace('{brochure_url}', 'https://realsalepro.com/b/sample.pdf')
                      .replace('{lead_source}', 'Meta Ads')}
                  </p>
                  <div className="text-[10px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>10:30 AM</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Test Dispatcher */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Live Test Dispatch Tool
              </h4>
              <p className="text-xs text-slate-500">
                Send a real test WhatsApp message to your own phone number to verify instant delivery.
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter mobile with country code (e.g. 919876543210)"
                  value={testConfirmPhone}
                  onChange={(e) => setTestConfirmPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />

                <button
                  type="button"
                  onClick={handleTestConfirmation}
                  disabled={testingConfirm || !testConfirmPhone.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testingConfirm ? 'animate-spin' : ''}`} />
                  {testingConfirm ? 'Sending Test WhatsApp...' : 'Send Test Lead Confirmation'}
                </button>
              </div>

              {testConfirmResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${testConfirmResult.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                  {testConfirmResult.success ? (
                    <div>
                      🎉 Message dispatched successfully!
                      {testConfirmResult.messageId && (
                        <div className="font-mono text-[10px] mt-1 text-slate-500">
                          Meta Message ID: {testConfirmResult.messageId}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>❌ {testConfirmResult.error || 'Failed to dispatch test message.'}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

