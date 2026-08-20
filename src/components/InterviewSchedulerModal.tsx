import React, { useState } from 'react';
import { X, Calendar, Clock, Video, User, FileText, CheckCircle2 } from 'lucide-react';
import { Candidate, InterviewSchedule } from '../types';

interface InterviewSchedulerModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedule: (candidateId: string, schedule: InterviewSchedule) => void;
}

export const InterviewSchedulerModal: React.FC<InterviewSchedulerModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSaveSchedule
}) => {
  if (!isOpen || !candidate) return null;

  const [date, setDate] = useState(
    candidate.interviewSchedule?.date || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [time, setTime] = useState(candidate.interviewSchedule?.time || '11:00 AM PST');
  const [type, setType] = useState<InterviewSchedule['type']>(
    candidate.interviewSchedule?.type || 'Technical Round'
  );
  const [interviewer, setInterviewer] = useState(
    candidate.interviewSchedule?.interviewer || 'Engineering Hiring Manager'
  );
  const [meetLink, setMeetLink] = useState(
    candidate.interviewSchedule?.meetLink || `https://meet.google.com/talent-${candidate.name.toLowerCase().replace(/\s+/g, '-')}`
  );
  const [notes, setNotes] = useState(candidate.interviewSchedule?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: InterviewSchedule = {
      date,
      time,
      type,
      interviewer,
      meetLink,
      notes
    };
    onSaveSchedule(candidate.id, schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule Interview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate: <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Round Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interview Round Type *
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="HR Screening">HR Screening (30 mins)</option>
              <option value="Technical Round">Technical Round - Live Coding / Arch (60 mins)</option>
              <option value="System Design">System Design & Cloud Architecture (60 mins)</option>
              <option value="Leadership Fit">Leadership & Cultural Fit (45 mins)</option>
              <option value="Final Round">Final Executive Round (45 mins)</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interview Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time & Timezone *
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="e.g. 02:30 PM EST"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Interviewer / Panel *
            </label>
            <input
              type="text"
              required
              value={interviewer}
              onChange={e => setInterviewer(e.target.value)}
              placeholder="e.g. Sarah Connor (Principal Architect)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Video Conference Link */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Video Link
            </label>
            <input
              type="text"
              value={meetLink}
              onChange={e => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agenda & Notes for Candidate
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. We will review Spring Boot concurrency, Java microservices architecture, and previous portfolio projects."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-olive-700 hover:bg-olive-800 text-white font-semibold shadow-xs cursor-pointer"
            >
              Confirm & Save Schedule
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
