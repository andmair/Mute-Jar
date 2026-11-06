import React, { useState } from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import {
  User,
  X,
  Check,
  Award,
  Zap,
  Heart,
  Crown,
} from 'lucide-react';

export const AVATAR_OPTIONS = [
  { id: 'astronaut', emoji: '🧑‍🚀', label: 'Space Voyager', bg: 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-400' },
  { id: 'pro', emoji: '💼', label: 'Executive', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-400' },
  { id: 'coffee', emoji: '☕', label: 'Caffeine Powered', bg: 'bg-amber-100 dark:bg-amber-950/70 border-amber-400' },
  { id: 'zen', emoji: '🧘', label: 'Zen Master', bg: 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400' },
  { id: 'detective', emoji: '🕵️', label: 'Mute Detective', bg: 'bg-yellow-100 dark:bg-yellow-950/70 border-yellow-400' },
  { id: 'robot', emoji: '🤖', label: 'Automaton', bg: 'bg-sky-100 dark:bg-sky-950/70 border-sky-400' },
  { id: 'superhero', emoji: '🦸', label: 'Heroic Speaker', bg: 'bg-rose-100 dark:bg-rose-950/70 border-rose-400' },
  { id: 'wizard', emoji: '🧙', label: 'Audio Mage', bg: 'bg-purple-100 dark:bg-purple-950/70 border-purple-400' },
  { id: 'fox', emoji: '🦊', label: 'Clever Fox', bg: 'bg-orange-100 dark:bg-orange-950/70 border-orange-400' },
  { id: 'bear', emoji: '🐻', label: 'Cozy Bear', bg: 'bg-amber-100 dark:bg-amber-900/60 border-amber-500' },
  { id: 'cat', emoji: '🐱', label: 'Curious Cat', bg: 'bg-teal-100 dark:bg-teal-950/70 border-teal-400' },
  { id: 'rocket', emoji: '🚀', label: 'Velocity', bg: 'bg-blue-100 dark:bg-blue-950/70 border-blue-400' },
];

export const getAvatarEmoji = (id?: string) => {
  const found = AVATAR_OPTIONS.find((a) => a.id === id);
  return found ? found.emoji : '🧑‍🚀';
};

export const UserProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, currentMonthCoins, mutes } = useMuteJar();

  const [nameInput, setNameInput] = useState(settings.userName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(settings.userAvatar || 'astronaut');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings({
      userName: nameInput.trim(),
      userAvatar: selectedAvatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const totalAllTimeMutes = mutes.filter((m) => !m.undone).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="user-profile-title" className="text-base font-bold text-slate-900 dark:text-white">
                User Profile
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Personalize your name and avatar displayed on the dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close user profile modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Active Avatar Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300 dark:border-amber-700/50 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-md border-2 border-amber-400 flex items-center justify-center text-3xl shrink-0">
              {getAvatarEmoji(selectedAvatar)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                {nameInput.trim() || 'Your Profile'}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                {nameInput.trim() ? 'Personalized Mute Jar Profile' : 'No display name set (using neutral profile)'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 capitalize flex items-center gap-1">
                  {settings.persona === 'saint' ? <Heart className="w-2.5 h-2.5" aria-hidden="true" /> : settings.persona === 'roastmaster' ? <Crown className="w-2.5 h-2.5" aria-hidden="true" /> : <Zap className="w-2.5 h-2.5" aria-hidden="true" />}
                  <span>{settings.persona}</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentMonthCoins} coins this cycle
                </span>
              </div>
            </div>
          </div>

          {/* Edit Name */}
          <div>
            <label htmlFor="user-display-name-input" className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
              Display Name (Optional)
            </label>
            <input
              id="user-display-name-input"
              type="text"
              value={nameInput}
              maxLength={40}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alex, Jordan, Sam (or leave blank)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Avatar Selector Grid */}
          <fieldset>
            <legend className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
              Select Avatar
            </legend>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    aria-pressed={isSelected}
                    aria-label={`Select avatar ${avatar.label}`}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isSelected
                        ? `${avatar.bg} ring-2 ring-amber-500 scale-105 shadow-md`
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl mb-1" aria-hidden="true">{avatar.emoji}</span>
                    <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200 truncate w-full text-center">
                      {avatar.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Quick Stats Pill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>Lifetime Mute Coins:</span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {totalAllTimeMutes} coins
            </span>
          </div>

          {/* Footer Save Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
