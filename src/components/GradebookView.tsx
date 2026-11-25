import { useEffect, useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { CourseWithMetrics, EnrollmentRecord, StudentWithMetrics } from '../types';
import { Avatar } from './Avatar';

interface GradebookViewProps {
  courses: CourseWithMetrics[];
  students: StudentWithMetrics[];
  enrollments: EnrollmentRecord[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onUpdateGrades: (
    enrollmentId: string,
    scores: {
      assignmentsScore: number | null;
      midtermScore: number | null;
      finalScore: number | null;
    }
  ) => Promise<void>;
  onEnroll: (studentId: string, courseId: string) => Promise<void>;
}

interface DraftScores {
  assignments: string;
  midterm: string;
  final: string;
}

function previewLetter(assignments: string, midterm: string, final: string): { total: string; letter: string } {
  const parts: Array<{ val: number; w: number }> = [];
  const a = assignments.trim() === '' ? null : Number(assignments);
  const m = midterm.trim() === '' ? null : Number(midterm);
  const f = final.trim() === '' ? null : Number(final);

  if (a !== null && Number.isFinite(a)) parts.push({ val: a, w: 0.3 });
  if (m !== null && Number.isFinite(m)) parts.push({ val: m, w: 0.35 });
  if (f !== null && Number.isFinite(f)) parts.push({ val: f, w: 0.35 });

  if (parts.length === 0) return { total: '—', letter: 'IP' };
  const weightSum = parts.reduce((acc, p) => acc + p.w, 0);
  const score = parts.reduce((acc, p) => acc + p.val * p.w, 0) / weightSum;

  let letter = 'F';
  if (score >= 93) letter = 'A';
  else if (score >= 90) letter = 'A-';
  else if (score >= 87) letter = 'B+';
  else if (score >= 83) letter = 'B';
  else if (score >= 80) letter = 'B-';
  else if (score >= 77) letter = 'C+';
  else if (score >= 73) letter = 'C';
  else if (score >= 70) letter = 'C-';
  else if (score >= 65) letter = 'D';

  return { total: `${score.toFixed(1)}%`, letter };
}

export function GradebookView({
  courses,
  students,
  enrollments,
  selectedCourseId,
  onSelectCourse,
  onUpdateGrades,
  onEnroll,
}: GradebookViewProps) {
  const activeCourse = courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null;
  const [drafts, setDrafts] = useState<Record<string, DraftScores>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [error, setError] = useState('');

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const courseEnrollments = useMemo(() => {
    if (!activeCourse) return [];
    return enrollments
      .filter((e) => e.courseId === activeCourse.id)
      .sort((a, b) => {
        const sA = studentMap.get(a.studentId)?.fullName ?? '';
        const sB = studentMap.get(b.studentId)?.fullName ?? '';
        return sA.localeCompare(sB);
      });
  }, [activeCourse, enrollments, studentMap]);

  useEffect(() => {
    const nextDrafts: Record<string, DraftScores> = {};
    for (const enr of courseEnrollments) {
      nextDrafts[enr.id] = {
        assignments: enr.assignmentsScore !== null ? String(enr.assignmentsScore) : '',
        midterm: enr.midtermScore !== null ? String(enr.midtermScore) : '',
        final: enr.finalScore !== null ? String(enr.finalScore) : '',
      };
    }
    setDrafts(nextDrafts);
    setError('');
  }, [activeCourse?.id, courseEnrollments]);

  const eligibleStudents = useMemo(() => {
    if (!activeCourse) return [];
    const enrolledIds = new Set(courseEnrollments.map((e) => e.studentId));
    return students.filter((s) => !enrolledIds.has(s.id) && s.status !== 'Graduated');
  }, [activeCourse, courseEnrollments, students]);

  function updateField(enrollmentId: string, field: keyof DraftScores, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] ?? { assignments: '', midterm: '', final: '' }),
        [field]: value,
      },
    }));
  }

  async function handleSaveRow(enrollment: EnrollmentRecord) {
    const d = drafts[enrollment.id];
    if (!d) return;
    setError('');
    setSavingId(enrollment.id);
    try {
      const parseScore = (raw: string): number | null => {
        if (raw.trim() === '') return null;
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          throw new Error('Scores must be valid numbers between 0 and 100.');
        }
        return Math.round(num * 10) / 10;
      };

      await onUpdateGrades(enrollment.id, {
        assignmentsScore: parseScore(d.assignments),
        midtermScore: parseScore(d.midterm),
        finalScore: parseScore(d.final),
      });
      setSavedId(enrollment.id);
      setTimeout(() => setSavedId((curr) => (curr === enrollment.id ? null : curr)), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save grade.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCourse || !enrollStudentId) return;
    setError('');
    try {
      await onEnroll(enrollStudentId, activeCourse.id);
      setEnrollStudentId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enroll student.');
    }
  }

  if (!activeCourse) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Create a course before recording grades.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Course Selection & Enrollment Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="gradebook-course" className="text-xs font-medium text-slate-600">
            Course Ledger
          </label>
          <select
            id="gradebook-course"
            value={activeCourse.id}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title} ({c.enrolledCount} students)
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">
            Weights: Assignments 30% · Midterm 35% · Final 35%
          </span>
        </div>

        {eligibleStudents.length > 0 && (
          <form onSubmit={handleEnroll} className="flex items-center gap-2 shrink-0">
            <select
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="">Add student to roster...</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.id})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!enrollStudentId}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Enroll</span>
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Editable Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {courseEnrollments.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900">No students enrolled in {activeCourse.code}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Use the roster selector above to enroll students into this course.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-5 pr-3">Student</th>
                  <th className="py-3 px-3 text-right">Assignments (30%)</th>
                  <th className="py-3 px-3 text-right">Midterm (35%)</th>
                  <th className="py-3 px-3 text-right">Final Exam (35%)</th>
                  <th className="py-3 px-3 text-right">Weighted Total</th>
                  <th className="py-3 px-3 text-center">Letter</th>
                  <th className="py-3 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {courseEnrollments.map((enr) => {
                  const student = studentMap.get(enr.studentId);
                  if (!student) return null;
                  const draft = drafts[enr.id] ?? { assignments: '', midterm: '', final: '' };
                  const preview = previewLetter(draft.assignments, draft.midterm, draft.final);
                  const isDirty =
                    draft.assignments !== (enr.assignmentsScore !== null ? String(enr.assignmentsScore) : '') ||
                    draft.midterm !== (enr.midtermScore !== null ? String(enr.midtermScore) : '') ||
                    draft.final !== (enr.finalScore !== null ? String(enr.finalScore) : '');

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                          <div>
                            <div className="font-medium text-slate-900">{student.fullName}</div>
                            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {student.id} · GPA {student.gpa.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          aria-label={`Assignments score for ${student.fullName}`}
                          value={draft.assignments}
                          onChange={(e) => updateField(enr.id, 'assignments', e.target.value)}
                          placeholder="—"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          aria-label={`Midterm score for ${student.fullName}`}
                          value={draft.midterm}
                          onChange={(e) => updateField(enr.id, 'midterm', e.target.value)}
                          placeholder="—"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          aria-label={`Final score for ${student.fullName}`}
                          value={draft.final}
                          onChange={(e) => updateField(enr.id, 'final', e.target.value)}
                          placeholder="—"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-medium text-slate-900 tabular-nums">
                        {preview.total}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-xs font-semibold text-blue-900">
                        {preview.letter}
                      </td>
                      <td className="py-2.5 pl-3 pr-5 text-right">
                        <button
                          type="button"
                          disabled={!isDirty || savingId === enr.id}
                          onClick={() => handleSaveRow(enr)}
                          className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                            savedId === enr.id
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDirty
                                ? 'bg-blue-900 text-white hover:bg-blue-800'
                                : 'bg-slate-100 text-slate-400 cursor-default'
                          }`}
                        >
                          {savedId === enr.id ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Saved</span>
                            </>
                          ) : savingId === enr.id ? (
                            <span>Saving...</span>
                          ) : (
                            <span>Save</span>
                          )}
                        </button>
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
