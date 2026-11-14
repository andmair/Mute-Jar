import React, { useState } from 'react';
import {
  X,
  Monitor,
  MessageSquare,
  Bot,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Server,
  Code,
  Check,
  RefreshCw,
  Power,
  Apple,
  Chrome,
  Layers,
  ArrowRight,
  Package,
  Download,
  Terminal,
} from 'lucide-react';
import { useMuteJar } from '../context/MuteJarContext';
import { usePWAInstall } from '../utils/usePWAInstall';
import { ChatPlatform, PublishableEventType } from '../types';
import { buildSanitizedChatPayload, generateMcpClientConfig } from '../utils/integrations';
import { getLocalApiUrl } from '../utils/localSidecar';
import { MuteJarLogo } from './MuteJarLogo';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'desktop' | 'chat' | 'mcp' | 'packaging';
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'desktop',
}) => {
  const {
    settings,
    updateSettings,
    currentCycleCoins,
    integrationsConfig,
    updateIntegrationsConfig,
    addChatChannel,
    removeChatChannel,
    updatePublishRule,
    testChatChannel,
    dispatchIntegrationEvent,
  } = useMuteJar();

  const { isInstallable, isInstalled, os, install } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'desktop' | 'chat' | 'mcp' | 'packaging'>(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // OS tab in desktop guide
  const [selectedOsTab, setSelectedOsTab] = useState<'mac' | 'windows' | 'linux' | 'chromeos'>(
    os === 'mac' ? 'mac' : os === 'linux' ? 'linux' : os === 'chromeos' ? 'chromeos' : 'windows'
  );

  // Chat channels state
  const [newPlatform, setNewPlatform] = useState<ChatPlatform>('slack');
  const [newName, setNewName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [testingEventType, setTestingEventType] = useState<PublishableEventType | null>(null);
  const [triggerSuccessNote, setTriggerSuccessNote] = useState<string | null>(null);

  // MCP state
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);
  const [mcpInspectorOpen, setMcpInspectorOpen] = useState(false);
  const [mcpInspectorData, setMcpInspectorData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingMcp, setIsLoadingMcp] = useState(false);

  // Staged /downloads installer catalog state
  type InstallerCatalogMap = Record<
    'macos' | 'windows' | 'linux' | 'chromeos',
    Array<{
      filename: string;
      os: string;
      sizeBytes: number;
      updatedAt: string;
      downloadUrl: string;
    }>
  >;
  const [installersCatalog, setInstallersCatalog] = useState<InstallerCatalogMap>({
    macos: [],
    windows: [],
    linux: [],
    chromeos: [],
  });
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(false);

  const loadInstallersCatalog = React.useCallback(async () => {
    setIsLoadingDownloads(true);
    try {
      const res = await fetch(getLocalApiUrl('/downloads'));
      if (!res.ok) return;
      const data = await res.json();
      if (data?.installers) {
        setInstallersCatalog({
          macos: Array.isArray(data.installers.macos) ? data.installers.macos : [],
          windows: Array.isArray(data.installers.windows) ? data.installers.windows : [],
          linux: Array.isArray(data.installers.linux) ? data.installers.linux : [],
          chromeos: Array.isArray(data.installers.chromeos) ? data.installers.chromeos : [],
        });
      }
    } catch {
      // Static/offline mode without Express sidecar
    } finally {
      setIsLoadingDownloads(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen && activeTab === 'packaging') {
      loadInstallersCatalog();
    }
  }, [isOpen, activeTab, loadInstallersCatalog]);

  if (!isOpen) return null;

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = newName.trim();
    const trimmedUrl = newWebhookUrl.trim();

    if (!trimmedName) {
      setFormError('Please enter a channel name (e.g. #watercooler-dares)');
      return;
    }
    if (!trimmedUrl) {
      setFormError('Please enter an Incoming Webhook URL');
      return;
    }

    try {
      const url = new URL(trimmedUrl);
      if (!['https:', 'http:'].includes(url.protocol)) {
        setFormError('Webhook URL must start with https://');
        return;
      }
    } catch {
      setFormError('Please enter a valid URL');
      return;
    }

    addChatChannel({
      name: trimmedName,
      platform: newPlatform,
      webhookUrl: trimmedUrl,
    });

    setNewName('');
    setNewWebhookUrl('');
    setFormError(null);
  };

  const handleTestChannel = async (id: string) => {
    setTestingChannelId(id);
    setTestResult(null);

    const res = await testChatChannel(id);
    if (res.success) {
      setTestResult({
        id,
        success: true,
        message: 'Verified! Test ping was received successfully by your chat channel.',
      });
    } else {
      setTestResult({
        id,
        success: false,
        message: res.error || 'Connection failed. Please check the webhook URL.',
      });
    }
    setTestingChannelId(null);
  };

  const handleTriggerTestEvent = async (eventType: PublishableEventType) => {
    setTestingEventType(eventType);
    setTriggerSuccessNote(null);

    await dispatchIntegrationEvent(eventType, {
      coinCount: 1,
      totalCycleCoins: Math.max(1, currentCycleCoins),
      goalTitle: 'Weekly Coffee Shout',
      goalValue: '$12.00',
    });

    setTriggerSuccessNote(`Dispatched test "${eventType}" event to active channels.`);
    setTimeout(() => {
      setTestingEventType(null);
      setTriggerSuccessNote(null);
    }, 3000);
  };

  const handleCopyMcpConfig = () => {
    const jsonStr = generateMcpClientConfig(3000);
    navigator.clipboard.writeText(jsonStr);
    setCopiedMcpConfig(true);
    setTimeout(() => setCopiedMcpConfig(false), 2000);
  };

  const handleInspectMcp = async () => {
    setIsLoadingMcp(true);
    try {
      const res = await fetch(getLocalApiUrl('/api/mcp'));
      const data = await res.json();
      setMcpInspectorData(data);
      setMcpInspectorOpen(true);
    } catch {
      setMcpInspectorData({
        status: 'offline',
        note: 'Run optional local sidecar (`npm run sidecar`) to activate http://localhost:3000/api/mcp',
      });
      setMcpInspectorOpen(true);
    } finally {
      setIsLoadingMcp(false);
    }
  };

  const sampleChannel = integrationsConfig.channels[0] || { platform: 'slack' };
  const samplePayload = buildSanitizedChatPayload(sampleChannel.platform, 'mute_deposit', {
    userName: settings.userName || 'Alex M',
    coinCount: 1,
    totalCycleCoins: Math.max(1, currentCycleCoins),
    roastQuote: 'Coffee shout incoming!',
  });

  const activeOsFolder: 'macos' | 'windows' | 'linux' | 'chromeos' =
    selectedOsTab === 'mac' ? 'macos' : selectedOsTab;
  const activeOsDownloads = installersCatalog[activeOsFolder] || [];
  const totalStagedDownloads =
    installersCatalog.macos.length +
    installersCatalog.windows.length +
    installersCatalog.linux.length +
    installersCatalog.chromeos.length;

  const formatInstallerSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <MuteJarLogo className="w-8 h-8" animated />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Application Setup &amp; Integrations Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure desktop autostart, team chat webhooks, and local AI agent connectivity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-amber-500" />
            <span>Desktop &amp; Autostart</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chat Channels ({integrationsConfig.channels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'mcp'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            <span>Local AI Connect (MCP)</span>
          </button>

          <button
            onClick={() => setActiveTab('packaging')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === 'packaging'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-sky-500" />
            <span>Desktop Installers</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: DESKTOP & AUTOSTART */}
          {activeTab === 'desktop' && (
            <div className="space-y-5">
              {/* 1-Click Install Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-300 dark:border-amber-700/60 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {isInstalled ? 'App Installed as Desktop Application' : 'Install Mute Jar on Desktop'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    {isInstalled
                      ? 'Running with standalone window and system taskbar/dock presence.'
                      : 'Install Mute Jar as a native desktop application with offline support and status bar presence.'}
                  </p>
                </div>

                {!isInstalled && isInstallable && (
                  <button
                    onClick={install}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Install App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {isInstalled && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Installed</span>
                  </span>
                )}
              </div>

              {/* OS Autostart Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Power className="w-4 h-4 text-amber-500" />
                  <span>OS Background &amp; Autostart Preferences</span>
                </h3>

                <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-1">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Launch Mute Jar automatically on system startup
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Opens in the background on Windows, macOS, or ChromeOS login so you never miss a muted speech incident.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoStartOnOSBoot ?? true}
                    onChange={(e) => updateSettings({ autoStartOnOSBoot: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Minimize to System Tray / Menu Bar on close
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      When closing the window, keep monitoring quietly in your macOS Menu Bar or Windows System Tray.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.minimizeToTray ?? true}
                    onChange={(e) => updateSettings({ minimizeToTray: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                        Pause Audio Monitor in OS Focus / Do Not Disturb
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                        Privacy Default
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Automatically pauses microphone capture whenever macOS Focus, Windows Focus Assist, or DND is enabled.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pauseOnDoNotDisturb ?? true}
                    onChange={(e) => updateSettings({ pauseOnDoNotDisturb: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {/* OS Startup Quick Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Platform Startup Instructions
                </h4>

                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['mac', 'windows', 'linux', 'chromeos'] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSelectedOsTab(platform)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                        selectedOsTab === platform
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      {platform === 'mac' ? 'macOS' : platform === 'chromeos' ? 'ChromeOS' : platform}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedOsTab === 'mac' && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open <strong>System Settings → General → Login Items</strong>.</li>
                      <li>Click the <strong>+</strong> button under &ldquo;Open at Login&rdquo;.</li>
                      <li>Select <strong>Mute Jar</strong> from your Applications folder.</li>
                      <li>Mute Jar will now silently start on boot in the top menu bar.</li>
                    </ol>
                  )}
                  {selectedOsTab === 'windows' && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Press <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">Win + R</code>, type <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">shell:startup</code>, and press Enter.</li>
                      <li>Drag the <strong>Mute Jar</strong> desktop shortcut into this Startup folder.</li>
                      <li>Windows will launch Mute Jar automatically upon boot in the system tray.</li>
                    </ol>
                  )}
                  {selectedOsTab === 'linux' && (
                    <p>
                      Add a desktop entry into <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">~/.config/autostart/mutejar.desktop</code> pointing to the app binary or URL.
                    </p>
                  )}
                  {selectedOsTab === 'chromeos' && (
                    <p>
                      Install via the Chrome URL bar icon, right-click the Mute Jar icon on the shelf, and select <strong>&ldquo;Autostart app&rdquo;</strong>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT CHANNELS & RULES */}
          {activeTab === 'chat' && (
            <div className="space-y-5">
              {/* Privacy Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-semibold block text-emerald-950 dark:text-emerald-200">
                    Strict Privacy Scrubbing Active
                  </strong>
                  Meeting titles, calendar notes, attendees, and audio waveforms are <strong>100% stripped</strong>. Outbound messages strictly share member name, coin count, and pledge titles.
                </div>
              </div>

              {/* Channels List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Configured Chat Channels
                  </h3>
                  <span className="text-[11px] text-slate-400">Write-only Incoming Webhooks</span>
                </div>

                {integrationsConfig.channels.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No chat channels added yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add a Slack, Discord, or Teams Incoming Webhook below to connect your first channel.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {integrationsConfig.channels.map((chan) => (
                      <div
                        key={chan.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                              {chan.platform}
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {chan.name}
                            </span>
                            {chan.verified ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" /> Unverified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                            {chan.webhookUrl ? chan.webhookUrl.replace(/\/[^/]+$/, '/••••••••') : 'No webhook URL configured'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTestChannel(chan.id)}
                            disabled={testingChannelId === chan.id || !chan.webhookUrl}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            {testingChannelId === chan.id ? 'Testing...' : 'Test Connection'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeChatChannel(chan.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Remove channel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Add Channel Form */}
              <form
                onSubmit={handleAddChannel}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-500" />
                    <span>Add New Chat Channel</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Slack · Discord · Teams</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Platform
                    </label>
                    <select
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value as ChatPlatform)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="slack">Slack Incoming Webhook</option>
                      <option value="discord">Discord Channel Webhook</option>
                      <option value="teams">Microsoft Teams Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Channel Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #watercooler-dares"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Incoming Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Zero read access. Only posts to this specific channel.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Channel
                  </button>
                </div>
              </form>

              {/* Event Publishing Rules */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Publishing Rules (1 Channel per Event Trigger)
                </h3>

                <div className="space-y-3">
                  {integrationsConfig.rules.map((rule) => {
                    const eventTitles: Record<PublishableEventType, string> = {
                      mute_deposit: '🪙 Mute Incident Deposited',
                      milestone_reach: '🎯 Cycle Milestone Reached',
                      goal_completed: '🏆 Pledge Goal Completed',
                      cycle_summary: '📊 Monthly Cycle Recap',
                    };

                    return (
                      <div
                        key={rule.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {eventTitles[rule.eventType] || rule.eventType}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {rule.enabled ? 'Publishes to:' : 'Publishing currently paused'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {rule.enabled && (
                            <select
                              value={rule.channelId}
                              onChange={(e) => updatePublishRule(rule.id, { channelId: e.target.value })}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            >
                              {integrationsConfig.channels.map((c) => (
                                <option key={c.id} value={c.id}>
                                  [{c.platform.toUpperCase()}] {c.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTriggerTestEvent(rule.eventType)}
                            disabled={testingEventType === rule.eventType || !rule.enabled}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                          >
                            {testingEventType === rule.eventType ? 'Sent' : 'Test'}
                          </button>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updatePublishRule(rule.id, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500" />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {triggerSuccessNote && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {triggerSuccessNote}
                  </p>
                )}
              </div>

              {/* Sanitized Outbound Payload Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                    <Code className="w-3.5 h-3.5 text-amber-400" /> Outbound Payload Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">🔒 Zero Meeting Titles</span>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(samplePayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL AI & MCP */}
          {activeTab === 'mcp' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:text-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Local Model Context Protocol (MCP) Server Active
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> http://localhost:3000/api/mcp
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your local Mute Jar instance exposes a standard JSON-RPC Model Context Protocol endpoint.
                  Desktop AI applications like <strong>Anthropic Claude Desktop</strong>, <strong>Cursor AI</strong>,
                  or local Ollama runners can query your mute habits, streaks, and pledges locally without cloud storage.
                </p>
              </div>

              {/* Master Toggle */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable MCP Protocol Endpoint
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allows local AI assistants to inspect resources and call tools on-device.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrationsConfig.mcpEnabled !== false}
                    onChange={(e) => updateIntegrationsConfig({ mcpEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Claude Desktop Config Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Claude Desktop Configuration (`claude_desktop_config.json`)
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyMcpConfig}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMcpConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMcpConfig ? 'Copied' : 'Copy Config'}
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 overflow-x-auto">
                  <pre>{generateMcpClientConfig(3000)}</pre>
                </div>
                <p className="text-[11px] text-slate-400">
                  📁 Path: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                </p>
              </div>

              {/* Exposed Resources & Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-500" /> Read-Only Resources
                  </h5>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <li>• <strong className="text-slate-800 dark:text-slate-200">mutejar://stats</strong> (Cycle counts)</li>
                    <li>• <strong className="text-slate-800 dark:text-slate-200">mutejar://events</strong> (Sanitized tallies)</li>
                    <li>• <strong className="text-slate-800 dark:text-slate-200">mutejar://pledges</strong> (Pledge goals)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Exposed MCP Tools
                  </h5>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                    <li>• <strong className="text-slate-800 dark:text-slate-200">get_mute_stats()</strong>: Fetch totals & streaks</li>
                    <li>• <strong className="text-slate-800 dark:text-slate-200">list_pledges()</strong>: Query fulfilled/pending goals</li>
                    <li>• <strong className="text-slate-800 dark:text-slate-200">suggest_pledge_action()</strong>: Brainstorm ideas</li>
                  </ul>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleInspectMcp}
                  disabled={isLoadingMcp}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMcp ? 'animate-spin' : ''}`} />
                  Inspect Live MCP Protocol Schema
                </button>
              </div>

              {mcpInspectorOpen && mcpInspectorData ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>GET /api/mcp Response</span>
                    <button
                      onClick={() => setMcpInspectorOpen(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px]">
                    {JSON.stringify(mcpInspectorData, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: SINGLE-FILE DESKTOP INSTALLERS */}
          {activeTab === 'packaging' && (
            <div className="space-y-5 leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 space-y-1.5">
                <h3 className="text-xs font-bold text-sky-950 dark:text-sky-100 flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Single-File Native Desktop Packages (Tauri v2)</span>
                </h3>
                <p className="text-[11px] text-sky-800 dark:text-sky-200">
                  ~8–15 MB single-file installers · Zero Docker, Electron, or Node.js runtime needed · Offline-first local storage &amp; audio engine
                </p>
              </div>

              {/* OS Selector */}
              <div className="space-y-3">
                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
                  {([
                    { id: 'windows', label: 'Windows (.exe / .msi)' },
                    { id: 'mac', label: 'macOS (.dmg)' },
                    { id: 'linux', label: 'Linux (.AppImage / .deb)' },
                    { id: 'chromeos', label: 'ChromeOS (PWA)' },
                  ] as const).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedOsTab(item.id)}
                      className={`flex-1 py-1.5 px-2.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedOsTab === item.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Selected OS Guide */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  {selectedOsTab === 'windows' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Windows 10 / 11 Single-File Installer
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          MuteJar-Setup.exe · ~10 MB · WebView2
                        </span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Download <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">MuteJar_x64-setup.exe</code> or <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.msi</code> below (or from GitHub Actions artifacts).</li>
                        <li>Double-click the installer—Windows 10/11 already includes WebView2, so installation finishes in seconds.</li>
                        <li>Launch <strong>Mute Jar</strong> from the Start Menu and grant microphone access when starting the monitor.</li>
                      </ol>
                    </>
                  )}

                  {selectedOsTab === 'mac' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Apple className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                          <span>macOS Universal Disk Image (Apple Silicon &amp; Intel)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          MuteJar_universal.dmg · ~12 MB · WKWebView
                        </span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Download the single Universal <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.dmg</code> below (or from GitHub Actions artifacts).</li>
                        <li>Open the <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.dmg</code> and drag <strong>Mute Jar.app</strong> into your <strong>Applications</strong> folder.</li>
                        <li>On first launch, approve microphone permission in <strong>System Settings → Privacy &amp; Security → Microphone</strong> (pre-configured via <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">src-tauri/Info.plist</code>).</li>
                      </ol>
                    </>
                  )}

                  {selectedOsTab === 'linux' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Linux Portable AppImage &amp; Debian Package
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          .AppImage / .deb · ~14 MB · WebKitGTK
                        </span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li><strong>Zero-install AppImage</strong> (Ubuntu, Fedora, Arch): Download <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.AppImage</code>, run <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">chmod +x MuteJar*.AppImage</code>, and launch directly.</li>
                        <li><strong>Debian / Ubuntu package</strong>: Download <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.deb</code> and run <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">sudo apt install ./MuteJar*.deb</code> for desktop menu integration.</li>
                      </ol>
                    </>
                  )}

                  {selectedOsTab === 'chromeos' && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Chrome className="w-3.5 h-3.5 text-amber-500" />
                          <span>ChromeOS 1-Click Standalone App (PWA)</span>
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Zero download · Native Shelf &amp; Offline Cache
                        </span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Open Mute Jar in Chrome and click <strong>Install</strong> in the omnibox (or click <strong>Install App</strong> below).</li>
                        <li>Right-click the Mute Jar icon on the ChromeOS Shelf to pin it or enable <strong>Open on startup</strong> in ChromeOS Settings.</li>
                      </ol>
                    </>
                  )}

                  {/* Direct Download Links served from /downloads (<project>/installers/<os>/) */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        Available Downloads (<code className="font-mono">installers/{activeOsFolder}/</code>)
                        {totalStagedDownloads > 0 && ` · ${totalStagedDownloads} total ready`}
                      </span>
                      <button
                        type="button"
                        onClick={loadInstallersCatalog}
                        disabled={isLoadingDownloads}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingDownloads ? 'animate-spin' : ''}`} />
                        <span>{isLoadingDownloads ? 'Checking...' : 'Refresh'}</span>
                      </button>
                    </div>

                    {activeOsDownloads.length > 0 ? (
                      <div className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
                        {activeOsDownloads.map((item) => (
                          <div
                            key={item.filename}
                            className="py-2 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                                {item.filename}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {formatInstallerSize(item.sizeBytes)} · /downloads/{activeOsFolder}/
                              </div>
                            </div>
                            <a
                              href={getLocalApiUrl(item.downloadUrl)}
                              download={item.filename}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors inline-flex items-center gap-1.5 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          No compiled binaries placed in <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">installers/{activeOsFolder}/</code> yet. Drop build artifacts there and click Refresh to serve them via <code className="font-mono">/downloads</code>.
                        </span>
                        {selectedOsTab === 'chromeos' && isInstallable && !isInstalled && (
                          <button
                            type="button"
                            onClick={install}
                            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>Install PWA</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Build from Source & Optional Local Sidecar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-sky-500" />
                    <span>Build Single-File Package Locally</span>
                  </h4>
                  <p className="text-[11px]">
                    Requires Rust + Tauri v2 CLI locally, or push any commit to trigger{' '}
                    <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">.github/workflows/release-desktop.yml</code>{' '}
                    and download all OS sub-folders from GitHub Actions artifacts.
                  </p>
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] overflow-x-auto">
{`npm run desktop:icons
npm run desktop:build
node scripts/stage-installers.mjs`}
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Optional Local MCP &amp; Webhook Sidecar</span>
                  </h4>
                  <p className="text-[11px]">
                    Core audio monitoring, pledges, and local storage work offline. Start the optional sidecar only if you use Local MCP (Claude Desktop) or chat webhooks:
                  </p>
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] overflow-x-auto">
{`npm run sidecar`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero server credentials. All settings stay in local storage.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
