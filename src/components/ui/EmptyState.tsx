import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
interface EmptyStateProps { icon: LucideIcon; title: string; description: string; actionLabel?: string; actionTo?: string }
export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  return <div className="panel flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={28} strokeWidth={1.7} /></div>
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    {actionLabel && actionTo && <Link to={actionTo} className="btn-primary mt-6">{actionLabel}</Link>}
  </div>
}
