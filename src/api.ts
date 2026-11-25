import type {
  AcademicYear,
  AttendanceStatus,
  CourseRecord,
  EnrollmentRecord,
  RegistrySnapshot,
  StudentRecord,
  StudentStatus,
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // keep default status error
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function fetchRegistry(): Promise<RegistrySnapshot> {
  return request<RegistrySnapshot>('/api/registry');
}

export interface StudentPayload {
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

export function createStudentApi(payload: StudentPayload): Promise<StudentRecord> {
  return request<StudentRecord>('/api/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateStudentApi(id: string, payload: Partial<StudentPayload>): Promise<StudentRecord> {
  return request<StudentRecord>(`/api/students/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteStudentApi(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export interface CoursePayload {
  code: string;
  title: string;
  department: string;
  instructor: string;
  credits: number;
  schedule: string;
  capacity: number;
  term: string;
}

export function createCourseApi(payload: CoursePayload): Promise<CourseRecord> {
  return request<CourseRecord>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function enrollStudentApi(studentId: string, courseId: string): Promise<EnrollmentRecord> {
  return request<EnrollmentRecord>('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify({ studentId, courseId }),
  });
}

export function dropEnrollmentApi(enrollmentId: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/enrollments/${encodeURIComponent(enrollmentId)}`, {
    method: 'DELETE',
  });
}

export function updateGradesApi(
  enrollmentId: string,
  scores: {
    assignmentsScore: number | null;
    midtermScore: number | null;
    finalScore: number | null;
  }
): Promise<EnrollmentRecord> {
  return request<EnrollmentRecord>(`/api/enrollments/${encodeURIComponent(enrollmentId)}/grades`, {
    method: 'PATCH',
    body: JSON.stringify(scores),
  });
}

export function saveAttendanceBatchApi(
  courseId: string,
  date: string,
  items: Array<{ studentId: string; status: AttendanceStatus; note: string }>
): Promise<{ saved: number }> {
  return request<{ saved: number }>('/api/attendance/batch', {
    method: 'POST',
    body: JSON.stringify({ courseId, date, items }),
  });
}
