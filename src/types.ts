export type StudentStatus = 'Active' | 'Probation' | 'Leave' | 'Graduated';
export type AcademicYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
export type AttendanceStatus = 'Present' | 'Late' | 'Excused' | 'Absent';

export interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  program: string;
  year: AcademicYear;
  status: StudentStatus;
  advisor: string;
  guardianName: string;
  guardianPhone: string;
  enrolledDate: string;
  avatarUrl: string;
  notes: string;
}

export interface StudentWithMetrics extends StudentRecord {
  gpa: number;
  creditsCompleted: number;
  attendanceRate: number;
  enrolledCourseCount: number;
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  department: string;
  instructor: string;
  credits: number;
  schedule: string;
  capacity: number;
  term: string;
}

export interface CourseWithMetrics extends CourseRecord {
  enrolledCount: number;
  averageScore: number | null;
}

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  courseId: string;
  midtermScore: number | null;
  finalScore: number | null;
  assignmentsScore: number | null;
  totalScore: number | null;
  letterGrade: string | null;
  gradePoints: number | null;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  note: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'enrollment' | 'grade' | 'attendance' | 'student';
  summary: string;
}

export interface RegistrySnapshot {
  students: StudentWithMetrics[];
  courses: CourseWithMetrics[];
  enrollments: EnrollmentRecord[];
  attendance: AttendanceRecord[];
  activities: ActivityLog[];
}
