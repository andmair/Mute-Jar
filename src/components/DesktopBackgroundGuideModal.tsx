import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import {
  Monitor,
  Apple,
  Chrome,
  X,
  CheckCircle2,
  ExternalLink,
  Power,
  Layers,
  ArrowRight,
  ShieldCheck,
  Minimize2,
} from 'lucide-react';

export const DesktopBackgroundGuideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, os, install } = usePWAInstall();
  const [selectedTab, setSelectedTab] = useState<'windows' | 'mac' | 'linux' | 'chromeos' | 'package'>(
    os === 'mac' ? 'mac' : os === 'linux' ? 'linux' : os === 'chromeos' ? 'chromeos' : 'windows'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Installation &amp; Desktop Packaging Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a desktop app, auto-start on boot, or package as a standalone executable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Direct Install CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-300 dark:border-amber-700/60 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {isInstalled ? 'App Installed on Desktop' : '1-Click Install Application'}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                {isInstalled
                  ? 'Mute Jar is running as a standalone desktop app with OS status bar & taskbar presence.'
                  : 'Install Mute Jar as an OS desktop app (works on Windows, macOS, Linux, and ChromeOS without admin rights).'}
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

          {/* OS & Packaging Tabs */}
          <div>
            <label className="font-bold text-slate-900 dark:text-white block mb-2">
              Select Operating System or Packaging Method
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setSelectedTab('windows')}
                className={`py-1.5 px-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  selectedTab === 'windows'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-sky-500" />
                <span>Windows</span>
              </button>

              <button
                onClick={() => setSelectedTab('mac')}
                className={`py-1.5 px-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  selectedTab === 'mac'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>macOS</span>
              </button>

              <button
                onClick={() => setSelectedTab('linux')}
                className={`py-1.5 px-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  selectedTab === 'linux'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Linux</span>
              </button>

              <button
                onClick={() => setSelectedTab('chromeos')}
                className={`py-1.5 px-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  selectedTab === 'chromeos'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Chrome className="w-3.5 h-3.5 text-amber-500" />
                <span>ChromeOS</span>
              </button>

              <button
                onClick={() => setSelectedTab('package')}
                className={`py-1.5 px-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-[11px] ${
                  selectedTab === 'package'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>Package EXE</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Windows Instructions */}
          {selectedTab === 'windows' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-500" />
                <span>Windows 10 / 11 Setup Guide</span>
              </div>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <strong>Install as Desktop App:</strong> In Chrome or Edge, click the <em>Install Mute Jar</em> icon in the URL bar (or click the button above).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <strong>Auto-Start on OS Boot:</strong> Open the installed app &gt; click the <strong>···</strong> menu &gt; <em>App settings</em> &gt; turn ON <strong>"Start app when you sign in"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <strong>Taskbar / Status Bar Pin:</strong> Right-click the Mute Jar icon in your Windows Taskbar and select <strong>"Pin to taskbar"</strong>. When minimized, it continues monitoring audio in the background.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: macOS Instructions */}
          {selectedTab === 'mac' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Apple className="w-4 h-4" />
                <span>macOS Setup Guide</span>
              </div>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <strong>Install as macOS App:</strong> Click <em>Install App</em> (or Chrome Menu &gt; <em>Save and Share</em> &gt; <em>Install Mute Jar</em>).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <strong>Silent Autostart on Mac Login:</strong> Right-click the Mute Jar icon in the macOS Dock &gt; <strong>Options &gt; check "Open at Login"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <strong>Keep in Dock / Minimized:</strong> You can minimize or hide the app (⌘H). The Web Audio background listener remains active throughout all calls.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: ChromeOS Instructions */}
          {selectedTab === 'chromeos' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Chrome className="w-4 h-4 text-amber-500" />
                <span>ChromeOS Setup Guide</span>
              </div>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <strong>Install PWA:</strong> Tap the install icon in the Chrome omnibox.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <strong>Pin to Shelf Status Bar:</strong> Right-click or two-finger tap the app icon on the ChromeOS Shelf and select <strong>"Pin"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <strong>Autostart on Boot:</strong> In ChromeOS App Settings for Mute Jar, toggle <strong>"Open on startup"</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Linux Instructions */}
          {selectedTab === 'linux' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Linux (Ubuntu, Debian, Fedora, Arch) Setup</span>
              </div>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <strong>Desktop App Install:</strong> In Chrome, Brave, or Edge, click the <em>Install Mute Jar</em> icon in the URL bar (or click the button above). It creates a desktop <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">.desktop</code> launcher in your applications menu.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <strong>Auto-Start on Login:</strong> Open <em>Startup Applications</em> in GNOME / KDE, add Mute Jar, or copy the launcher into <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">~/.config/autostart/</code>.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <strong>Audio Server:</strong> Fully compatible with PipeWire, PulseAudio, and ALSA mic streams out of the box.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Packaging as Standalone Desktop Binary / Container */}
          {selectedTab === 'package' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Power className="w-4 h-4 text-amber-500" />
                <span>How to Package into a Standalone Desktop Executable</span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Choose the packaging method that best fits your deployment needs:
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Option 1: 1-Click PWA (Easiest &amp; Recommended)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">Zero Tools Needed</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click <strong>Install App</strong> in the header or URL bar. It gives you an isolated window, taskbar icon, autostart, and offline capability without building code.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Option 2: Standalone .EXE / .DMG via Nativefier / Tauri</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold">Native Binary</span>
                  </div>
                  <div className="bg-slate-950 text-amber-400 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                    npx nativefier --name &quot;MuteJar&quot; --icon public/icon.svg &quot;http://localhost:3000&quot;
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Creates a standalone <code className="font-mono">MuteJar.exe</code> (Windows) or <code className="font-mono">MuteJar.app</code> (macOS) in seconds.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Option 3: Containerized Docker Image</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">Self-Hosted</span>
                  </div>
                  <div className="bg-slate-950 text-amber-400 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                    docker build -t mutejar . &amp;&amp; docker run -p 3000:3000 mutejar
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & No-Admin Assurance */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Standard user permissions only · Zero admin access or kernel drivers required.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
