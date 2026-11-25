import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import type {
  AttendanceRecord,
  CourseWithMetrics,
  EnrollmentRecord,
  StudentWithMetrics,
} from '../types';
import { Avatar } from './Avatar';
import { StatusIndicator } from './StatusIndicator';

interface StudentDetailDrawerProps {
  student: StudentWithMetrics | null;
  courses: CourseWithMetrics[];
  enrollments: EnrollmentRecord[];
  attendance: AttendanceRecord[];
  onClose: () => void;
  onEdit: (student: StudentWithMetrics) => void;
  onDelete: (studentId: string) => Promise<void>;
  onEnroll: (studentId: string, courseId: string) => Promise<void>;
  onDropEnrollment: (enrollmentId: string) => Promise<void>;
}

export function StudentDetailDrawer({
  student,
  courses,
  enrollments,
  attendance,
  onClose,
  onEdit,
  onDelete,
  onEnroll,
  onDropEnrollment,
}: StudentDetailDrawerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setConfirmDelete(false);
    setActionError('');
    setSelectedCourseId('');
  }, [student?.id]);

  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [student, onClose]);

  if (!student) return null;

  const studentEnrollments = enrollments.filter((e) => e.studentId === student.id);
  const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.courseId));
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const recentAttendance = attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !selectedCourseId) return;
    setBusy(true);
    setActionError('');
    try {
      await onEnroll(student.id, selectedCourseId);
      setSelectedCourseId('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to enroll student.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!student) return;
    setBusy(true);
    setActionError('');
    try {
      await onDelete(student.id);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to remove student.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/35" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={student.fullName} src={student.avatarUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 truncate">{student.fullName}</h2>
                <StatusIndicator status={student.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-slate-700">{student.id}</span>
                <span aria-hidden="true">·</span>
                <span>{student.program}</span>
                <span aria-hidden="true">·</span>
                <span>{student.year}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close student profile"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {/* Academic Summary Strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 rounded-lg bg-slate-50/60">
            <div className="px-4 py-3">
              <div className="text-xs text-slate-500">Cumulative GPA</div>
              <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {student.gpa.toFixed(2)}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-xs text-slate-500">Attendance</div>
              <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {student.attendanceRate}%
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-xs text-slate-500">Credits Earned</div>
              <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {student.creditsCompleted}
              </div>
            </div>
          </div>

          {/* Contact & Advising Details */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Contact & Advising</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-slate-200 pt-3">
              <div>
                <dt className="text-xs text-slate-500">Institutional Email</dt>
                <dd className="text-slate-900 mt-0.5 truncate">{student.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="text-slate-900 mt-0.5 tabular-nums">{student.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Faculty Advisor</dt>
                <dd className="text-slate-900 mt-0.5">{student.advisor || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Date of Birth</dt>
                <dd className="font-mono text-xs text-slate-900 mt-1 tabular-nums">
                  {student.dateOfBirth || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Guardian Contact</dt>
                <dd className="text-slate-900 mt-0.5">
                  {student.guardianName ? `${student.guardianName} · ${student.guardianPhone}` : 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Enrolled Since</dt>
                <dd className="font-mono text-xs text-slate-900 mt-1 tabular-nums">{student.enrolledDate}</dd>
              </div>
            </dl>
            {student.notes && (
              <p className="text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                {student.notes}
              </p>
            )}
          </section>

          {/* Enrolled Courses */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Course Enrollments ({studentEnrollments.length})
              </h3>
            </div>

            {studentEnrollments.length === 0 ? (
              <p className="text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg p-4">
                No active course enrollments recorded for this term.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {studentEnrollments.map((enrollment) => {
                  const course = courseMap.get(enrollment.courseId);
                  if (!course) return null;
                  return (
                    <div key={enrollment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          <span className="font-mono text-xs text-slate-500 mr-2">{course.code}</span>
                          {course.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {course.credits} credits · {course.instructor}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                            {enrollment.letterGrade ?? 'IP'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {enrollment.totalScore !== null ? `${enrollment.totalScore.toFixed(1)}%` : 'In progress'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDropEnrollment(enrollment.id)}
                          className="text-xs text-slate-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {availableCourses.length > 0 && (
              <form onSubmit={handleEnrollSubmit} className="flex items-center gap-2 pt-1">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  <option value="">Select a course to enroll...</option>
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title} ({c.enrolledCount}/{c.capacity} seats)
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedCourseId || busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Enroll</span>
                </button>
              </form>
            )}
          </section>

          {/* Recent Attendance */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Recent Attendance Logs</h3>
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-slate-500">No attendance entries logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {recentAttendance.map((rec) => {
                  const course = courseMap.get(rec.courseId);
                  const statusTone =
                    rec.status === 'Present'
                      ? 'text-emerald-700'
                      : rec.status === 'Late'
                        ? 'text-amber-700'
                        : rec.status === 'Absent'
                          ? 'text-red-700'
                          : 'text-slate-600';
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-slate-500 tabular-nums shrink-0">{rec.date}</span>
                        <span className="text-slate-800 truncate">{course?.code ?? rec.courseId}</span>
                        {rec.note && <span className="text-slate-500 truncate">· {rec.note}</span>}
                      </div>
                      <span className={`font-medium shrink-0 ${statusTone}`}>{rec.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs font-medium text-red-700">
                Permanently remove this student record?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDeleteConfirm}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 whitespace-nowrap"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Student</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(student)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
