import { AlertTriangle, Award, CheckCircle2, Clock } from 'lucide-react';
import type { StudentStatus } from '../types';

export function StatusIndicator({ status }: { status: StudentStatus }) {
  switch (status) {
    case 'Active':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Active</span>
        </span>
      );
    case 'Probation':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Probation</span>
        </span>
      );
    case 'Leave':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Leave</span>
        </span>
      );
    case 'Graduated':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-900 whitespace-nowrap">
          <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Graduated</span>
        </span>
      );
  }
}
