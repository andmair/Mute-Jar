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
import { CalendarModal } from './components/CalendarModal';
import { SettingsModal } from './components/SettingsModal';
import { TargetGoalModal } from './components/TargetGoalModal';
import { DesktopBackgroundGuideModal } from './components/DesktopBackgroundGuideModal';
import { UserProfileModal, getAvatarEmoji } from './components/UserProfileModal';
import { PhilosophyTargetCard } from './components/PhilosophyTargetCard';
import { getPhilosophyCombinedLabel } from './utils/philosophyLabels';
import { sanitizeUrl } from './utils/security';
import {
  MicOff,
  Sparkles,
  Settings,
  Calendar,
  Gift,
  Shield,
  Moon,
  Sun,
  Monitor,
  Heart,
  Zap,
  Crown,
  Target,
  ExternalLink,
  Globe,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    currentMonthCoins,
    currentMonthKey,
    currentCycle,
    cycleNoun,
    settings,
    updateSettings,
    scheduledMeetings,
  } = useMuteJar();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isBackgroundGuideOpen, setIsBackgroundGuideOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      {/* 3-Zone Top Navigation Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl coin-shimmer flex items-center justify-center border border-amber-300 shadow-xs">
              <MicOff className="w-4 h-4 text-amber-950" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Mute Jar
            </span>
          </div>

          {/* Zone 2: Single-Line Text Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#jar-view" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Mute Jar
            </a>
            <a href="#actions-view" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Pledges & Goals
            </a>
            <a href="#history-view" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Meeting Ledger
            </a>
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Context</span>
            </button>
            <button
              onClick={() => setIsBackgroundGuideOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-500" />
              <span>Desktop & Autostart</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* User Profile & Avatar Pill */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-100/80 dark:bg-slate-800/60 transition-all cursor-pointer group"
              title="Customize Name & Avatar"
            >
              <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-sm border border-slate-200/80 dark:border-slate-600">
                {getAvatarEmoji(settings.userAvatar)}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[110px] truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {settings.userName || 'Andrew Mair'}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settings & Persona"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Review Jar ({currentMonthCoins})</span>
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
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border-2 border-amber-400/80 shadow-xs flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="Customize Name & Avatar"
            >
              {getAvatarEmoji(settings.userAvatar)}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {settings.userName || 'Andrew Mair'}’s Mute Jar
                </h1>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono text-[11px]">{settings.userEmail || 'andmair@gmail.com'}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Auto-Start Active</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 text-[11px]">
                  {philosophyInfo.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Exchange Rate:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                1 Coin = {settings.currency}{settings.perCoinValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        {/* Hero Grid: Cartoon Glass Jar on Left, Live Audio Monitor & Controls on Right */}
        <section id="jar-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: The 3D Cartoon Glass Jar */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {/* Playful background glows */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

            <CartoonJar />
          </div>

          {/* Right Column: Monthly Check Banner at top, Audio Monitor, Context, and Goal/Philosophy */}
          <div className="lg:col-span-7 space-y-5">
            {/* Top Box: Cycle Mute Check Banner (Moved next to the mute jar image) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{cycleNoun} Mute Check · {currentCycle.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    You have deposited <strong className="font-mono text-amber-700 dark:text-amber-400 font-bold">{currentMonthCoins} MuteCoins</strong> this {cycleNoun.toLowerCase()}. Review your jar to redeem them toward charities, team pledges, or personal goals!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsReviewOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Open Review ({currentMonthCoins})
              </button>
            </div>

            {/* Live Audio Engine & Threshold Controller */}
            <AudioMonitor onOpenCalendarModal={() => setIsCalendarOpen(true)} />

            {/* Philosophy, Defined Goal, and Schedule Context Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              {/* Left Sub-column: Active Philosophy & Specific Charity/Goal Directly Below It */}
              <div className="space-y-4 flex flex-col justify-between">
                {/* Active Philosophy Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
                      Active Philosophy
                    </span>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                      {settings.persona === 'saint' ? (
                        <Heart className="w-4 h-4 text-sky-500" />
                      ) : settings.persona === 'roastmaster' ? (
                        <Crown className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold capitalize text-slate-900 dark:text-white block">
                        {philosophyInfo.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                        {philosophyInfo.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tied Target / Goal Box (Specific to Active Philosophy) */}
                <PhilosophyTargetCard
                  onOpenEditModal={() => setIsTargetModalOpen(true)}
                  onOpenReviewModal={() => setIsReviewOpen(true)}
                />
              </div>

              {/* Right Sub-column: Meeting Schedule & Context Card with Clear Explanation */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Meeting Schedule Context</span>
                    </span>
                    <button
                      onClick={() => setIsCalendarOpen(true)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {settings.activeMeetingTitle || 'Weekly Auto Schedule'}
                  </div>

                  {/* Clarifying Explanation Inside the Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">
                      What this does:
                    </strong>
                    Automatically detects and tags mute events with your scheduled calls based on current day and time of day.
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-Schedule Active ({scheduledMeetings.length} meetings)</span>
                  </span>
                  <button
                    onClick={() => setIsCalendarOpen(true)}
                    className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Times</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mini Tips Box */}
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white block mb-0.5">
                💡 How Mute Jar works seamlessly:
              </strong>
              Keep this tab or background window open during work calls. When speech is detected while on mute, a coin drops into the jar automatically. If you were actually unmuted, click <strong>"Undo"</strong> in the 5-second popup banner.
            </div>
          </div>
        </section>

        {/* Action Tracker Section: When/How actions are followed through */}
        <section id="actions-view">
          <ActionTracker />
        </section>

        {/* Analytics & Meeting History Ledger Section */}
        <section id="history-view">
          <DashboardStats onOpenReviewModal={() => setIsReviewOpen(true)} />
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
              onClick={() => setIsCalendarOpen(true)}
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Calendar Schedule
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
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <TargetGoalModal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBackgroundGuide={() => setIsBackgroundGuideOpen(true)}
      />
      <DesktopBackgroundGuideModal
        isOpen={isBackgroundGuideOpen}
        onClose={() => setIsBackgroundGuideOpen(false)}
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
