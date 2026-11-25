import { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Plus, Search } from 'lucide-react';
import type { StudentStatus, StudentWithMetrics } from '../types';
import { Avatar } from './Avatar';
import { StatusIndicator } from './StatusIndicator';

interface StudentsViewProps {
  students: StudentWithMetrics[];
  onSelectStudent: (student: StudentWithMetrics) => void;
  onAddStudent: () => void;
}

type FilterStatus = 'All' | StudentStatus;
type SortField = 'fullName' | 'id' | 'gpa' | 'attendanceRate';

const STATUS_TABS: FilterStatus[] = ['All', 'Active', 'Probation', 'Leave', 'Graduated'];

export function StudentsView({ students, onSelectStudent, onAddStudent }: StudentsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const programs = useMemo(() => {
    const set = new Set(students.map((s) => s.program));
    return ['All', ...Array.from(set).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (statusFilter !== 'All' && s.status !== statusFilter) return false;
        if (programFilter !== 'All' && s.program !== programFilter) return false;
        if (!q) return true;
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.program.toLowerCase().includes(q) ||
          s.advisor.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'gpa' || sortField === 'attendanceRate') {
          return (a[sortField] - b[sortField]) * dir;
        }
        return a[sortField].localeCompare(b[sortField]) * dir;
      });
  }, [students, search, statusFilter, programFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'gpa' || field === 'attendanceRate' ? 'desc' : 'asc');
    }
  }

  function resetFilters() {
    setSearch('');
    setStatusFilter('All');
    setProgramFilter('All');
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, email..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by academic program"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-700 focus:outline-none"
          >
            {programs.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Programs' : p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/export/students.csv"
            download="alderwood-students.csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
          <button
            type="button"
            onClick={onAddStudent}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900">No matching students found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try clearing your search query or switching the status and program filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 pl-5 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('fullName')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                    >
                      <span>Student</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('id')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                    >
                      <span>ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Program & Cohort</th>
                  <th className="py-3 px-3">Advisor</th>
                  <th className="py-3 px-3">Standing</th>
                  <th className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('gpa')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap ml-auto"
                    >
                      <span>GPA</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="py-3 pl-3 pr-5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('attendanceRate')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap ml-auto"
                    >
                      <span>Attendance</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className="cursor-pointer hover:bg-slate-50/90 transition-colors"
                  >
                    <td className="py-2.5 pl-5 pr-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={student.fullName} src={student.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{student.fullName}</div>
                          <div className="text-xs text-slate-500 truncate">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {student.id}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-700 whitespace-nowrap">
                      <span className="font-medium text-slate-800">{student.program}</span>
                      <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                      <span className="text-slate-500">{student.year}</span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {student.advisor || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusIndicator status={student.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs font-medium text-slate-900 tabular-nums">
                      {student.gpa > 0 ? student.gpa.toFixed(2) : '—'}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {student.attendanceRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
