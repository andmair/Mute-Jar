import React, { useState, useRef } from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { PledgeActionRecord, PledgeStatus } from '../types';
import { sanitizeUrl, sanitizeText } from '../utils/security';
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

  // Lightbox preview for uploaded receipt
  const [viewingReceipt, setViewingReceipt] = useState<{
    title: string;
    dataUrl: string;
    fileName?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const saveActionDetails = () => {
    if (!editingPledge) return;

    const actionedTimestamp = new Date(actionDate).getTime();
    const safeEvidence = sanitizeUrl(evidenceUrl);
    updatePledgeAction(editingPledge.id, {
      status: actionStatus,
      actionedAt: actionedTimestamp,
      actionNotes: sanitizeText(actionNotes, 500),
      evidenceUrl: safeEvidence || undefined,
      receiptDataUrl: modalReceiptData || undefined,
      receiptFileName: modalReceiptFileName || undefined,
      receiptUploadedAt: modalReceiptData ? Date.now() : undefined,
    });

    if (actionStatus === 'completed' && editingPledge.status !== 'completed') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    setEditingPledge(null);
  };

  const getPledgeIcon = (type: string) => {
    switch (type) {
      case 'charity':
        return <Heart className="w-4 h-4 text-sky-500" />;
      case 'work':
        return <Crown className="w-4 h-4 text-rose-500" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: PledgeStatus, hasReceipt: boolean) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{hasReceipt ? 'Verified Donation' : 'Actioned / Completed'}</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Action</span>
      </span>
    );
  };

  const completedCount = pledgeActions.filter((p) => p.status === 'completed').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pledge & Goal Action Log</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
              {completedCount} / {pledgeActions.length} Actioned
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified follow-through log: charity donation receipts, completed fitness reps, and team shouts
          </p>
        </div>

        {completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Award className="w-4 h-4" />
            <span>Accountability Streak</span>
          </div>
        )}
      </div>

      {/* Pledges List */}
      {pledgeActions.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No pledges committed yet. Review your mute jar to convert coins into donations or habit goals!
        </div>
      ) : (
        <div className="space-y-3">
          {pledgeActions.map((pledge) => {
            const hasReceipt = !!pledge.receiptDataUrl;
            return (
              <div
                key={pledge.id}
                className={`p-4 rounded-xl border transition-all ${
                  hasReceipt
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/25'
                    : pledge.status === 'completed'
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 mt-0.5">
                      {getPledgeIcon(pledge.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {pledge.title}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                          ({pledge.coinsCommitted} coins · {pledge.estimatedValue})
                        </span>
                        {hasReceipt && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold shadow-2xs">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Receipt Uploaded</span>
                          </span>
                        )}
                        {pledge.cycleKey && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                            {pledge.cycleKey}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {pledge.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {getStatusBadge(pledge.status, hasReceipt)}

                    {/* View Receipt Button if uploaded */}
                    {hasReceipt && pledge.receiptDataUrl && (
                      <button
                        onClick={() =>
                          setViewingReceipt({
                            title: pledge.title,
                            dataUrl: pledge.receiptDataUrl!,
                            fileName: pledge.receiptFileName,
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="View uploaded donation receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    )}

                    <button
                      onClick={() => openActionEditor(pledge)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{hasReceipt ? 'Edit Log' : 'Log / Upload Proof'}</span>
                    </button>

                    {pledge.donationUrl && (
                      <a
                        href={pledge.donationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors"
                        title="Open Charity URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Receipt Preview Thumbnail Strip */}
                {hasReceipt && pledge.receiptDataUrl && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <div
                      onClick={() =>
                        setViewingReceipt({
                          title: pledge.title,
                          dataUrl: pledge.receiptDataUrl!,
                          fileName: pledge.receiptFileName,
                        })
                      }
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      {pledge.receiptDataUrl.startsWith('data:image/') ? (
                        <img
                          src={pledge.receiptDataUrl}
                          alt="Receipt thumbnail"
                          className="w-10 h-10 object-cover rounded-md border border-emerald-300 dark:border-emerald-700 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center border border-emerald-300">
                          <FileCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:underline">
                          {pledge.receiptFileName || 'Donation_Receipt.png'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Click to view full receipt document
                        </span>
                      </div>
                    </div>

                    {pledge.receiptUploadedAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Uploaded on {new Date(pledge.receiptUploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Notes (When & How) */}
                {pledge.actionNotes && (
                  <div className="mt-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-slate-700 dark:text-slate-200">Notes: </strong>
                        {pledge.actionNotes}
                      </span>
                    </div>

                    {pledge.actionedAt && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
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

      {/* Modal: Log When & How Actioned + Receipt Upload */}
      {editingPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Action / Upload Receipt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                  {editingPledge.title}
                </p>
              </div>
              <button
                onClick={() => setEditingPledge(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as PledgeStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="pending">Pending Action</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Actioned / Completed</option>
                </select>
              </div>

              {/* Upload Receipt / Document */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Upload Receipt / Proof Document
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUploadInEditor}
                  className="hidden"
                />

                {modalReceiptData ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
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
                      className="text-[11px] text-rose-500 hover:underline cursor-pointer font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40 text-center transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Upload Receipt Image or PDF
                    </span>
                  </button>
                )}
              </div>

              {/* When */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  When was it actioned?
                </label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* How */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Action Notes & Reflection
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed 45 pushups, or brought coffee & donuts for the team..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Evidence URL */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Optional External Web Link
                </label>
                <input
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
                onClick={() => setEditingPledge(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveActionDetails}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs cursor-pointer"
              >
                Save Action Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal: View Verified Receipt */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[320px]">
                  {viewingReceipt.title} · Receipt
                </h4>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[250px]">
              {viewingReceipt.dataUrl.startsWith('data:image/') ? (
                <img
                  src={viewingReceipt.dataUrl}
                  alt={viewingReceipt.fileName || 'Verified Receipt'}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {viewingReceipt.fileName || 'Donation_Receipt.pdf'}
                  </div>
                  <a
                    href={viewingReceipt.dataUrl}
                    download={viewingReceipt.fileName || 'Donation_Receipt.pdf'}
                    className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-amber-600 transition-colors"
                  >
                    Download PDF Receipt
                  </a>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                {viewingReceipt.fileName || 'Verified Receipt'}
              </span>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
