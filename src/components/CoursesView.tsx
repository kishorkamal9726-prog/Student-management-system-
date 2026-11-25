import { useMemo, useState } from 'react';
import { BookOpen, Plus, Search, UserPlus } from 'lucide-react';
import type { CourseWithMetrics, EnrollmentRecord, StudentWithMetrics } from '../types';

interface CoursesViewProps {
  courses: CourseWithMetrics[];
  students: StudentWithMetrics[];
  enrollments: EnrollmentRecord[];
  onAddCourse: () => void;
  onEnroll: (studentId: string, courseId: string) => Promise<void>;
  onOpenGradebook: (courseId: string) => void;
  onOpenAttendance: (courseId: string) => void;
}

export function CoursesView({
  courses,
  students,
  enrollments,
  onAddCourse,
  onEnroll,
  onOpenGradebook,
  onOpenAttendance,
}: CoursesViewProps) {
  const [search, setSearch] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [courses, search]);

  function getEligibleStudents(courseId: string) {
    const enrolledIds = new Set(
      enrollments.filter((e) => e.courseId === courseId).map((e) => e.studentId)
    );
    return students.filter((s) => !enrolledIds.has(s.id) && s.status !== 'Graduated');
  }

  async function handleQuickEnroll(courseId: string) {
    if (!selectedStudentId) return;
    setBusy(true);
    setError('');
    try {
      await onEnroll(selectedStudentId, courseId);
      setEnrollingCourseId(null);
      setSelectedStudentId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enroll student.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course code, title, instructor..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
          />
        </div>

        <button
          type="button"
          onClick={onAddCourse}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Course</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No courses match your search</h3>
          <p className="mt-1 text-xs text-slate-500">
            Clear your search filter or create a new course offering for this term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const seatPct = Math.min(100, Math.round((course.enrolledCount / course.capacity) * 100));
            const eligible = getEligibleStudents(course.id);
            const isEnrollingThis = enrollingCourseId === course.id;

            return (
              <div
                key={course.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-semibold text-blue-900">{course.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{course.department}</span>
                        <span aria-hidden="true">·</span>
                        <span>{course.credits} Credits</span>
                        <span aria-hidden="true">·</span>
                        <span>{course.term}</span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{course.title}</h3>
                    </div>
                    {course.averageScore !== null && (
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-500">Class Avg</div>
                        <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {course.averageScore.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-600">
                    Instructor: <span className="font-medium text-slate-800">{course.instructor}</span>
                    <span className="mx-1.5 text-slate-400" aria-hidden="true">·</span>
                    <span>{course.schedule}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Seat Utilization</span>
                      <span className="font-mono text-slate-700 tabular-nums">
                        {course.enrolledCount} / {course.capacity} seats ({seatPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          seatPct >= 95 ? 'bg-amber-600' : 'bg-blue-900'
                        }`}
                        style={{ width: `${seatPct}%` }}
                      />
                    </div>
                  </div>

                  {isEnrollingThis ? (
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      >
                        <option value="">Choose student to enroll...</option>
                        {eligible.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.id})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedStudentId || busy}
                        onClick={() => handleQuickEnroll(course.id)}
                        className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollingCourseId(null);
                          setSelectedStudentId('');
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        disabled={eligible.length === 0 || course.enrolledCount >= course.capacity}
                        onClick={() => {
                          setEnrollingCourseId(course.id);
                          setSelectedStudentId('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-900 disabled:opacity-40 whitespace-nowrap"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Enroll Student</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenAttendance(course.id)}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
                        >
                          Roll Call
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenGradebook(course.id)}
                          className="text-xs font-medium text-blue-900 hover:underline whitespace-nowrap"
                        >
                          Open Gradebook
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
