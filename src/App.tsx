/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MuteJarProvider, useMuteJar } from './context/MuteJarContext';
import { CartoonJar } from './components/CartoonJar';
import { AudioMonitor } from './components/AudioMonitor';
import { DashboardStats } from './components/DashboardStats';
import { ActionTracker } from './components/ActionTracker';
import { OnboardingModal } from './components/OnboardingModal';
import { MonthlyReviewModal } from './components/MonthlyReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TargetGoalModal } from './components/TargetGoalModal';
import { SetupModal } from './components/SetupModal';
import { UserProfileModal, UserAvatar } from './components/UserProfileModal';
import { PhilosophyTargetCard } from './components/PhilosophyTargetCard';
import { LiveActionGoalHub } from './components/LiveActionGoalHub';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MuteJarLogo } from './components/MuteJarLogo';
import { getPhilosophyCombinedLabel } from './utils/philosophyLabels';
import {
  Settings,
  Shield,
  ShieldCheck,
  Moon,
  Sun,
  Target,
  BarChart3,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    settings,
    updateSettings,
    cycleNoun,
    audioState,
    integrationsConfig,
    mutes,
    pledgeActions,
  } = useMuteJar();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrivacyPopoverOpen, setIsPrivacyPopoverOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupInitialTab, setSetupInitialTab] = useState<'desktop' | 'chat' | 'mcp' | 'packaging'>('desktop');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'ledger' | 'pledges'>('ledger');

  const philosophyInfo = getPhilosophyCombinedLabel(settings.persona, settings.philosophyLabelStyle);

  // Toggle dark/light theme
  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors ${settings.theme === 'dark' ? 'dark' : ''}`}>
      {/* Streamlined Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Brand Wordmark & Privacy Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a href="#jar-view" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <MuteJarLogo className="w-7 h-7 sm:w-8 sm:h-8" animated />
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Mute Jar
              </span>
            </a>

            {/* Discrete Privacy Shield Badge (shown on large screens without crowding) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPrivacyPopoverOpen((prev) => !prev)}
                className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-colors cursor-pointer select-none"
                title="Strict Local Audio Privacy Guarantee · Click to inspect"
                aria-expanded={isPrivacyPopoverOpen}
                aria-label="Privacy guarantee: local audio monitoring only"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>On-Device Only</span>
              </button>

              {isPrivacyPopoverOpen && (
                <div className="absolute left-0 mt-2 z-50 w-72 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Zero-Recording Privacy</span>
                    </span>
                    <button
                      onClick={() => setIsPrivacyPopoverOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                      aria-label="Close privacy details"
                    >
                      ✕
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>100% In-Memory:</strong> Voice activity is calculated strictly in temporary browser RAM.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Zero Audio Saved:</strong> No audio files, microphone recordings, or transcripts are created.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span><strong>Immediate Clearance:</strong> Audio waveforms are discarded every 50ms buffer cycle.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Streamlined 3 Core Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a
              href="#jar-view"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Mute Jar
            </a>
            <button
              onClick={() => {
                setActiveDashboardTab('ledger');
                document.getElementById('context-tabs')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                activeDashboardTab === 'ledger' ? 'text-slate-900 dark:text-white font-bold' : ''
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => {
                setActiveDashboardTab('pledges');
                document.getElementById('context-tabs')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
                activeDashboardTab === 'pledges' ? 'text-slate-900 dark:text-white font-bold' : ''
              }`}
            >
              Pledges &amp; Goals
            </button>
          </nav>

          {/* Zone 3: Compact Streamlined Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PWA Direct In-App Install Button */}
            <PWAInstallButton />

            {/* User Profile & Avatar Pill */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-100/80 dark:bg-slate-800/60 transition-all cursor-pointer group"
              title="Customize Name & Avatar"
              aria-label="Customize user profile name and avatar"
            >
              <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-xs border border-slate-200/80 dark:border-slate-600 overflow-hidden">
                <UserAvatar avatar={settings.userAvatar} alt={settings.userName || 'Profile'} />
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[85px] truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {settings.userName || 'Profile'}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Light and Dark Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Unified Settings & Setup button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
              title="Settings & Setup (Preferences, Autostart, Integrations, MCP)"
              aria-label="Open Settings and Setup"
            >
              <Settings className="w-4 h-4" />
              {integrationsConfig.channels.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* User Identity & Dashboard Greeting Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border-2 border-amber-400/80 shadow-xs flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-transform shrink-0 overflow-hidden"
              title="Customize Name & Avatar"
              aria-label="Customize profile name and avatar"
            >
              <UserAvatar avatar={settings.userAvatar} alt={settings.userName || 'Profile'} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {settings.userName ? `${settings.userName}’s Mute Jar` : 'My Mute Jar'}
                </h1>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                <span
                  className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                    audioState.isListening
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      audioState.isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {audioState.isListening
                      ? 'Monitor Live'
                      : audioState.isDoNotDisturbActive && settings.pauseOnDoNotDisturb !== false
                      ? 'Monitor Paused (OS Focus Mode)'
                      : 'Monitor Off (Paused)'}
                  </span>
                </span>
                <span>•</span>
                <span className="font-semibold text-amber-700 dark:text-amber-300 text-[11px]">
                  {philosophyInfo.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {settings.persona === 'saint' ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Exchange Rate:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  1 Coin = {settings.currency}{settings.perCoinValue.toFixed(2)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setIsTargetModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-semibold flex items-center gap-2 hover:border-amber-400 transition-colors cursor-pointer group"
                title="Click to view or edit target goal"
              >
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[170px] sm:max-w-[240px]">
                  Goal: {settings.persona === 'roastmaster' ? settings.roastActivityTitle : settings.pragmatistGoalTitle}
                </span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 shrink-0">
                  ({settings.persona === 'roastmaster' ? (settings.roastTargetCoins || 15) : (settings.pragmatistTargetCoins || 25)} coins)
                </span>
              </button>
            )}
          </div>
        </div>
        {/* Live Audio Monitor Box: Positioned above the Mute Jar & below the profile box */}
        <section id="monitor-view" aria-label="Audio Monitor Section">
          <AudioMonitor />
        </section>

        {/* Hero Section: The Mute Jar Box (Merged with Mute Check) */}
        <section id="jar-view" aria-label="Mute Jar and Mute Check Section" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden p-6 sm:p-8">
          {/* Playful ambient background glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Balanced Side-by-Side layout: Jar on Left (50%), Mute Check on Right (50%) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 lg:gap-8">
            {/* Left Side: 3D Mute Jar taking balanced 50% width on desktop */}
            <div className="w-full flex flex-col items-center justify-center px-2 sm:px-4 py-2">
              <CartoonJar />
            </div>

            {/* Right Side: Live Action & Goal Hub (Instant Coin Drop, 5s Undo & Goal Progress) */}
            <div className="w-full min-w-0 flex flex-col justify-between self-stretch py-2">
              <LiveActionGoalHub
                onOpenTargetModal={() => setIsTargetModalOpen(true)}
                onOpenReviewModal={() => setIsReviewOpen(true)}
                onOpenSettingsModal={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
        </section>

        {/* Segmented Context View Selector */}
        <section id="context-tabs" className="space-y-4 pt-2">
          {/* Segmented Tab Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveDashboardTab('ledger')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'ledger'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Meeting Ledger</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                  {mutes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDashboardTab('pledges')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'pledges'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-sky-500" />
                <span>Pledges &amp; Goals</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {pledgeActions.length}
                </span>
              </button>
            </div>

            {/* Quick Context Action */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {activeDashboardTab === 'ledger' && (
                <span>Showing {mutes.length} mute events recorded locally</span>
              )}
              {activeDashboardTab === 'pledges' && (
                <span>{pledgeActions.filter(p => p.status === 'completed').length} completed · {pledgeActions.filter(p => p.status === 'pending').length} active</span>
              )}
            </div>
          </div>

          {/* Active Tab View */}
          {activeDashboardTab === 'ledger' && (
            <div id="history-view" className="animate-fade-in">
              <DashboardStats onOpenReviewModal={() => setIsReviewOpen(true)} />
            </div>
          )}

          {activeDashboardTab === 'pledges' && (
            <div id="actions-view" className="space-y-6 animate-fade-in">
              <PhilosophyTargetCard
                onOpenEditModal={() => setIsTargetModalOpen(true)}
                onOpenReviewModal={() => setIsReviewOpen(true)}
              />
              <ActionTracker />
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mute Jar · Local Storage Privacy · Zero Cloud Audio · No Transcripts</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => {
                setSetupInitialTab('desktop');
                setIsSetupOpen(true);
              }}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              Setup &amp; MCP
            </button>
            <span>·</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Preferences
            </button>
            <span>·</span>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              {cycleNoun} Review
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <OnboardingModal />
      <MonthlyReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />
      <TargetGoalModal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenSetup={(tab) => {
          setSetupInitialTab(tab || 'desktop');
          setIsSetupOpen(true);
        }}
        onOpenBackgroundGuide={() => {
          setSetupInitialTab('desktop');
          setIsSetupOpen(true);
        }}
        onOpenIntegrations={() => {
          setSetupInitialTab('chat');
          setIsSetupOpen(true);
        }}
      />
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        initialTab={setupInitialTab}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <MuteJarProvider>
      <MainAppContent />
    </MuteJarProvider>
  );
}
