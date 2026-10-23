import type { ReactNode } from 'react'
interface PageHeaderProps { eyebrow?: string; title: string; description: string; action?: ReactNode }
export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
    <div className="min-w-0">
      {eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.16em] text-teal-700 uppercase">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
}
