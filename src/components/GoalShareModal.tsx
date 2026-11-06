import React, { useState, useRef } from 'react';
import { PledgeActionRecord } from '../types';
import {
  X,
  Share2,
  Camera,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Award,
  Sparkles,
  Heart,
  Zap,
  Crown,
  Trash2,
} from 'lucide-react';

interface GoalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: PledgeActionRecord | null;
  onUpdateGoalPhoto?: (photoDataUrl?: string) => void;
}

export const GoalShareModal: React.FC<GoalShareModalProps> = ({
  isOpen,
  onClose,
  goal,
  onUpdateGoalPhoto,
}) => {
  const [copied, setCopied] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !goal) return null;

  const appUrl = window.location.origin || 'https://mutejar.app';
  const shareText = `🎙️ I just completed my goal "${goal.title}" by turning ${goal.coinsCommitted} MuteCoins (${goal.estimatedValue}) from on-mute meeting slip-ups into real-world follow-through on Mute Jar! ✨`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${appUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Goal Completed: ${goal.title}`,
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateGoalPhoto) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize image to max 900px wide for clean local storage
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateGoalPhoto(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getPersonaIcon = () => {
    switch (goal.type) {
      case 'charity':
        return <Heart className="w-4 h-4 text-sky-500" aria-hidden="true" />;
      case 'pledge':
        return <Crown className="w-4 h-4 text-rose-500" aria-hidden="true" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />;
    }
  };

  // Social share URLs
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(appUrl);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${appUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-goal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="share-goal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Share Goal Achievement
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Celebrate your completed goal with your team or social network
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close share goal modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Achievement Brag Card Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent border-2 border-amber-400/60 dark:border-amber-500/40 shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                  {getPersonaIcon()}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Mute Jar Achievement
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                Goal Completed
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {goal.title}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                {goal.description}
              </p>
            </div>

            {/* Photo preview if present */}
            {goal.photoDataUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-amber-300 dark:border-amber-600 shadow-sm max-h-56 bg-slate-950 flex items-center justify-center group">
                <img
                  src={goal.photoDataUrl}
                  alt={`Proof of completion for ${goal.title}`}
                  className="w-full h-auto max-h-56 object-cover"
                />
                {onUpdateGoalPhoto && (
                  <button
                    type="button"
                    onClick={() => onUpdateGoalPhoto(undefined)}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : null}

            {/* Metrics footer */}
            <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="font-mono text-amber-800 dark:text-amber-300 font-bold">
                {goal.coinsCommitted} MuteCoins Redeemed ({goal.estimatedValue})
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {goal.actionedAt
                  ? `Completed ${new Date(goal.actionedAt).toLocaleDateString()}`
                  : `Created ${new Date(goal.createdAt).toLocaleDateString()}`}
              </span>
            </div>
          </div>

          {/* Photo Capture & Upload Controls */}
          {onUpdateGoalPhoto && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  <span>Completion Photo Proof</span>
                </span>
                {goal.photoDataUrl && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" aria-hidden="true" />
                    <span>Photo Attached</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Capture with your camera or upload a picture from your device (e.g. fitness sweat selfie, donut receipt, or book read).
              </p>

              {/* Hidden file inputs for camera and gallery */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="camera-photo-input"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="upload-photo-input"
              />

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  <span>Take Photo with Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
                  <span>Upload from Device</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Media Sharing Buttons */}
          <div className="space-y-2.5">
            <label className="block font-bold text-slate-900 dark:text-white">
              Share to Social Media
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* X / Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold flex flex-col items-center justify-center gap-1 text-center transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span className="text-sm font-black">𝕏</span>
                <span className="text-[10px]">Post on 𝕏</span>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold flex flex-col items-center justify-center gap-1 text-center transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span className="text-sm font-black">in</span>
                <span className="text-[10px]">LinkedIn</span>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col items-center justify-center gap-1 text-center transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span className="text-sm font-black">💬</span>
                <span className="text-[10px]">WhatsApp</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col items-center justify-center gap-1 text-center transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span className="text-sm font-black">f</span>
                <span className="text-[10px]">Facebook</span>
              </a>
            </div>

            {/* Native Device Share & Copy Text Row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Share via Device</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
