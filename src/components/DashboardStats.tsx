import React, { useState } from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Search,
  RotateCcw,
  Clock,
  Sparkles,
  BarChart3,
  CalendarCheck,
  Lock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export const DashboardStats: React.FC<{ onOpenReviewModal: () => void }> = ({
  onOpenReviewModal,
}) => {
  const {
    currentMonthCoins,
    currentMonthKey,
    lastMonthCoins,
    twelveMonthAverage,
    percentChange,
    mutes,
    settings,
    undoMuteCoin,
    formatCurrency,
    clearSampleMutes,
    finalizeSetup,
    activeGraceRecord,
  } = useMuteJar();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthKey);

  // Filter mutes for ledger
  const currentMonthMutes = mutes.filter((m) => {
    const matchesMonth = filterMonth ? m.monthKey === filterMonth : true;
    const matchesSearch =
      m.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(m.timestamp).toLocaleDateString().includes(searchTerm);
    return matchesMonth && matchesSearch;
  });

  // Unique months available in history
  const availableMonths = Array.from(new Set(mutes.map((m) => m.monthKey))).sort(
    (a, b) => b.localeCompare(a)
  );

  return (
    <div className="space-y-5">
      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Current Month */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>This Month ({currentMonthKey})</span>
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentMonthCoins}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              mutes deposited
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            ≈ {formatCurrency(currentMonthCoins * settings.perCoinValue)} in pledge value
          </div>
        </div>

        {/* Card 2: Last Month Comparison */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>vs. Last Month</span>
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {lastMonthCoins}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              last month mutes
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
            {percentChange !== null ? (
              percentChange <= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{Math.abs(percentChange)}% fewer mutes (Improving!)</span>
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{percentChange}% vs last month</span>
                </span>
              )
            ) : (
              <span className="text-slate-400">First month baseline</span>
            )}
          </div>
        </div>

        {/* Card 3: 12-Month Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>12-Month Rolling Trend</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              {twelveMonthAverage}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              avg mutes / mo
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Reminder: Day {settings.reminderDay}</span>
            <button
              onClick={onOpenReviewModal}
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Review Jar →
            </button>
          </div>
        </div>
      </div>

      {/* Meeting History Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {/* Setup Mode vs Locked Ledger Banner */}
        {settings.isSetupMode ? (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs text-amber-950 dark:text-amber-200">
                <strong>Setup Mode:</strong> Previewing sample mute history. You can clear this now to start completely empty, or keep it.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (confirm('Clear all sample events to start with 0 mutes?')) {
                    clearSampleMutes();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear Sample Events</span>
              </button>

              <button
                onClick={finalizeSetup}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock & Begin Tracking</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Immutable Ledger: Past mute events cannot be altered or cleared to maintain accountability.</span>
            </span>
            <span className="text-[10px] opacity-75">Only profile deletion resets history</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Mute Event History</span>
              <span className="text-[11px] font-mono text-slate-400">
                ({currentMonthMutes.length} events)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed log of every time speech was detected on mute
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Filter Selector */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meeting..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-40 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Ledger Rows */}
        {currentMonthMutes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No mute events found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Meeting Context</th>
                  <th className="py-2.5 px-3">Detection</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {currentMonthMutes.slice(0, 10).map((record) => {
                  const dateStr = new Date(record.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(record.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        record.undone ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateStr} · {timeStr}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {record.meetingTitle}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {record.detectedMethod === 'auto_audio' ? (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Auto Mic Audio
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            Manual Drop
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {record.undone ? (
                          <span className="text-[10px] font-bold text-rose-500">Undone</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Deposited
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {record.undone ? (
                          <span className="text-[10px] text-slate-400">Undone</span>
                        ) : activeGraceRecord?.id === record.id || settings.isSetupMode ? (
                          <button
                            onClick={() => undoMuteCoin(record.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md cursor-pointer"
                            title="Undo (Only allowed during grace period or setup)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            className="text-slate-300 dark:text-slate-700"
                            title="Locked: Historical mutes cannot be deleted to prevent tampering"
                          >
                            <Lock className="w-3 h-3 inline-block" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
