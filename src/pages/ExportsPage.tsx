import { useMemo,useState } from 'react'
import { ClipboardList, Download, FileArchive, FileCode2, FileSpreadsheet, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react'
import {Link} from 'react-router'
import PageHeader from '../components/ui/PageHeader'
import {useWorkspace} from '../context/Workspace'
import {buildExportBundle,downloadExportZip} from '../lib/exporter'
const cards=[
 {icon:ClipboardList,title:'Manager Brief',format:'Markdown',description:'Activity, three findings, manager actions and a rejected routing decision.'},
 {icon:FileCode2,title:'Routed Records',format:'JSON',description:'One active output for each current destination, with original evidence and source revision.'},
 {icon:FileSpreadsheet,title:'Activity & Review Reports',format:'CSV',description:'Structured source-person activity, coverage, routing and review states.'},
 {icon:FileArchive,title:'Export Manifest',format:'JSON',description:'All records, routes, source revisions, active paths, overrides and freshness.'},
]
export default function ExportsPage(){
 const {data,loading}=useWorkspace()
 const [message,setMessage]=useState('')
 const bundle=useMemo(()=>data.records.length?buildExportBundle(data):null,[data])
 const manifest=bundle?.manifest
 const download=()=>{try{const info=downloadExportZip(data);setMessage(`Downloaded ZIP with ${info.count} files for ${info.records} source records.`)}catch(e){setMessage(e instanceof Error?e.message:String(e))}}
 return <div><PageHeader eyebrow="Delivery workspace" title="Manager Brief & Exports" description="Generate one organized ZIP with evidence-backed conversation files, a manager brief, CSV reports and a verified manifest. Everything is generated locally from the current browser workspace." action={<button onClick={download} disabled={!data.records.length||loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"><Download size={17}/> Download complete ZIP</button>}/>
 {!manifest?<div className="panel p-8 text-center"><AlertCircle size={30} className="mx-auto text-amber-600"/><h2 className="mt-4 text-lg font-semibold">No records available for export</h2><p className="mt-2 text-sm text-slate-500">Import a compatible JSON batch to generate source-grounded outputs.</p><Link to="/imports" className="btn-primary mt-5">Open Imports <ArrowUpRight size={15}/></Link></div>:<>
 <section className="grid gap-4 sm:grid-cols-3"><div className="panel p-5"><p className="text-xs font-medium text-slate-500">Unique records</p><p className="mt-2 text-3xl font-bold">{manifest.total_records}</p></div><div className="panel p-5"><p className="text-xs font-medium text-slate-500">Usable text</p><p className="mt-2 text-3xl font-bold">{manifest.usable_text_records}</p></div><div className="panel p-5"><p className="text-xs font-medium text-slate-500">Files in download</p><p className="mt-2 text-3xl font-bold">{bundle?.files.length}</p></div></section>
 <div className="mt-6 grid gap-4 md:grid-cols-2">{cards.map(({icon:Icon,title,format,description})=><div key={title} className="panel p-6"><div className="flex items-start justify-between"><span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icon size={22}/></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{format}</span></div><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}</div>
 <div className="panel mt-6 p-6"><div className="flex gap-3"><ShieldCheck size={21} className="shrink-0 text-teal-700"/><div><h2 className="font-semibold">Source-linked & revision-aware</h2><p className="mt-2 text-sm leading-6 text-slate-600">The manifest lists every record's current source revision, effective routes, existing output paths, review state, manual override and evidence freshness. Missing transcripts are explicitly marked. A new export is reconstructed from current state, so superseded routes are absent from the new ZIP.</p></div></div></div>
 <section className="panel mt-6 overflow-hidden"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold">Manifest preview</h2><p className="mt-1 text-xs text-slate-500">Current records and destinations · first 12 entries</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Source','Revision','Effective primary','Analysis freshness','Override','Output files'].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{manifest.entries.slice(0,12).map(e=><tr key={`${e.source_type}:${e.source_id}`} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{e.record_ref}</td><td className="px-4 py-3">{e.applied_source_revision}</td><td className="px-4 py-3">{e.effective_primary_route}</td><td className="px-4 py-3">{e.analysis_freshness}</td><td className="px-4 py-3">{e.manual_override?'Yes':'No'}</td><td className="px-4 py-3">{e.output_paths.length}</td></tr>)}</tbody></table></div></section>
 <p className="mt-4 text-xs leading-5 text-slate-500">Privacy: export generation runs entirely in your browser; the ZIP contains confidential source payloads and transcripts. Keep the downloaded archive private and share only with authorized assessment reviewers.</p>
 </>}
 {message&&<p role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
 </div>
}
