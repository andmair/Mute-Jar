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
import { PWAInstallButton } from './components/PWAInstallButton';
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
    formatCurrency,
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
            {/* PWA Direct In-App Install Button */}
            <PWAInstallButton />

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
        {/* Live Audio Monitor Box: Positioned above the Mute Jar & below the profile box */}
        <section id="monitor-view">
          <AudioMonitor onOpenCalendarModal={() => setIsCalendarOpen(true)} />
        </section>

        {/* Hero Section: The Mute Jar Box (Merged with Mute Check) */}
        <section id="jar-view" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden p-6 sm:p-8">
          {/* Playful ambient background glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Side by side layout: Jar on Left, Mute Check on Right */}
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 lg:gap-10">
            {/* Left Side: 3D Mute Jar shifted to the left with buffer on both sides */}
            <div className="w-full md:w-auto flex flex-col items-center justify-center px-4 sm:px-8 py-2 shrink-0">
              <CartoonJar />
            </div>

            {/* Right Side: Merged Mute Check Box (No 'Month' in title) */}
            <div className="flex-1 w-full min-w-0 flex flex-col justify-between self-stretch py-2">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-amber-500/5 dark:from-amber-950/40 dark:via-slate-800/80 dark:to-slate-900/60 border border-amber-300/80 dark:border-amber-500/30 shadow-xs flex flex-col justify-between gap-5 h-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      {/* Clean title without 'Month' - date wraps to next line if space is constrained */}
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-tight">
                        <span className="whitespace-nowrap">Mute Check</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 dark:text-slate-500 mr-1.5">·</span>
                          {currentCycle.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block mt-0.5">
                        Active cycle: {currentCycle.daysRemaining} days remaining
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 self-start sm:self-auto font-mono shrink-0">
                    {formatCurrency(settings.perCoinValue)} / coin
                  </span>
                </div>

                {/* Big Highlight Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-900/50 backdrop-blur-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Coins in Jar
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {currentMonthCoins}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Redemption Pool
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrency(currentMonthCoins * settings.perCoinValue)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Active Path
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {philosophyInfo.title}
                    </span>
                  </div>
                </div>

                {/* Narrative Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  You have deposited <strong className="font-mono text-amber-700 dark:text-amber-400 font-bold">{currentMonthCoins} MuteCoins</strong> this cycle (worth <strong className="font-mono text-amber-700 dark:text-amber-400">{formatCurrency(currentMonthCoins * settings.perCoinValue)}</strong>). Open the review to redeem your accumulated coins toward charities, team shouts, or habit milestone goals!
                </p>

                {/* CTA Actions Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-amber-200/70 dark:border-amber-900/40">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cycle resets automatically at end of cycle</span>
                  </div>

                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                    <span>Open Review ({currentMonthCoins})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy, Defined Goal, and Schedule Context Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
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
        </section>

        {/* Mini Tips Box */}
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white block mb-0.5">
            💡 How Mute Jar works seamlessly:
          </strong>
          Keep this tab or background window open during work calls. When speech is detected while on mute, a coin drops into the jar automatically. If you were actually unmuted, click <strong>"Undo"</strong> in the 5-second popup banner.
        </div>

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
