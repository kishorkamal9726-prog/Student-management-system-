import fs from 'node:fs';
import path from 'node:path';
import type {
  AcademicYear,
  ActivityLog,
  AttendanceRecord,
  AttendanceStatus,
  CourseRecord,
  CourseWithMetrics,
  EnrollmentRecord,
  RegistrySnapshot,
  StudentRecord,
  StudentStatus,
  StudentWithMetrics,
} from '../src/types.ts';

interface DatabaseStore {
  students: StudentRecord[];
  courses: CourseRecord[];
  enrollments: EnrollmentRecord[];
  attendance: AttendanceRecord[];
  activities: ActivityLog[];
  nextStudentSeq: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'registry.json');

export function computeGradeMetrics(
  midtermScore: number | null,
  finalScore: number | null,
  assignmentsScore: number | null
): { totalScore: number | null; letterGrade: string | null; gradePoints: number | null } {
  const parts: Array<{ value: number; weight: number }> = [];
  if (assignmentsScore !== null) parts.push({ value: assignmentsScore, weight: 0.3 });
  if (midtermScore !== null) parts.push({ value: midtermScore, weight: 0.35 });
  if (finalScore !== null) parts.push({ value: finalScore, weight: 0.35 });

  if (parts.length === 0) {
    return { totalScore: null, letterGrade: null, gradePoints: null };
  }

  const totalWeight = parts.reduce((acc, item) => acc + item.weight, 0);
  const weightedSum = parts.reduce((acc, item) => acc + item.value * item.weight, 0);
  const totalScore = Math.round((weightedSum / totalWeight) * 10) / 10;

  let letterGrade = 'F';
  let gradePoints = 0.0;
  if (totalScore >= 93) {
    letterGrade = 'A';
    gradePoints = 4.0;
  } else if (totalScore >= 90) {
    letterGrade = 'A-';
    gradePoints = 3.7;
  } else if (totalScore >= 87) {
    letterGrade = 'B+';
    gradePoints = 3.3;
  } else if (totalScore >= 83) {
    letterGrade = 'B';
    gradePoints = 3.0;
  } else if (totalScore >= 80) {
    letterGrade = 'B-';
    gradePoints = 2.7;
  } else if (totalScore >= 77) {
    letterGrade = 'C+';
    gradePoints = 2.3;
  } else if (totalScore >= 73) {
    letterGrade = 'C';
    gradePoints = 2.0;
  } else if (totalScore >= 70) {
    letterGrade = 'C-';
    gradePoints = 1.7;
  } else if (totalScore >= 65) {
    letterGrade = 'D';
    gradePoints = 1.0;
  }

  return { totalScore, letterGrade, gradePoints };
}

function createEnrollment(
  id: string,
  studentId: string,
  courseId: string,
  assignmentsScore: number | null,
  midtermScore: number | null,
  finalScore: number | null,
  updatedAt: string
): EnrollmentRecord {
  const computed = computeGradeMetrics(midtermScore, finalScore, assignmentsScore);
  return {
    id,
    studentId,
    courseId,
    assignmentsScore,
    midtermScore,
    finalScore,
    totalScore: computed.totalScore,
    letterGrade: computed.letterGrade,
    gradePoints: computed.gradePoints,
    updatedAt,
  };
}

