import { useState } from 'react'
import { useWorkspace } from '../../context/Workspace'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  Activity, ArrowUpRight, BrainCircuit, ChevronDown, FileDown,
  History, Inbox, LayoutDashboard, Menu, PanelLeftClose, ShieldCheck, X,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Intelligence Inbox', path: '/inbox', icon: Inbox, end: false },
  { label: 'Conversation Intelligence', path: '/intelligence', icon: BrainCircuit, end: false },
  { label: 'Imports & History', path: '/imports', icon: History, end: false },
  { label: 'Manager Brief & Exports', path: '/exports', icon: FileDown, end: false },
]

function Sidebar({ close, collapsed, onCollapse }: {
  close?: () => void
  collapsed: boolean
  onCollapse: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-white text-slate-800 border-r border-slate-200">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
        <NavLink to="/" onClick={close} className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Activity size={23} strokeWidth={2.6} />
          </div>
          {!collapsed && <div><p className="text-xl font-bold tracking-tight">RevenueIQ</p><p className="text-[10px] tracking-widest text-slate-500 uppercase">Intelligence Workspace</p></div>}
        </NavLink>
        <button type="button" aria-label="Close navigation" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-7">
        {!collapsed && <p className="mb-4 px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Workspace</p>}
        <nav aria-label="Main navigation" className="space-y-1.5">
          {navigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end} onClick={close} title={collapsed ? label : undefined}
              className={({ isActive }) => [
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-colors',
                isActive ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                collapsed ? 'justify-center' : '',
              ].join(' ')}>
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        {!collapsed && <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-teal-700"><ShieldCheck size={16} /><span className="text-xs font-semibold">Data integrity</span></div>
          <p className="text-xs leading-5 text-slate-500">Source records, review decisions and corrections will be tracked separately.</p>
          <NavLink to="/imports" onClick={close} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900">Import workspace <ArrowUpRight size={13} /></NavLink>
        </div>}
      </div>
      <div className="border-t border-slate-200 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">SM</div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Sales Manager</p><p className="text-[11px] text-slate-500">Assessment workspace</p></div>}
          {!collapsed && <ChevronDown size={14} className="text-slate-500" />}
        </div>
        <button type="button" onClick={onCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-slate-500 hover:bg-slate-100 lg:flex">
          <PanelLeftClose size={15} />{!collapsed && 'Collapse sidebar'}
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { data } = useWorkspace()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const activePage = navigation.find((item) => item.path === location.pathname)?.label ?? 'RevenueIQ'

  return <div className="min-h-screen bg-[#f7f9fc]">
    <aside className={['fixed inset-y-0 left-0 z-40 hidden transition-all duration-200 lg:block', collapsed ? 'w-[84px]' : 'w-[260px]'].join(' ')}>
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />
    </aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileOpen(false)} />
      <aside className="relative h-full w-[280px] max-w-[85vw]"><Sidebar collapsed={false} close={() => setMobileOpen(false)} onCollapse={() => undefined} /></aside>
    </div>}
    <div className={['min-h-screen transition-[margin] duration-200', collapsed ? 'lg:ml-[84px]' : 'lg:ml-[260px]'].join(' ')}>
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={22} /></button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{activePage}</p><p className="hidden text-xs text-slate-500 sm:block">Revenue intelligence workspace</p></div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"><span className="size-2 rounded-full bg-amber-500" />{data.records.length ? `${data.records.length} records loaded` : "Awaiting import"}</span>
      </header>
      <main className="mx-auto max-w-[1550px] p-4 sm:p-7 lg:p-9"><Outlet /></main>
    </div>
  </div>
}
