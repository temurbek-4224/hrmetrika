import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

const variants = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  inactive: 'bg-slate-100 text-slate-600',
  on_leave: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  terminated: 'bg-red-50 text-red-600 ring-1 ring-red-200/60',
  pending: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/60',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  rejected: 'bg-red-50 text-red-600',
  open: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/60',
  filled: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  cancelled: 'bg-slate-100 text-slate-500',
}

const labelKeys = {
  active: 'status.active',
  inactive: 'status.inactive',
  on_leave: 'status.onLeave',
  terminated: 'status.terminated',
  pending: 'status.pending',
  approved: 'status.approved',
  rejected: 'status.rejected',
  open: 'status.pending',
  filled: 'status.approved',
  cancelled: 'status.rejected',
}

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[status] || variants.inactive)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {t(labelKeys[status] || 'status.inactive')}
    </span>
  )
}