function buildInitialStore(): DatabaseStore {
  const students: StudentRecord[] = [
    {
      id: 'STU-2026-001',
      fullName: 'Maya Deshmukh',
      email: 'm.deshmukh@alderwood.edu',
      phone: '(415) 555-0142',
      dateOfBirth: '2005-04-18',
      program: 'Computer Science',
      year: 'Junior',
      status: 'Active',
      advisor: 'Dr. Alan Vance',
      guardianName: 'Priya Deshmukh',
      guardianPhone: '(415) 555-0199',
      enrolledDate: '2024-08-26',
      avatarUrl: '/src/assets/images/avatar_student_maya_1795598973473.jpg',
      notes: 'Dean’s Honors List for 3 consecutive terms. Undergraduate research fellow in distributed systems.',
    },
    {
      id: 'STU-2026-002',
      fullName: 'Liam Chen',
      email: 'l.chen@alderwood.edu',
      phone: '(415) 555-0184',
      dateOfBirth: '2006-09-02',
      program: 'Mechanical Engineering',
      year: 'Sophomore',
      status: 'Active',
      advisor: 'Prof. Marcus Holt',
      guardianName: 'David Chen',
      guardianPhone: '(415) 555-0171',
      enrolledDate: '2025-08-25',
      avatarUrl: '/src/assets/images/avatar_student_liam_1795598973012.jpg',
      notes: 'Robotics lab lead. Requires structural CAD workshop access.',
    },
    {
      id: 'STU-2026-003',
      fullName: 'Elena Vance-Okafor',
      email: 'e.okafor@alderwood.edu',
      phone: '(510) 555-0126',
      dateOfBirth: '2004-11-11',
      program: 'Architecture',
      year: 'Senior',
      status: 'Active',
      advisor: 'Prof. Clara Solis',
      guardianName: 'Samuel Okafor',
      guardianPhone: '(510) 555-0163',
      enrolledDate: '2023-08-28',
      avatarUrl: '/src/assets/images/avatar_student_elena_1795598973966.jpg',
      notes: 'Senior thesis studio in sustainable timber structures.',
    },
    {
      id: 'STU-2026-004',
      fullName: 'Noah Lindqvist',
      email: 'n.lindqvist@alderwood.edu',
      phone: '(650) 555-0118',
      dateOfBirth: '2006-02-23',
      program: 'Applied Mathematics',
      year: 'Sophomore',
      status: 'Probation',
      advisor: 'Dr. Hannah Cho',
      guardianName: 'Erik Lindqvist',
      guardianPhone: '(650) 555-0102',
      enrolledDate: '2025-08-25',
      avatarUrl: '',
      notes: 'Scheduled for bi-weekly academic coaching check-ins during Fall 2026.',
    },
    {
      id: 'STU-2026-005',
      fullName: 'Sofia Alvarez',
      email: 's.alvarez@alderwood.edu',
      phone: '(408) 555-0155',
      dateOfBirth: '2007-06-14',
      program: 'Economics',
      year: 'Freshman',
      status: 'Active',
      advisor: 'Dr. Gregory Patel',
      guardianName: 'Carmen Alvarez',
      guardianPhone: '(408) 555-0130',
      enrolledDate: '2026-08-24',
      avatarUrl: '',
      notes: 'First-year quantitative economics cohort.',
    },
    {
      id: 'STU-2026-006',
      fullName: 'Caleb Mercer',
      email: 'c.mercer@alderwood.edu',
      phone: '(415) 555-0169',
      dateOfBirth: '2005-01-29',
      program: 'Computer Science',
      year: 'Junior',
      status: 'Probation',
      advisor: 'Dr. Alan Vance',
      guardianName: 'Rebecca Mercer',
      guardianPhone: '(415) 555-0188',
      enrolledDate: '2024-08-26',
      avatarUrl: '',
      notes: 'Missed three morning lab sessions in October; advisor outreach completed.',
    },
    {
      id: 'STU-2026-007',
      fullName: 'Amara Nwosu',
      email: 'a.nwosu@alderwood.edu',
      phone: '(510) 555-0194',
      dateOfBirth: '2004-08-05',
      program: 'Molecular Biology',
      year: 'Senior',
      status: 'Active',
      advisor: 'Dr. Miriam Klein',
      guardianName: 'Chidi Nwosu',
      guardianPhone: '(510) 555-0115',
      enrolledDate: '2023-08-28',
      avatarUrl: '',
      notes: 'Completing honors wet-lab capstone in CRISPR delivery vectors.',
    },
    {
      id: 'STU-2026-008',
      fullName: 'Ethan Gallagher',
      email: 'e.gallagher@alderwood.edu',
      phone: '(415) 555-0137',
      dateOfBirth: '2005-12-03',
      program: 'Economics',
      year: 'Junior',
      status: 'Leave',
      advisor: 'Dr. Gregory Patel',
      guardianName: 'Thomas Gallagher',
      guardianPhone: '(415) 555-0176',
      enrolledDate: '2024-08-26',
      avatarUrl: '',
      notes: 'Approved fall semester internship leave of absence; returning Spring 2027.',
    },
    {
      id: 'STU-2026-009',
      fullName: 'Hana Takahashi',
      email: 'h.takahashi@alderwood.edu',
      phone: '(650) 555-0148',
      dateOfBirth: '2007-03-19',
      program: 'Computer Science',
      year: 'Freshman',
      status: 'Active',
      advisor: 'Dr. Alan Vance',
      guardianName: 'Kenji Takahashi',
      guardianPhone: '(650) 555-0191',
      enrolledDate: '2026-08-24',
      avatarUrl: '',
      notes: 'Placed out of introductory programming; enrolled in Data Structures.',
    },
    {
      id: 'STU-2026-010',
      fullName: 'Owen Kowalski',
      email: 'o.kowalski@alderwood.edu',
      phone: '(408) 555-0174',
      dateOfBirth: '2003-10-12',
      program: 'Mechanical Engineering',
      year: 'Senior',
      status: 'Graduated',
      advisor: 'Prof. Marcus Holt',
      guardianName: 'Anna Kowalski',
      guardianPhone: '(408) 555-0122',
      enrolledDate: '2022-08-29',
      avatarUrl: '',
      notes: 'Completed degree requirements with distinction.',
    },
  ];

  const courses: CourseRecord[] = [
    {
      id: 'CRS-CS204',
      code: 'CS-204',
      title: 'Data Structures & Algorithms',
      department: 'Computer Science',
      instructor: 'Dr. Alan Vance',
      credits: 4,
      schedule: 'Mon/Wed 10:00 AM · Turing Hall 210',
      capacity: 36,
      term: 'Fall 2026',
    },
    {
      id: 'CRS-MATH210',
      code: 'MATH-210',
      title: 'Linear Algebra & Differential Systems',
      department: 'Applied Mathematics',
      instructor: 'Dr. Hannah Cho',
      credits: 4,
      schedule: 'Tue/Thu 09:30 AM · Euler Annex 104',
      capacity: 30,
      term: 'Fall 2026',
    },
    {
      id: 'CRS-ME302',
      code: 'ME-302',
      title: 'Thermodynamics & Fluid Mechanics',
      department: 'Mechanical Engineering',
      instructor: 'Prof. Marcus Holt',
      credits: 4,
      schedule: 'Mon/Wed 01:30 PM · Foundry Lab 12',
      capacity: 28,
      term: 'Fall 2026',
    },
    {
      id: 'CRS-ARC401',
      code: 'ARC-401',
      title: 'Sustainable Timber Studio',
      department: 'Architecture',
      instructor: 'Prof. Clara Solis',
      credits: 5,
      schedule: 'Tue/Thu 01:00 PM · North Studio B',
      capacity: 20,
      term: 'Fall 2026',
    },
    {
      id: 'CRS-ECON115',
      code: 'ECON-115',
      title: 'Quantitative Macroeconomics',
      department: 'Economics',
      instructor: 'Dr. Gregory Patel',
      credits: 3,
      schedule: 'Fri 10:00 AM · Keynes Forum 302',
      capacity: 42,
      term: 'Fall 2026',
    },
    {
      id: 'CRS-BIO330',
      code: 'BIO-330',
      title: 'Molecular Genetics & Lab',
      department: 'Molecular Biology',
      instructor: 'Dr. Miriam Klein',
      credits: 4,
      schedule: 'Tue/Thu 11:00 AM · Mendel Pavilion 4',
      capacity: 24,
      term: 'Fall 2026',
    },
  ];

  const ts = '2026-11-20T15:30:00Z';
  const enrollments: EnrollmentRecord[] = [
    createEnrollment('ENR-001', 'STU-2026-001', 'CRS-CS204', 96, 94, 95, ts),
    createEnrollment('ENR-002', 'STU-2026-001', 'CRS-MATH210', 92, 91, 94, ts),
    createEnrollment('ENR-003', 'STU-2026-001', 'CRS-ECON115', 95, 90, 92, ts),

    createEnrollment('ENR-004', 'STU-2026-002', 'CRS-ME302', 88, 86, 89, ts),
    createEnrollment('ENR-005', 'STU-2026-002', 'CRS-MATH210', 84, 82, 85, ts),
    createEnrollment('ENR-006', 'STU-2026-002', 'CRS-CS204', 87, 85, 88, ts),

    createEnrollment('ENR-007', 'STU-2026-003', 'CRS-ARC401', 94, 92, 95, ts),
    createEnrollment('ENR-008', 'STU-2026-003', 'CRS-ECON115', 89, 88, 90, ts),

    createEnrollment('ENR-009', 'STU-2026-004', 'CRS-MATH210', 68, 64, 67, ts),
    createEnrollment('ENR-010', 'STU-2026-004', 'CRS-CS204', 72, 66, 69, ts),

    createEnrollment('ENR-011', 'STU-2026-005', 'CRS-ECON115', 91, 89, 93, ts),
    createEnrollment('ENR-012', 'STU-2026-005', 'CRS-MATH210', 86, 84, 88, ts),

    createEnrollment('ENR-013', 'STU-2026-006', 'CRS-CS204', 70, 62, 65, ts),
    createEnrollment('ENR-014', 'STU-2026-006', 'CRS-ECON115', 74, 70, 71, ts),

    createEnrollment('ENR-015', 'STU-2026-007', 'CRS-BIO330', 95, 93, 96, ts),
    createEnrollment('ENR-016', 'STU-2026-007', 'CRS-MATH210', 90, 88, 91, ts),

    createEnrollment('ENR-017', 'STU-2026-009', 'CRS-CS204', 91, 89, 92, ts),
    createEnrollment('ENR-018', 'STU-2026-009', 'CRS-MATH210', 88, 86, 90, ts),

    createEnrollment('ENR-019', 'STU-2026-010', 'CRS-ME302', 93, 94, 95, ts),
    createEnrollment('ENR-020', 'STU-2026-010', 'CRS-MATH210', 91, 90, 92, ts),
  ];

  const attendance: AttendanceRecord[] = [
    { id: 'ATT-001', studentId: 'STU-2026-001', courseId: 'CRS-CS204', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-002', studentId: 'STU-2026-002', courseId: 'CRS-CS204', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-003', studentId: 'STU-2026-004', courseId: 'CRS-CS204', date: '2026-11-24', status: 'Late', note: 'Arrived 12 minutes late' },
    { id: 'ATT-004', studentId: 'STU-2026-006', courseId: 'CRS-CS204', date: '2026-11-24', status: 'Absent', note: 'Unexcused absence' },
    { id: 'ATT-005', studentId: 'STU-2026-009', courseId: 'CRS-CS204', date: '2026-11-24', status: 'Present', note: '' },

    { id: 'ATT-006', studentId: 'STU-2026-001', courseId: 'CRS-CS204', date: '2026-11-20', status: 'Present', note: '' },
    { id: 'ATT-007', studentId: 'STU-2026-002', courseId: 'CRS-CS204', date: '2026-11-20', status: 'Present', note: '' },
    { id: 'ATT-008', studentId: 'STU-2026-004', courseId: 'CRS-CS204', date: '2026-11-20', status: 'Absent', note: 'Advisor notified' },
    { id: 'ATT-009', studentId: 'STU-2026-006', courseId: 'CRS-CS204', date: '2026-11-20', status: 'Absent', note: 'Missed lab section' },
    { id: 'ATT-010', studentId: 'STU-2026-009', courseId: 'CRS-CS204', date: '2026-11-20', status: 'Present', note: '' },

    { id: 'ATT-011', studentId: 'STU-2026-001', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-012', studentId: 'STU-2026-002', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-013', studentId: 'STU-2026-004', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Absent', note: '' },
    { id: 'ATT-014', studentId: 'STU-2026-005', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-015', studentId: 'STU-2026-007', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-016', studentId: 'STU-2026-009', courseId: 'CRS-MATH210', date: '2026-11-24', status: 'Excused', note: 'Campus robotics symposium' },

    { id: 'ATT-017', studentId: 'STU-2026-003', courseId: 'CRS-ARC401', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-018', studentId: 'STU-2026-007', courseId: 'CRS-BIO330', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-019', studentId: 'STU-2026-002', courseId: 'CRS-ME302', date: '2026-11-24', status: 'Present', note: '' },
    { id: 'ATT-020', studentId: 'STU-2026-006', courseId: 'CRS-ECON115', date: '2026-11-22', status: 'Late', note: '' },
  ];

  const activities: ActivityLog[] = [
    {
      id: 'ACT-1',
      timestamp: '2026-11-24T16:15:00Z',
      type: 'attendance',
      summary: 'Recorded CS-204 roll call for Nov 24 (3 Present, 1 Late, 1 Absent).',
    },
    {
      id: 'ACT-2',
      timestamp: '2026-11-23T14:40:00Z',
      type: 'grade',
      summary: 'Updated final exam scores for BIO-330 Molecular Genetics.',
    },
    {
      id: 'ACT-3',
      timestamp: '2026-11-21T11:05:00Z',
      type: 'student',
      summary: 'Placed Caleb Mercer on Academic Probation following advisor review.',
    },
    {
      id: 'ACT-4',
      timestamp: '2026-11-19T09:20:00Z',
      type: 'enrollment',
      summary: 'Enrolled Hana Takahashi in CS-204 Data Structures & Algorithms.',
    },
  ];

  return {
    students,
    courses,
    enrollments,
    attendance,
    activities,
    nextStudentSeq: 11,
  };
}

let cachedStore: DatabaseStore | null = null;

function loadStore(): DatabaseStore {
  if (cachedStore) return cachedStore;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initial = buildInitialStore();
    saveStore(initial);
    cachedStore = initial;
    return initial;
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  cachedStore = JSON.parse(raw) as DatabaseStore;
  return cachedStore;
}

function saveStore(store: DatabaseStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
  cachedStore = store;
}

function recordActivity(store: DatabaseStore, type: ActivityLog['type'], summary: string): void {
  store.activities.unshift({
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    type,
    summary,
  });
  if (store.activities.length > 40) {
    store.activities = store.activities.slice(0, 40);
  }
}

export function getSnapshot(): RegistrySnapshot {
  const store = loadStore();
  const courseMap = new Map<string, CourseRecord>();
  for (const c of store.courses) {
    courseMap.set(c.id, c);
  }

  const students: StudentWithMetrics[] = store.students.map((student) => {
    const studentEnrollments = store.enrollments.filter((e) => e.studentId === student.id);
    let weightedPoints = 0;
    let gradedCredits = 0;
    let creditsCompleted = 0;

    for (const enrollment of studentEnrollments) {
      const course = courseMap.get(enrollment.courseId);
      const credits = course ? course.credits : 3;
      if (enrollment.gradePoints !== null) {
        weightedPoints += enrollment.gradePoints * credits;
        gradedCredits += credits;
        if (enrollment.gradePoints >= 1.0) {
          creditsCompleted += credits;
        }
      }
    }

    const gpa = gradedCredits > 0 ? Math.round((weightedPoints / gradedCredits) * 100) / 100 : 0;

    const studentAttendance = store.attendance.filter((a) => a.studentId === student.id);
    let attendanceScore = 0;
    for (const rec of studentAttendance) {
      if (rec.status === 'Present' || rec.status === 'Excused') attendanceScore += 1;
      else if (rec.status === 'Late') attendanceScore += 0.5;
    }
    const attendanceRate =
      studentAttendance.length > 0
        ? Math.round((attendanceScore / studentAttendance.length) * 100)
        : 100;

    return {
      ...student,
      gpa,
      creditsCompleted,
      attendanceRate,
      enrolledCourseCount: studentEnrollments.length,
    };
  });

  const courses: CourseWithMetrics[] = store.courses.map((course) => {
    const courseEnrollments = store.enrollments.filter((e) => e.courseId === course.id);
    const scored = courseEnrollments.filter((e) => e.totalScore !== null);
    const averageScore =
      scored.length > 0
        ? Math.round(
            (scored.reduce((sum, e) => sum + (e.totalScore ?? 0), 0) / scored.length) * 10
          ) / 10
        : null;

    return {
      ...course,
      enrolledCount: courseEnrollments.length,
      averageScore,
    };
  });

  return {
    students,
    courses,
    enrollments: store.enrollments,
    attendance: store.attendance,
    activities: store.activities,
  };
}

export interface CreateStudentInput {
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
  notes: string;
}

export function createStudent(input: CreateStudentInput): StudentRecord {
  const store = loadStore();
  const seq = String(store.nextStudentSeq).padStart(3, '0');
  const id = `STU-2026-${seq}`;
  store.nextStudentSeq += 1;

  const student: StudentRecord = {
    id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    dateOfBirth: input.dateOfBirth,
    program: input.program,
    year: input.year,
    status: input.status,
    advisor: input.advisor,
    guardianName: input.guardianName,
    guardianPhone: input.guardianPhone,
    enrolledDate: new Date().toISOString().slice(0, 10),
    avatarUrl: '',
    notes: input.notes,
  };

  store.students.unshift(student);
  recordActivity(store, 'student', `Registered new student ${student.fullName} (${student.id}) in ${student.program}.`);
  saveStore(store);
  return student;
}

export function updateStudent(id: string, patch: Partial<CreateStudentInput>): StudentRecord | null {
  const store = loadStore();
  const idx = store.students.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const current = store.students[idx];
  const updated: StudentRecord = {
    ...current,
    ...patch,
    id: current.id,
    enrolledDate: current.enrolledDate,
    avatarUrl: current.avatarUrl,
  };

  store.students[idx] = updated;
  recordActivity(store, 'student', `Updated student record for ${updated.fullName} (${updated.id}).`);
  saveStore(store);
  return updated;
}

export function deleteStudent(id: string): boolean {
  const store = loadStore();
  const student = store.students.find((s) => s.id === id);
  if (!student) return false;

  store.students = store.students.filter((s) => s.id !== id);
  store.enrollments = store.enrollments.filter((e) => e.studentId !== id);
  store.attendance = store.attendance.filter((a) => a.studentId !== id);
  recordActivity(store, 'student', `Removed student record for ${student.fullName} (${student.id}).`);
  saveStore(store);
  return true;
}

export interface CreateCourseInput {
  code: string;
  title: string;
  department: string;
  instructor: string;
  credits: number;
  schedule: string;
  capacity: number;
  term: string;
}

export function createCourse(input: CreateCourseInput): CourseRecord | { error: string } {
  const store = loadStore();
  const normalizedCode = input.code.toUpperCase().trim();
  if (store.courses.some((c) => c.code.toUpperCase() === normalizedCode)) {
    return { error: `Course code ${normalizedCode} already exists.` };
  }

  const cleanIdPart = normalizedCode.replace(/[^A-Z0-9]/g, '');
  const course: CourseRecord = {
    id: `CRS-${cleanIdPart}-${Date.now().toString().slice(-4)}`,
    code: normalizedCode,
    title: input.title,
    department: input.department,
    instructor: input.instructor,
    credits: input.credits,
    schedule: input.schedule,
    capacity: input.capacity,
    term: input.term,
  };

  store.courses.push(course);
  recordActivity(store, 'enrollment', `Added course ${course.code} — ${course.title}.`);
  saveStore(store);
  return course;
}

export function enrollStudent(studentId: string, courseId: string): EnrollmentRecord | { error: string } {
  const store = loadStore();
  const student = store.students.find((s) => s.id === studentId);
  if (!student) return { error: 'Student not found.' };
  const course = store.courses.find((c) => c.id === courseId);
  if (!course) return { error: 'Course not found.' };

  if (store.enrollments.some((e) => e.studentId === studentId && e.courseId === courseId)) {
    return { error: 'Student is already enrolled in this course.' };
  }

  const enrolledCount = store.enrollments.filter((e) => e.courseId === courseId).length;
  if (enrolledCount >= course.capacity) {
    return { error: `${course.code} is at full capacity (${course.capacity} seats).` };
  }

  const enrollment = createEnrollment(
    `ENR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId,
    courseId,
    null,
    null,
    null,
    new Date().toISOString()
  );
  store.enrollments.push(enrollment);
  recordActivity(store, 'enrollment', `Enrolled ${student.fullName} into ${course.code} (${course.title}).`);
  saveStore(store);
  return enrollment;
}

export function dropEnrollment(enrollmentId: string): boolean {
  const store = loadStore();
  const enrollment = store.enrollments.find((e) => e.id === enrollmentId);
  if (!enrollment) return false;

  const student = store.students.find((s) => s.id === enrollment.studentId);
  const course = store.courses.find((c) => c.id === enrollment.courseId);

  store.enrollments = store.enrollments.filter((e) => e.id !== enrollmentId);
  if (student && course) {
    recordActivity(store, 'enrollment', `Dropped ${student.fullName} from ${course.code}.`);
  }
  saveStore(store);
  return true;
}

export function updateEnrollmentGrades(
  enrollmentId: string,
  assignmentsScore: number | null,
  midtermScore: number | null,
  finalScore: number | null
): EnrollmentRecord | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === enrollmentId);
  if (idx === -1) return null;

  const existing = store.enrollments[idx];
  const computed = computeGradeMetrics(midtermScore, finalScore, assignmentsScore);
  const updated: EnrollmentRecord = {
    ...existing,
    assignmentsScore,
    midtermScore,
    finalScore,
    totalScore: computed.totalScore,
    letterGrade: computed.letterGrade,
    gradePoints: computed.gradePoints,
    updatedAt: new Date().toISOString(),
  };

  store.enrollments[idx] = updated;
  const student = store.students.find((s) => s.id === existing.studentId);
  const course = store.courses.find((c) => c.id === existing.courseId);
  if (student && course) {
    recordActivity(
      store,
      'grade',
      `Updated grade for ${student.fullName} in ${course.code}${updated.letterGrade ? ` (${updated.letterGrade})` : ''}.`
    );
  }
  saveStore(store);
  return updated;
}

export interface AttendanceBatchItem {
  studentId: string;
  status: AttendanceStatus;
  note: string;
}

export function saveAttendanceBatch(
  courseId: string,
  date: string,
  items: AttendanceBatchItem[]
): { saved: number } | { error: string } {
  const store = loadStore();
  const course = store.courses.find((c) => c.id === courseId);
  if (!course) return { error: 'Course not found.' };

  const enrolledIds = new Set(
    store.enrollments.filter((e) => e.courseId === courseId).map((e) => e.studentId)
  );

  let saved = 0;
  for (const item of items) {
    if (!enrolledIds.has(item.studentId)) continue;
    const existingIdx = store.attendance.findIndex(
      (a) => a.courseId === courseId && a.date === date && a.studentId === item.studentId
    );
    if (existingIdx !== -1) {
      store.attendance[existingIdx] = {
        ...store.attendance[existingIdx],
        status: item.status,
        note: item.note,
      };
    } else {
      store.attendance.push({
        id: `ATT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        studentId: item.studentId,
        courseId,
        date,
        status: item.status,
        note: item.note,
      });
    }
    saved += 1;
  }

  const presentCount = items.filter((i) => i.status === 'Present').length;
  const lateCount = items.filter((i) => i.status === 'Late').length;
  const absentCount = items.filter((i) => i.status === 'Absent').length;
  recordActivity(
    store,
    'attendance',
    `Saved ${course.code} roll call for ${date} (${presentCount} Present, ${lateCount} Late, ${absentCount} Absent).`
  );
  saveStore(store);
  return { saved };
}
