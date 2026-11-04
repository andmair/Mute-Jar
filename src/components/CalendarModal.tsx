import React, { useState } from 'react';
import { useMuteJar } from '../context/MuteJarContext';
import { ScheduledMeeting } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  CalendarCheck,
  Shield,
  Layers,
} from 'lucide-react';

export const CalendarModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, scheduledMeetings, setScheduledMeetings, clearSampleSchedule } = useMuteJar();

  const [activeTitle, setActiveTitle] = useState(settings.activeMeetingTitle || '');
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState<number>(1);
  const [newStart, setNewStart] = useState('09:30');
  const [newEnd, setNewEnd] = useState('10:00');

  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  if (!isOpen) return null;

  const handleSaveActiveTitle = () => {
    updateSettings({ activeMeetingTitle: activeTitle.trim() });
    onClose();
  };

  const handleAddMeeting = () => {
    if (!newTitle.trim()) return;

    const newM: ScheduledMeeting = {
      id: `sched-${Date.now()}`,
      title: newTitle.trim(),
      dayOfWeek: newDay,
      startTime: newStart,
      endTime: newEnd,
    };

    setScheduledMeetings((prev) => [...prev, newM]);
    setNewTitle('');
  };

  const handleDeleteMeeting = (id: string) => {
    setScheduledMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Meeting Context & Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your calendar or schedule to automatically tag mute events
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Quick Active Meeting Override */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <label className="font-bold text-amber-950 dark:text-amber-200 block">
              Current / Ongoing Meeting Override
            </label>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Tag all current mutes with this meeting name until you change or clear it:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Q4 Executive Review, Sprint Retro..."
                value={activeTitle}
                onChange={(e) => setActiveTitle(e.target.value)}
                className="flex-1 p-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
              <button
                onClick={handleSaveActiveTitle}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Set Context
              </button>
            </div>
          </div>

          {/* Google Calendar Sync Option */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-sky-500" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Google Calendar Sync
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                {googleCalendarConnected ? 'Connected' : 'Optional'}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Sync meeting event titles automatically based on your current time. Operates in read-only mode directly in your browser.
            </p>

            <button
              onClick={() => setGoogleCalendarConnected(!googleCalendarConnected)}
              className={`w-full py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                googleCalendarConnected
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {googleCalendarConnected
                  ? 'Google Calendar Synchronized'
                  : 'Connect Google Calendar'}
              </span>
            </button>
          </div>

          {/* Local Recurring Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Recurring Weekly Meeting Schedule</span>
              </span>
              {settings.isSetupMode ? (
                <button
                  onClick={() => {
                    if (confirm('Clear sample meetings to create your own schedule?')) {
                      clearSampleSchedule();
                    }
                  }}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear Sample Schedule
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Auto-tags when time matches
                </span>
              )}
            </div>

            {/* Existing Scheduled Meetings */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3 pr-1">
              {scheduledMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.title}
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {daysOfWeek[m.dayOfWeek]} · {m.startTime} – {m.endTime}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteMeeting(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Meeting Slot Form */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
                Add Regular Meeting Slot:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Meeting name..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="col-span-2 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />

                <select
                  value={newDay}
                  onChange={(e) => setNewDay(parseInt(e.target.value, 10))}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  {daysOfWeek.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-1/2 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-1/2 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px]"
                  />
                </div>
              </div>

              <button
                onClick={handleAddMeeting}
                disabled={!newTitle.trim()}
                className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Meeting to Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
