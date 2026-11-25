import { ArrowUpRight } from 'lucide-react';
import type { ActivityLog, CourseWithMetrics, StudentWithMetrics } from '../types';
import { Avatar } from './Avatar';
import { StatusIndicator } from './StatusIndicator';

interface OverviewViewProps {
  students: StudentWithMetrics[];
  courses: CourseWithMetrics[];
  activities: ActivityLog[];
  onSelectStudent: (student: StudentWithMetrics) => void;
  onNavigate: (tab: 'students' | 'courses' | 'gradebook' | 'attendance') => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OverviewView({
  students,
  courses,
  activities,
  onSelectStudent,
  onNavigate,
}: OverviewViewProps) {
  const activeStudents = students.filter((s) => s.status === 'Active' || s.status === 'Probation');
  const gradedStudents = students.filter((s) => s.gpa > 0);
  const meanGpa =
    gradedStudents.length > 0
      ? gradedStudents.reduce((sum, s) => sum + s.gpa, 0) / gradedStudents.length
      : 0;
  const meanAttendance =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length)
      : 100;

  // Group enrollment by program
  const programMap = new Map<string, { count: number; totalGpa: number; gradedCount: number }>();
  for (const s of students) {
    const entry = programMap.get(s.program) ?? { count: 0, totalGpa: 0, gradedCount: 0 };
    entry.count += 1;
    if (s.gpa > 0) {
      entry.totalGpa += s.gpa;
      entry.gradedCount += 1;
    }
    programMap.set(s.program, entry);
  }
  const programs = Array.from(programMap.entries())
    .map(([name, info]) => ({
      name,
      count: info.count,
      avgGpa: info.gradedCount > 0 ? info.totalGpa / info.gradedCount : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const maxProgramCount = Math.max(...programs.map((p) => p.count), 1);

  const watchlist = students.filter(
    (s) => s.status === 'Probation' || (s.gpa > 0 && s.gpa < 2.6) || s.attendanceRate < 80
  );

  return (
    <div className="space-y-6">
      {/* 4-column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Student Records</div>
          <div className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {students.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            {activeStudents.length} currently enrolled in Fall 2026
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Active Courses</div>
          <div className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {courses.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            {courses.reduce((sum, c) => sum + c.enrolledCount, 0)} total seat registrations
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Mean Cumulative GPA</div>
          <div className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {meanGpa.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-slate-500">4.00 institutional credit-weighted scale</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Mean Attendance Rate</div>
          <div className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {meanAttendance}%
          </div>
          <div className="mt-2 text-xs text-slate-500">Across all recorded Fall 2026 sessions</div>
        </div>
      </div>

      {/* Main 2-column Analytical Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Enrollment by Academic Program</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohort headcount and mean GPA across active departments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
            >
              <span>View directory</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4 flex-1">
            {programs.map((prog) => {
              const widthPct = Math.round((prog.count / maxProgramCount) * 100);
              return (
                <div key={prog.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{prog.name}</span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {prog.count} {prog.count === 1 ? 'student' : 'students'} ·{' '}
                      {prog.avgGpa > 0 ? `${prog.avgGpa.toFixed(2)} GPA` : 'No grades'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-900 transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Academic Advising Watchlist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students on probation, GPA below 2.60, or attendance under 80%.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-900 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Roll call</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 flex-1">
            {watchlist.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All enrolled students are currently in good academic standing.
              </div>
            ) : (
              watchlist.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student)}
                  className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{student.fullName}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {student.program} · Advisor: {student.advisor}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <StatusIndicator status={student.status} />
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {student.gpa.toFixed(2)} GPA · {student.attendanceRate}% Att
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recent Registry Activity */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Registry Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest updates across student records, course enrollments, grades, and attendance.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {activities.slice(0, 6).map((act) => (
            <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 text-sm">
              <span className="text-slate-800">{act.summary}</span>
              <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                {formatTimestamp(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
