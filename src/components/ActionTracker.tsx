import React, { useState, useRef } from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { PledgeActionRecord, PledgeStatus } from '../types';
import { sanitizeUrl, sanitizeText } from '../utils/security';
import { GoalShareModal } from './GoalShareModal';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Heart,
  Zap,
  Crown,
  Edit3,
  Calendar,
  FileText,
  Award,
  UploadCloud,
  FileCheck,
  Eye,
  X,
  ShieldCheck,
  Image,
  Camera,
  Share2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ActionTracker: React.FC = () => {
  const { pledgeActions, updatePledgeAction } = useMuteJar();
  const [editingPledge, setEditingPledge] = useState<PledgeActionRecord | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [actionStatus, setActionStatus] = useState<PledgeStatus>('completed');
  const [modalReceiptData, setModalReceiptData] = useState<string | null>(null);
  const [modalReceiptFileName, setModalReceiptFileName] = useState<string | null>(null);
  const [modalPhotoData, setModalPhotoData] = useState<string | null>(null);

  // Sharing goal state
  const [sharingGoal, setSharingGoal] = useState<PledgeActionRecord | null>(null);

  // Lightbox preview for uploaded receipt or photo
  const [viewingMedia, setViewingMedia] = useState<{
    title: string;
    dataUrl: string;
    fileName?: string;
    type: 'receipt' | 'photo';
  } | null>(null);

  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null);

  const openActionEditor = (pledge: PledgeActionRecord) => {
    setEditingPledge(pledge);
    setActionNotes(pledge.actionNotes || '');
    setActionDate(
      pledge.actionedAt
        ? new Date(pledge.actionedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setEvidenceUrl(pledge.evidenceUrl || '');
    setActionStatus(pledge.status || 'in_progress');
    setModalReceiptData(pledge.receiptDataUrl || null);
    setModalReceiptFileName(pledge.receiptFileName || null);
    setModalPhotoData(pledge.photoDataUrl || null);
  };

  const handleReceiptUploadInEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModalReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setModalReceiptData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUploadInEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
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
          setModalPhotoData(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveActionDetails = () => {
    if (!editingPledge) return;

    const actionedTimestamp = new Date(actionDate).getTime();
    const safeEvidence = sanitizeUrl(evidenceUrl);
    const wasJustCompleted = actionStatus === 'completed' && editingPledge.status !== 'completed';

    const updatedRecord: PledgeActionRecord = {
      ...editingPledge,
      status: actionStatus,
      actionedAt: actionedTimestamp,
      actionNotes: sanitizeText(actionNotes, 500),
      evidenceUrl: safeEvidence || undefined,
      receiptDataUrl: modalReceiptData || undefined,
      receiptFileName: modalReceiptFileName || undefined,
      receiptUploadedAt: modalReceiptData ? Date.now() : undefined,
      photoDataUrl: modalPhotoData || undefined,
      photoCapturedAt: modalPhotoData ? Date.now() : undefined,
    };

    updatePledgeAction(editingPledge.id, updatedRecord);

    if (wasJustCompleted) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      // Prompt user to share
      setSharingGoal(updatedRecord);
    }

    setEditingPledge(null);
  };

  const getPledgeIcon = (type: string) => {
    switch (type) {
      case 'charity':
        return <Heart className="w-4 h-4 text-sky-500" aria-hidden="true" />;
      case 'work':
      case 'pledge':
        return <Crown className="w-4 h-4 text-rose-500" aria-hidden="true" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />;
    }
  };

  const getStatusBadge = (status: PledgeStatus, hasReceipt: boolean, hasPhoto: boolean) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>{hasReceipt ? 'Verified Donation' : hasPhoto ? 'Goal Verified' : 'Actioned / Completed'}</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        <span>Pending Action</span>
      </span>
    );
  };

  const completedCount = pledgeActions.filter((p) => p.status === 'completed').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs" role="region" aria-label="Pledge and Goal Action Log">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pledge &amp; Goal Action Log</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
              {completedCount} / {pledgeActions.length} Actioned
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Verified follow-through log: charity donation receipts, completed fitness reps, photos, and team shouts
          </p>
        </div>

        {completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>Accountability Streak</span>
          </div>
        )}
      </div>

      {/* Pledges List */}
      {pledgeActions.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No pledges committed yet. Review your mute jar to convert coins into donations or habit goals!
        </div>
      ) : (
        <div className="space-y-3">
          {pledgeActions.map((pledge) => {
            const hasReceipt = !!pledge.receiptDataUrl;
            const hasPhoto = !!pledge.photoDataUrl;
            const isCompleted = pledge.status === 'completed';

            return (
              <div
                key={pledge.id}
                className={`p-4 rounded-xl border transition-all ${
                  hasReceipt || hasPhoto
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/25'
                    : isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 mt-0.5">
                      {getPledgeIcon(pledge.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {pledge.title}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                          ({pledge.coinsCommitted} coins · {pledge.estimatedValue})
                        </span>
                        {hasReceipt && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold shadow-2xs">
                            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                            <span>Receipt Uploaded</span>
                          </span>
                        )}
                        {hasPhoto && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-purple-600 text-white font-bold shadow-2xs">
                            <Camera className="w-3 h-3" aria-hidden="true" />
                            <span>Photo Attached</span>
                          </span>
                        )}
                        {pledge.cycleKey && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {pledge.cycleKey}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                        {pledge.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                    {getStatusBadge(pledge.status, hasReceipt, hasPhoto)}

                    {/* Social Share Button for Completed Goals */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setSharingGoal(pledge)}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Share goal on social media or device"
                        aria-label={`Share completed goal ${pledge.title}`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                        <span>Share</span>
                      </button>
                    )}

                    {/* View Receipt Button if uploaded */}
                    {hasReceipt && pledge.receiptDataUrl && (
                      <button
                        onClick={() =>
                          setViewingMedia({
                            title: pledge.title,
                            dataUrl: pledge.receiptDataUrl!,
                            fileName: pledge.receiptFileName,
                            type: 'receipt',
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title="View uploaded donation receipt"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* View Photo Button if uploaded */}
                    {hasPhoto && pledge.photoDataUrl && (
                      <button
                        onClick={() =>
                          setViewingMedia({
                            title: pledge.title,
                            dataUrl: pledge.photoDataUrl!,
                            fileName: 'Goal_Completion_Photo.jpg',
                            type: 'photo',
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-purple-400 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
                        title="View goal completion photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                        <span>Photo</span>
                      </button>
                    )}

                    <button
                      onClick={() => openActionEditor(pledge)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{hasReceipt || hasPhoto ? 'Edit Log' : 'Log / Upload Proof'}</span>
                    </button>

                    {pledge.donationUrl && (
                      <a
                        href={pledge.donationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Open Charity URL"
                        aria-label="Open donation URL in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Media Thumbnails Strip (Receipt and/or Photo) */}
                {(hasReceipt || hasPhoto) && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {hasReceipt && pledge.receiptDataUrl && (
                        <div
                          onClick={() =>
                            setViewingMedia({
                              title: pledge.title,
                              dataUrl: pledge.receiptDataUrl!,
                              fileName: pledge.receiptFileName,
                              type: 'receipt',
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          {pledge.receiptDataUrl.startsWith('data:image/') ? (
                            <img
                              src={pledge.receiptDataUrl}
                              alt="Receipt thumbnail"
                              className="w-10 h-10 object-cover rounded-md border border-emerald-400 dark:border-emerald-700 shadow-2xs group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-400">
                              <FileCheck className="w-5 h-5" aria-hidden="true" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:underline">
                              {pledge.receiptFileName || 'Donation_Receipt.png'}
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              Receipt Document
                            </span>
                          </div>
                        </div>
                      )}

                      {hasPhoto && pledge.photoDataUrl && (
                        <div
                          onClick={() =>
                            setViewingMedia({
                              title: pledge.title,
                              dataUrl: pledge.photoDataUrl!,
                              fileName: 'Goal_Completion_Photo.jpg',
                              type: 'photo',
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <img
                            src={pledge.photoDataUrl}
                            alt="Goal completion photo thumbnail"
                            className="w-10 h-10 object-cover rounded-md border border-purple-400 dark:border-purple-700 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:underline">
                              Completion Photo
                            </span>
                            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                              Click to view full photo
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {pledge.receiptUploadedAt
                        ? `Uploaded ${new Date(pledge.receiptUploadedAt).toLocaleDateString()}`
                        : pledge.photoCapturedAt
                        ? `Captured ${new Date(pledge.photoCapturedAt).toLocaleDateString()}`
                        : null}
                    </div>
                  </div>
                )}

                {/* Action Notes (When & How) */}
                {pledge.actionNotes && (
                  <div className="mt-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-slate-800 dark:text-slate-100">Notes: </strong>
                        {pledge.actionNotes}
                      </span>
                    </div>

                    {pledge.actionedAt && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Actioned on {new Date(pledge.actionedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Editing Modal */}
      {editingPledge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-pledge-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 id="edit-pledge-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Follow-Through &amp; Photo Proof
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[280px]">
                  {editingPledge.title}
                </p>
              </div>
              <button
                onClick={() => setEditingPledge(null)}
                aria-label="Close edit log modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Status */}
              <div>
                <label htmlFor="action-status-select" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Status
                </label>
                <select
                  id="action-status-select"
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as PledgeStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="pending">Pending Action</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Actioned / Completed</option>
                </select>
              </div>

              {/* Photo Proof Capture or Upload */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 block">
                  Goal Completion Photo (Take or Upload)
                </label>
                <input
                  ref={photoCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUploadInEditor}
                  className="hidden"
                />
                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadInEditor}
                  className="hidden"
                />

                {modalPhotoData ? (
                  <div className="relative rounded-xl overflow-hidden border border-purple-300 dark:border-purple-700 max-h-44 bg-slate-950 flex items-center justify-center">
                    <img
                      src={modalPhotoData}
                      alt="Goal completion preview"
                      className="w-full h-auto max-h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setModalPhotoData(null)}
                      aria-label="Remove completion photo"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white shadow-md hover:bg-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => photoCameraInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => photoFileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Receipt / Document */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Upload Donation Receipt / Document (PDF or Image)
                </label>
                <input
                  ref={receiptFileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUploadInEditor}
                  className="hidden"
                />

                {modalReceiptData ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {modalReceiptFileName || 'Receipt Attached'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalReceiptData(null);
                        setModalReceiptFileName(null);
                      }}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => receiptFileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40 text-center transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Upload Receipt Image or PDF
                    </span>
                  </button>
                )}
              </div>

              {/* When */}
              <div>
                <label htmlFor="action-date-input" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  When was it actioned?
                </label>
                <input
                  id="action-date-input"
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* How */}
              <div>
                <label htmlFor="action-notes-textarea" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Action Notes &amp; Reflection
                </label>
                <textarea
                  id="action-notes-textarea"
                  rows={2}
                  placeholder="e.g. Completed 50 pushups, or brought coffee & donuts for the team..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Evidence URL */}
              <div>
                <label htmlFor="evidence-url-input" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Optional External Web Link
                </label>
                <input
                  id="evidence-url-input"
                  type="url"
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPledge(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveActionDetails}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                Save Action Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal: View Verified Receipt or Photo */}
      {viewingMedia && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="viewing-media-title"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {viewingMedia.type === 'receipt' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Camera className="w-4 h-4 text-purple-600" aria-hidden="true" />
                )}
                <h4 id="viewing-media-title" className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[320px]">
                  {viewingMedia.title} · {viewingMedia.type === 'receipt' ? 'Receipt' : 'Photo Proof'}
                </h4>
              </div>
              <button
                onClick={() => setViewingMedia(null)}
                aria-label="Close media preview"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[250px]">
              {viewingMedia.dataUrl.startsWith('data:image/') ? (
                <img
                  src={viewingMedia.dataUrl}
                  alt={viewingMedia.fileName || 'Media Preview'}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" aria-hidden="true" />
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {viewingMedia.fileName || 'Document.pdf'}
                  </div>
                  <a
                    href={viewingMedia.dataUrl}
                    download={viewingMedia.fileName || 'Document.pdf'}
                    className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-amber-600 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    Download PDF Document
                  </a>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {viewingMedia.fileName || 'Proof Document'}
              </span>
              <button
                type="button"
                onClick={() => setViewingMedia(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Social Media Share Modal */}
      <GoalShareModal
        isOpen={!!sharingGoal}
        goal={sharingGoal}
        onClose={() => setSharingGoal(null)}
        onUpdateGoalPhoto={(photo) => {
          if (sharingGoal) {
            updatePledgeAction(sharingGoal.id, {
              photoDataUrl: photo,
              photoCapturedAt: photo ? Date.now() : undefined,
            });
            setSharingGoal((prev) => (prev ? { ...prev, photoDataUrl: photo } : null));
          }
        }}
      />
    </div>
  );
};
