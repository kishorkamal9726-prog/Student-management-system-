import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  createCourse,
  createStudent,
  deleteStudent,
  dropEnrollment,
  enrollStudent,
  getSnapshot,
  saveAttendanceBatch,
  updateEnrollmentGrades,
  updateStudent,
} from './server/db.ts';
import type { AcademicYear, AttendanceStatus, StudentStatus } from './src/types.ts';

const VALID_STATUSES: StudentStatus[] = ['Active', 'Probation', 'Leave', 'Graduated'];
const VALID_YEARS: AcademicYear[] = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const VALID_ATTENDANCE: AttendanceStatus[] = ['Present', 'Late', 'Excused', 'Absent'];

function cleanString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

function parseOptionalScore(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100) return 'invalid';
  return Math.round(num * 10) / 10;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/registry', (_req, res) => {
    res.json(getSnapshot());
  });

  app.post('/api/students', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const fullName = cleanString(body.fullName, 120);
    const email = cleanString(body.email, 160);
    const phone = cleanString(body.phone, 40);
    const dateOfBirth = cleanString(body.dateOfBirth, 20);
    const program = cleanString(body.program, 80);
    const year = body.year as AcademicYear;
    const status = (body.status as StudentStatus) || 'Active';
    const advisor = cleanString(body.advisor, 100);
    const guardianName = cleanString(body.guardianName, 120);
    const guardianPhone = cleanString(body.guardianPhone, 40);
    const notes = cleanString(body.notes, 800);

    if (!fullName || !email || !program) {
      res.status(400).json({ error: 'Full name, email, and program are required.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!VALID_YEARS.includes(year)) {
      res.status(400).json({ error: 'Invalid academic year.' });
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid enrollment status.' });
      return;
    }

    const created = createStudent({
      fullName,
      email,
      phone,
      dateOfBirth,
      program,
      year,
      status,
      advisor,
      guardianName,
      guardianPhone,
      notes,
    });
    res.status(201).json(created);
  });

  app.patch('/api/students/:id', (req, res) => {
    const id = cleanString(req.params.id, 40);
    if (!/^[A-Za-z0-9-]+$/.test(id)) {
      res.status(400).json({ error: 'Invalid student identifier.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    if (body.fullName !== undefined) {
      const val = cleanString(body.fullName, 120);
      if (!val) {
        res.status(400).json({ error: 'Full name cannot be empty.' });
        return;
      }
      patch.fullName = val;
    }
    if (body.email !== undefined) {
      const val = cleanString(body.email, 160);
      if (!isValidEmail(val)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
      }
      patch.email = val;
    }
    if (body.phone !== undefined) patch.phone = cleanString(body.phone, 40);
    if (body.dateOfBirth !== undefined) patch.dateOfBirth = cleanString(body.dateOfBirth, 20);
    if (body.program !== undefined) {
      const val = cleanString(body.program, 80);
      if (!val) {
        res.status(400).json({ error: 'Program cannot be empty.' });
        return;
      }
      patch.program = val;
    }
    if (body.year !== undefined) {
      if (!VALID_YEARS.includes(body.year as AcademicYear)) {
        res.status(400).json({ error: 'Invalid academic year.' });
        return;
      }
      patch.year = body.year;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status as StudentStatus)) {
        res.status(400).json({ error: 'Invalid enrollment status.' });
        return;
      }
      patch.status = body.status;
    }
    if (body.advisor !== undefined) patch.advisor = cleanString(body.advisor, 100);
    if (body.guardianName !== undefined) patch.guardianName = cleanString(body.guardianName, 120);
    if (body.guardianPhone !== undefined) patch.guardianPhone = cleanString(body.guardianPhone, 40);
    if (body.notes !== undefined) patch.notes = cleanString(body.notes, 800);

    const updated = updateStudent(id, patch);
    if (!updated) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/students/:id', (req, res) => {
    const id = cleanString(req.params.id, 40);
    if (!/^[A-Za-z0-9-]+$/.test(id)) {
      res.status(400).json({ error: 'Invalid student identifier.' });
      return;
    }
    const ok = deleteStudent(id);
    if (!ok) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  app.post('/api/courses', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const code = cleanString(body.code, 20);
    const title = cleanString(body.title, 120);
    const department = cleanString(body.department, 80);
    const instructor = cleanString(body.instructor, 100);
    const schedule = cleanString(body.schedule, 120);
    const term = cleanString(body.term, 40) || 'Fall 2026';
    const credits = Number(body.credits);
    const capacity = Number(body.capacity);

    if (!code || !title || !department || !instructor) {
      res.status(400).json({ error: 'Code, title, department, and instructor are required.' });
      return;
    }
    if (!Number.isInteger(credits) || credits < 1 || credits > 8) {
      res.status(400).json({ error: 'Credits must be an integer between 1 and 8.' });
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      res.status(400).json({ error: 'Capacity must be an integer between 1 and 500.' });
      return;
    }

    const result = createCourse({
      code,
      title,
      department,
      instructor,
      credits,
      schedule,
      capacity,
      term,
    });
    if ('error' in result) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  });

  app.post('/api/enrollments', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const studentId = cleanString(body.studentId, 40);
    const courseId = cleanString(body.courseId, 40);
    if (!studentId || !courseId) {
      res.status(400).json({ error: 'studentId and courseId are required.' });
      return;
    }

    const result = enrollStudent(studentId, courseId);
    if ('error' in result) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  });

  app.delete('/api/enrollments/:id', (req, res) => {
    const id = cleanString(req.params.id, 40);
    if (!/^[A-Za-z0-9-]+$/.test(id)) {
      res.status(400).json({ error: 'Invalid enrollment identifier.' });
      return;
    }
    const ok = dropEnrollment(id);
    if (!ok) {
      res.status(404).json({ error: 'Enrollment not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  app.patch('/api/enrollments/:id/grades', (req, res) => {
    const id = cleanString(req.params.id, 40);
    const body = req.body as Record<string, unknown>;
    const assignmentsScore = parseOptionalScore(body.assignmentsScore);
    const midtermScore = parseOptionalScore(body.midtermScore);
    const finalScore = parseOptionalScore(body.finalScore);

    if (assignmentsScore === 'invalid' || midtermScore === 'invalid' || finalScore === 'invalid') {
      res.status(400).json({ error: 'Scores must be numbers between 0 and 100.' });
      return;
    }

    const updated = updateEnrollmentGrades(id, assignmentsScore, midtermScore, finalScore);
    if (!updated) {
      res.status(404).json({ error: 'Enrollment not found.' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/attendance/batch', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const courseId = cleanString(body.courseId, 40);
    const date = cleanString(body.date, 20);
    const rawItems = Array.isArray(body.items) ? body.items : null;

    if (!courseId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !rawItems) {
      res.status(400).json({ error: 'Valid courseId, date (YYYY-MM-DD), and items array are required.' });
      return;
    }

    const items = [];
    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue;
      const entry = raw as Record<string, unknown>;
      const studentId = cleanString(entry.studentId, 40);
      const status = entry.status as AttendanceStatus;
      const note = cleanString(entry.note, 240);
      if (!studentId || !VALID_ATTENDANCE.includes(status)) {
        res.status(400).json({ error: 'Invalid attendance item entry.' });
        return;
      }
      items.push({ studentId, status, note });
    }

    const result = saveAttendanceBatch(courseId, date, items);
    if ('error' in result) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  app.get('/api/export/students.csv', (_req, res) => {
    const snapshot = getSnapshot();
    const headers = [
      'Student ID',
      'Full Name',
      'Email',
      'Program',
      'Academic Year',
      'Status',
      'Cumulative GPA',
      'Attendance Rate (%)',
      'Credits Completed',
      'Advisor',
      'Enrolled Date',
    ];
    const rows = snapshot.students.map((s) =>
      [
        s.id,
        s.fullName,
        s.email,
        s.program,
        s.year,
        s.status,
        s.gpa.toFixed(2),
        s.attendanceRate,
        s.creditsCompleted,
        s.advisor,
        s.enrolledDate,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    const csv = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="alderwood-students.csv"');
    res.send(csv);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Alderwood Student Registry running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
