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
  const [selectedTab, setSelectedTab] = useState<'windows' | 'mac' | 'chromeos'>(
    os === 'mac' ? 'mac' : os === 'chromeos' ? 'chromeos' : 'windows'
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
                Desktop OS Background & Autostart
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run Mute Jar without keeping a browser tab open & auto-start on OS reboot
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
                {isInstalled ? 'App Installed on Desktop' : 'Install Desktop Application'}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                {isInstalled
                  ? 'Mute Jar is running as a standalone desktop app with OS status bar & taskbar presence.'
                  : 'Install Mute Jar as an OS desktop app (works on Windows, macOS, and ChromeOS without admin rights).'}
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

          {/* OS Selector Tabs */}
          <div>
            <label className="font-bold text-slate-900 dark:text-white block mb-2">
              Select Your Operating System
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setSelectedTab('windows')}
                className={`py-2 px-3 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                className={`py-2 px-3 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTab === 'mac'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>macOS</span>
              </button>

              <button
                onClick={() => setSelectedTab('chromeos')}
                className={`py-2 px-3 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTab === 'chromeos'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Chrome className="w-3.5 h-3.5 text-amber-500" />
                <span>ChromeOS</span>
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
