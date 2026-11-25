import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import type {
  AttendanceRecord,
  AttendanceStatus,
  CourseWithMetrics,
  EnrollmentRecord,
  StudentWithMetrics,
} from '../types';
import { Avatar } from './Avatar';

interface AttendanceViewProps {
  courses: CourseWithMetrics[];
  students: StudentWithMetrics[];
  enrollments: EnrollmentRecord[];
  attendance: AttendanceRecord[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onSaveBatch: (
    courseId: string,
    date: string,
    items: Array<{ studentId: string; status: AttendanceStatus; note: string }>
  ) => Promise<void>;
}

const ATTENDANCE_OPTIONS: AttendanceStatus[] = ['Present', 'Late', 'Excused', 'Absent'];

export function AttendanceView({
  courses,
  students,
  enrollments,
  attendance,
  selectedCourseId,
  onSelectCourse,
  onSaveBatch,
}: AttendanceViewProps) {
  const activeCourse = courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null;
  const [date, setDate] = useState('2026-11-24');
  const [rows, setRows] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [error, setError] = useState('');

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const roster = useMemo(() => {
    if (!activeCourse) return [];
    return enrollments
      .filter((e) => e.courseId === activeCourse.id)
      .map((e) => studentMap.get(e.studentId))
      .filter((s): s is StudentWithMetrics => Boolean(s))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [activeCourse, enrollments, studentMap]);

  useEffect(() => {
    if (!activeCourse) return;
    const nextRows: Record<string, { status: AttendanceStatus; note: string }> = {};
    for (const student of roster) {
      const existing = attendance.find(
        (a) => a.courseId === activeCourse.id && a.date === date && a.studentId === student.id
      );
      nextRows[student.id] = {
        status: existing?.status ?? 'Present',
        note: existing?.note ?? '',
      };
    }
    setRows(nextRows);
    setSavedBanner(false);
    setError('');
  }, [activeCourse?.id, date, roster, attendance]);

  function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setSavedBanner(false);
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? { status: 'Present', note: '' }), status },
    }));
  }

  function setStudentNote(studentId: string, note: string) {
    setSavedBanner(false);
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? { status: 'Present', note: '' }), note },
    }));
  }

  function markAllPresent() {
    setSavedBanner(false);
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    for (const student of roster) {
      updated[student.id] = {
        status: 'Present',
        note: rows[student.id]?.note ?? '',
      };
    }
    setRows(updated);
  }

  async function handleSave() {
    if (!activeCourse || roster.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const items = roster.map((student) => ({
        studentId: student.id,
        status: rows[student.id]?.status ?? 'Present',
        note: rows[student.id]?.note ?? '',
      }));
      await onSaveBatch(activeCourse.id, date, items);
      setSavedBanner(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance roll call.');
    } finally {
      setSaving(false);
    }
  }

  if (!activeCourse) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Create a course before logging daily attendance.
      </div>
    );
  }

  const summaryCounts = roster.reduce(
    (acc, s) => {
      const st = rows[s.id]?.status ?? 'Present';
      acc[st] += 1;
      return acc;
    },
    { Present: 0, Late: 0, Excused: 0, Absent: 0 } as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select course for roll call"
            value={activeCourse.id}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Session date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Present: {summaryCounts.Present} · Late: {summaryCounts.Late} · Excused: {summaryCounts.Excused} · Absent:{' '}
            {summaryCounts.Absent}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={roster.length === 0}
            onClick={markAllPresent}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            disabled={roster.length === 0 || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
          >
            {savedBanner ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Roll Call Saved</span>
              </>
            ) : (
              <span>{saving ? 'Saving...' : 'Save Roll Call'}</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {roster.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900">No students enrolled in {activeCourse.code}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enroll students into this course to begin taking daily attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-5 pr-3">Student</th>
                  <th className="py-3 px-3">Overall Rate</th>
                  <th className="py-3 px-3">Session Status</th>
                  <th className="py-3 pl-3 pr-5">Session Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {roster.map((student) => {
                  const row = rows[student.id] ?? { status: 'Present', note: '' };
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                          <div>
                            <div className="font-medium text-slate-900">{student.fullName}</div>
                            <div className="font-mono text-[11px] text-slate-500 tabular-nums">{student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700 tabular-nums">
                        {student.attendanceRate}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                          {ATTENDANCE_OPTIONS.map((opt) => {
                            const active = row.status === opt;
                            let activeStyles = 'bg-white text-slate-900 shadow-xs';
                            if (active && opt === 'Present') activeStyles = 'bg-emerald-600 text-white shadow-xs';
                            if (active && opt === 'Late') activeStyles = 'bg-amber-600 text-white shadow-xs';
                            if (active && opt === 'Absent') activeStyles = 'bg-red-600 text-white shadow-xs';
                            if (active && opt === 'Excused') activeStyles = 'bg-slate-700 text-white shadow-xs';

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setStudentStatus(student.id, opt)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                  active ? activeStyles : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 pl-3 pr-5">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => setStudentNote(student.id, e.target.value)}
                          placeholder="Optional note..."
                          className="w-full min-w-[180px] rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                        />
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
}
