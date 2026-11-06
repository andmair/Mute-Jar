import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMuteJar } from '../context/MuteJarContext';
import { Sparkles, MicOff, Plus, Heart, Zap, Crown, Coins, Edit2, Check } from 'lucide-react';

export const CartoonJar: React.FC = () => {
  const { currentMonthCoins, settings, updateSettings, activeGraceRecord, testCoinDrop, formatCurrency } = useMuteJar();
  const [animatingCoins, setAnimatingCoins] = useState<number[]>([]);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(String(settings.perCoinValue));

  // Trigger drop animation on new mute events
  useEffect(() => {
    if (activeGraceRecord) {
      const newId = Date.now();
      setAnimatingCoins((prev) => [...prev, newId]);
      const timer = setTimeout(() => {
        setAnimatingCoins((prev) => prev.filter((id) => id !== newId));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeGraceRecord]);

  // Keep tempRate synced
  useEffect(() => {
    setTempRate(String(settings.perCoinValue));
  }, [settings.perCoinValue]);

  const handleSaveRate = () => {
    const parsed = parseFloat(tempRate);
    if (!isNaN(parsed) && parsed > 0) {
      updateSettings({ perCoinValue: parsed });
    }
    setIsEditingRate(false);
  };

  // Visual coin count inside jar (capped at 40 visible coins for organic physics stack)
  const visibleCoinCount = Math.min(40, currentMonthCoins);
  const fillPercentage = Math.min(94, Math.max(14, Math.round((currentMonthCoins / 30) * 100)));

  // Persona stickers on the jar
  const personaBadge = {
    saint: {
      title: 'THE SAINT',
      subtitle: 'Charity & Giving',
      icon: Heart,
      bg: 'bg-sky-500/20 border-sky-400/60 text-sky-900 dark:text-sky-100',
      tagColor: 'bg-sky-500 text-white shadow-sky-500/40',
    },
    pragmatist: {
      title: 'THE PRAGMATIST',
      subtitle: 'Productivity & Growth',
      icon: Zap,
      bg: 'bg-amber-500/20 border-amber-400/60 text-amber-900 dark:text-amber-100',
      tagColor: 'bg-amber-500 text-white shadow-amber-500/40',
    },
    roastmaster: {
      title: 'ROAST MASTER',
      subtitle: 'Humor & Team Fun',
      icon: Crown,
      bg: 'bg-rose-500/20 border-rose-400/60 text-rose-900 dark:text-rose-100',
      tagColor: 'bg-rose-500 text-white shadow-rose-500/40',
    },
  }[settings.persona] || {
    title: 'THE PRAGMATIST',
    subtitle: 'Productivity & Growth',
    icon: Zap,
    bg: 'bg-amber-500/20 border-amber-400/60 text-amber-900 dark:text-amber-100',
    tagColor: 'bg-amber-500 text-white shadow-amber-500/40',
  };

  const PersonaIcon = personaBadge.icon;
  const runningTotalFormatted = formatCurrency(currentMonthCoins * settings.perCoinValue);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-md">
      {/* Top Header Controls: Fill gauge & Test Coin */}
      <div className="flex items-center justify-between w-full mb-3 px-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Mute Jar</span>
        </div>
        <button
          onClick={testCoinDrop}
          aria-label="Click to drop a cartoon test coin"
          className="flex items-center gap-1 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-all font-semibold cursor-pointer active:scale-95 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300/80 dark:border-amber-700/80 focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Click to drop a cartoon test coin"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Test Drop</span>
        </button>
      </div>

      {/* 3D Glass Jar Sculpture Container */}
      <div className="relative w-80 h-108 flex flex-col items-center justify-end">
        {/* 3D Cork Stopper Lid */}
        <div className="relative z-30 flex flex-col items-center">
          {/* Top Wooden Knob / Handle with 3D spherical bevel */}
          <div className="w-20 h-6 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-t-xl border-t-2 border-x-2 border-amber-500/80 shadow-md flex items-center justify-center relative">
            <div className="w-12 h-1 bg-amber-400/40 rounded-full" />
            <div className="w-3 h-3 rounded-full bg-amber-500/30 blur-[1px] absolute top-1 left-3" />
          </div>

          {/* Main 3D Cork Plug with cylindrical depth & grain */}
          <div className="w-36 h-9 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-t-2xl border-x-3 border-t border-amber-950 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Realistic wood / cork grain texture lines */}
            <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_5px,#3e1d06_5px,#3e1d06_8px)]" />
            <div className="w-28 h-1 bg-amber-400/30 rounded-full" />
            <div className="w-24 h-1 bg-amber-950/50 rounded-full mt-1.5" />
            <div className="absolute -bottom-1 inset-x-0 h-2 bg-black/40 blur-[1px]" />
          </div>
        </div>

        {/* 3D Flared Glass Rim & Collar Ring */}
        <div className="relative z-20 w-48 h-6 bg-gradient-to-b from-sky-200/90 via-sky-100/70 to-sky-300/90 dark:from-sky-700/90 dark:via-sky-900/70 dark:to-sky-800/90 border-3 border-sky-300 dark:border-sky-400 rounded-full shadow-lg -mt-1.5 flex items-center justify-center">
          <div className="w-40 h-2 bg-white/70 dark:bg-white/20 rounded-full blur-[0.5px]" />
        </div>

        {/* 3D Bulbous Curvy Glass Jar Body */}
        <div className="relative z-10 w-76 h-92 bg-gradient-to-br from-sky-100/50 via-sky-50/25 to-sky-200/40 dark:from-sky-950/60 dark:via-slate-900/75 dark:to-sky-900/50 rounded-t-[54px] rounded-b-[64px] border-4 border-sky-300/80 dark:border-sky-400/70 shadow-[0_25px_60px_-10px_rgba(2,132,199,0.3),inset_0_0_40px_rgba(56,189,248,0.25)] overflow-hidden backdrop-blur-xs flex flex-col justify-end">
          
          {/* Inner 3D Glass Ambient Cylindrical Shadowing (Darker side rims) */}
          <div className="absolute inset-0 rounded-t-[50px] rounded-b-[60px] shadow-[inset_0_0_35px_rgba(14,165,233,0.35)] pointer-events-none" />

          {/* 3D Specular Highlight Curved Bars (Glossy cartoon glass reflections) */}
          <div className="absolute top-4 left-5 w-4 h-76 bg-gradient-to-b from-white/90 via-white/45 to-transparent rounded-full blur-[1px] pointer-events-none" />
          <div className="absolute top-14 left-11 w-1.5 h-48 bg-white/50 dark:bg-white/25 rounded-full blur-[0.5px] pointer-events-none" />
          <div className="absolute top-5 right-5 w-3 h-70 bg-gradient-to-b from-white/60 via-white/25 to-transparent rounded-full blur-[1px] pointer-events-none" />

          {/* Playful Cartoon Sparkles on Glass */}
          <div className="absolute top-7 left-8 text-white text-sm font-extrabold pointer-events-none drop-shadow-md animate-pulse">
            ✦
          </div>
          <div className="absolute top-18 right-10 text-white/80 text-xs font-bold pointer-events-none drop-shadow-sm">
            ✧
          </div>

          {/* 3D Embossed Measurement Volume Lines */}
          <div className="absolute left-5 top-16 flex flex-col gap-9 text-[10px] font-mono font-extrabold text-sky-800/40 dark:text-sky-300/35 pointer-events-none">
            <span className="flex items-center gap-1.5 drop-shadow-xs">
              <span className="w-3.5 h-0.5 bg-sky-600/40 dark:bg-sky-300/40 rounded-full inline-block" />
              <span>30 FULL</span>
            </span>
            <span className="flex items-center gap-1.5 drop-shadow-xs">
              <span className="w-3 h-0.5 bg-sky-600/40 dark:bg-sky-300/40 rounded-full inline-block" />
              <span>20 MUTES</span>
            </span>
            <span className="flex items-center gap-1.5 drop-shadow-xs">
              <span className="w-2.5 h-0.5 bg-sky-600/40 dark:bg-sky-300/40 rounded-full inline-block" />
              <span>10 MUTES</span>
            </span>
          </div>

          {/* Persona 3D Sticker Emblem on Front of Jar */}
          <div className="absolute top-22 inset-x-8 z-20 flex flex-col items-center pointer-events-none">
            <div
              className={`px-4 py-2 rounded-2xl border-2 shadow-lg flex items-center gap-2.5 backdrop-blur-md transform -rotate-1 ${personaBadge.bg}`}
            >
              <div className={`p-1.5 rounded-xl ${personaBadge.tagColor} shadow-md`}>
                <PersonaIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-black tracking-wider leading-none">
                  {personaBadge.title}
                </div>
                <div className="text-[9px] opacity-90 font-semibold leading-none mt-1">
                  {personaBadge.subtitle}
                </div>
              </div>
            </div>
          </div>

          {/* Falling 3D Coin Drop Animation */}
          <AnimatePresence>
            {animatingCoins.map((id) => (
              <motion.div
                key={id}
                initial={{ y: -200, rotate: -60, scale: 0.7, opacity: 0.95 }}
                animate={{
                  y: [ -160, 60, 10, 120 ],
                  rotate: [ -30, 120, 240, 360 ],
                  scale: [ 1, 1.25, 0.95, 1 ],
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.85,
                  times: [0, 0.45, 0.7, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-30 left-1/2 -ml-7 top-10 w-14 h-14 rounded-full coin-shimmer border-3 border-amber-200 flex items-center justify-center shadow-2xl"
              >
                <div className="w-11 h-11 rounded-full border-2 border-amber-700/40 flex items-center justify-center shadow-inner">
                  <MicOff className="w-6 h-6 text-amber-950 drop-shadow-md" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Dynamic 3D Coin Stack inside Glass Base */}
          <div
            className="relative z-10 w-full px-6 pb-6 pt-2 flex flex-wrap-reverse justify-center items-end gap-1.5 transition-all duration-700 ease-out"
            style={{ minHeight: `${fillPercentage}%` }}
          >
            {/* 3D ambient gold radiant fluid glow */}
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber-400/40 via-amber-300/20 to-transparent pointer-events-none rounded-b-[60px]"
              style={{ height: `${fillPercentage}%` }}
            />

            {Array.from({ length: visibleCoinCount }).map((_, idx) => {
              const rotation = ((idx * 37) % 36) - 18;
              const isRecent = idx === visibleCoinCount - 1;

              return (
                <motion.div
                  key={idx}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: rotation }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                  className={`relative w-8 h-8 rounded-full coin-shimmer border-2 border-amber-200 flex items-center justify-center shadow-md ${
                    isRecent ? 'ring-2 ring-amber-300 ring-offset-1 animate-bounce' : ''
                  }`}
                  title={`MuteCoin #${idx + 1}`}
                >
                  <div className="w-6 h-6 rounded-full border border-amber-700/40 flex items-center justify-center">
                    <MicOff className="w-3.5 h-3.5 text-amber-950" />
                  </div>
                </motion.div>
              );
            })}

            {visibleCoinCount === 0 && (
              <div className="w-full text-center py-8 text-xs text-sky-800/70 dark:text-sky-300/60 font-semibold">
                Jar is ready! Speak on mute during calls to collect coins.
              </div>
            )}
          </div>

          {/* 3D Glass Bottom Floor & Curving Rim Reflection */}
          <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-sky-400/50 via-sky-300/25 to-transparent border-t border-sky-300/50 rounded-b-[60px] pointer-events-none flex items-center justify-center">
            <div className="w-48 h-1.5 bg-white/40 rounded-full blur-[0.5px]" />
          </div>
        </div>

        {/* 3D Table Shadow underneath Jar with ambient occlusion */}
        <div className="w-70 h-6 bg-slate-900/25 dark:bg-black/70 rounded-full blur-md mt-1.5" />
      </div>

      {/* Prominent Running Total Badge: "X MuteCoins worth Y Currency" */}
      <div className="mt-5 w-full bg-white dark:bg-slate-900 border-2 border-amber-400/70 dark:border-amber-500/50 rounded-2xl p-4 shadow-md text-center space-y-2.5">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full coin-shimmer flex items-center justify-center border border-amber-200 shadow-xs">
            <Coins className="w-4.5 h-4.5 text-amber-950" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            <span className="font-mono text-base text-amber-600 dark:text-amber-400 font-black">{currentMonthCoins} MuteCoins</span>
            <span className="text-slate-400 mx-2 font-medium">worth</span>
            <span className="font-mono text-base text-emerald-600 dark:text-emerald-400 font-black">{runningTotalFormatted}</span>
          </div>
        </div>

        {/* Editable MuteCoin Exchange Rate Pill */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span className="font-medium">Exchange Rate:</span>

          {!isEditingRate ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                1 Coin = {formatCurrency(settings.perCoinValue)}
              </span>
              <button
                onClick={() => setIsEditingRate(true)}
                className="p-1 text-amber-700 hover:text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Edit coin exchange rate"
                aria-label="Edit coin exchange rate"
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <label htmlFor="temp-coin-rate-input" className="sr-only">
                Coin exchange rate in {settings.currency}
              </label>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {settings.currency}
              </span>
              <input
                id="temp-coin-rate-input"
                type="number"
                min="0.1"
                step="0.5"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-16 p-1 text-xs rounded border border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <button
                onClick={handleSaveRate}
                className="p-1.5 bg-amber-500 text-slate-950 rounded-md hover:bg-amber-600 font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Save Rate"
                aria-label="Save coin exchange rate"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
