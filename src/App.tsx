import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Plus,
  Users,
  X,
} from 'lucide-react';
import {
  createCourseApi,
  createStudentApi,
  deleteStudentApi,
  dropEnrollmentApi,
  enrollStudentApi,
  fetchRegistry,
  saveAttendanceBatchApi,
  updateGradesApi,
  updateStudentApi,
  type CoursePayload,
  type StudentPayload,
} from './api';
import { AttendanceView } from './components/AttendanceView';
import { Avatar } from './components/Avatar';
import { CourseModal } from './components/CourseModal';
import { CoursesView } from './components/CoursesView';
import { GradebookView } from './components/GradebookView';
import { OverviewView } from './components/OverviewView';
import { StudentDetailDrawer } from './components/StudentDetailDrawer';
import { StudentModal } from './components/StudentModal';
import { StudentsView } from './components/StudentsView';
import type { AttendanceStatus, RegistrySnapshot, StudentWithMetrics } from './types';

type NavTab = 'overview' | 'students' | 'courses' | 'gradebook' | 'attendance';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'gradebook', label: 'Gradebook', icon: ClipboardList },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
];

const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Overview',
  students: 'Student Directory',
  courses: 'Courses & Curriculum',
  gradebook: 'Gradebook Ledger',
  attendance: 'Daily Attendance',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registry, setRegistry] = useState<RegistrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('CRS-CS204');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithMetrics | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoadError('');
      const data = await fetchRegistry();
      setRegistry(data);
      if (data.courses.length > 0) {
        setSelectedCourseId((curr) =>
          data.courses.some((c) => c.id === curr) ? curr : data.courses[0].id
        );
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load registry data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedStudent =
    registry?.students.find((s) => s.id === selectedStudentId) ?? null;

  async function handleSaveStudent(payload: StudentPayload, existingId?: string) {
    if (existingId) {
      await updateStudentApi(existingId, payload);
    } else {
      const created = await createStudentApi(payload);
      setSelectedStudentId(created.id);
    }
    await loadData();
  }

  async function handleDeleteStudent(studentId: string) {
    await deleteStudentApi(studentId);
    setSelectedStudentId(null);
    await loadData();
  }

  async function handleCreateCourse(payload: CoursePayload) {
    const created = await createCourseApi(payload);
    setSelectedCourseId(created.id);
    await loadData();
  }

  async function handleEnroll(studentId: string, courseId: string) {
    await enrollStudentApi(studentId, courseId);
    await loadData();
  }

  async function handleDropEnrollment(enrollmentId: string) {
    await dropEnrollmentApi(enrollmentId);
    await loadData();
  }

  async function handleUpdateGrades(
    enrollmentId: string,
    scores: {
      assignmentsScore: number | null;
      midtermScore: number | null;
      finalScore: number | null;
    }
  ) {
    await updateGradesApi(enrollmentId, scores);
    await loadData();
  }

  async function handleSaveAttendance(
    courseId: string,
    date: string,
    items: Array<{ studentId: string; status: AttendanceStatus; note: string }>
  ) {
    await saveAttendanceBatchApi(courseId, date, items);
    await loadData();
  }

  function openNewStudentModal() {
    setEditingStudent(null);
    setStudentModalOpen(true);
  }

  function openEditStudentModal(student: StudentWithMetrics) {
    setEditingStudent(student);
    setStudentModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Alderwood
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-slate-100 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 flex items-center gap-3">
          <Avatar
            name="Sarah Jenkins"
            src="/src/assets/images/avatar_registrar_admin_1795598971805.jpg"
            size="md"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">Sarah Jenkins</div>
            <div className="text-xs text-slate-500 truncate">Academic Registrar</div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white border-r border-slate-200 flex flex-col z-10">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                Alderwood
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="p-2 text-slate-500 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-100 text-blue-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Contextual Top Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400">Registry</span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <h1 className="font-display text-base font-semibold text-slate-900 truncate">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'courses' ? (
              <button
                type="button"
                onClick={() => setCourseModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Course</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openNewStudentModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register Student</span>
              </button>
            )}
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Retry Connection
              </button>
            </div>
          ) : loading || !registry ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 rounded-xl border border-slate-200 bg-white animate-pulse" />
                ))}
              </div>
              <div className="h-72 rounded-xl border border-slate-200 bg-white animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  students={registry.students}
                  courses={registry.courses}
                  activities={registry.activities}
                  onSelectStudent={(s) => setSelectedStudentId(s.id)}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView
                  students={registry.students}
                  onSelectStudent={(s) => setSelectedStudentId(s.id)}
                  onAddStudent={openNewStudentModal}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesView
                  courses={registry.courses}
                  students={registry.students}
                  enrollments={registry.enrollments}
                  onAddCourse={() => setCourseModalOpen(true)}
                  onEnroll={handleEnroll}
                  onOpenGradebook={(courseId) => {
                    setSelectedCourseId(courseId);
                    setActiveTab('gradebook');
                  }}
                  onOpenAttendance={(courseId) => {
                    setSelectedCourseId(courseId);
                    setActiveTab('attendance');
                  }}
                />
              )}

              {activeTab === 'gradebook' && (
                <GradebookView
                  courses={registry.courses}
                  students={registry.students}
                  enrollments={registry.enrollments}
                  selectedCourseId={selectedCourseId}
                  onSelectCourse={setSelectedCourseId}
                  onUpdateGrades={handleUpdateGrades}
                  onEnroll={handleEnroll}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView
                  courses={registry.courses}
                  students={registry.students}
                  enrollments={registry.enrollments}
                  attendance={registry.attendance}
                  selectedCourseId={selectedCourseId}
                  onSelectCourse={setSelectedCourseId}
                  onSaveBatch={handleSaveAttendance}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <StudentDetailDrawer
        student={selectedStudent}
        courses={registry?.courses ?? []}
        enrollments={registry?.enrollments ?? []}
        attendance={registry?.attendance ?? []}
        onClose={() => setSelectedStudentId(null)}
        onEdit={openEditStudentModal}
        onDelete={handleDeleteStudent}
        onEnroll={handleEnroll}
        onDropEnrollment={handleDropEnrollment}
      />

      <StudentModal
        isOpen={studentModalOpen}
        initialStudent={editingStudent}
        onClose={() => setStudentModalOpen(false)}
        onSubmit={handleSaveStudent}
      />

      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSubmit={handleCreateCourse}
      />
    </div>
  );
}
