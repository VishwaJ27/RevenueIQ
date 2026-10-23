import {useRef,useState} from 'react'
import {CheckCircle2,Database,FileJson,History,RotateCcw,ShieldCheck,UploadCloud} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import {useWorkspace} from '../context/Workspace'
import type {ImportEvent} from '../lib/data'
import {usableText} from '../lib/data'
export default function ImportsPage(){
 const {data,loading,busy,error,importFile,reset}=useWorkspace()
 const ref=useRef<HTMLInputElement>(null)
 const [last,setLast]=useState<ImportEvent|null>(null)
 const [notice,setNotice]=useState('')
 const [confirmReset,setConfirmReset]=useState(false)
 const total=data.records.length, covered=data.records.filter(usableText).length
 const accept=async(file?:File)=>{if(!file)return;setNotice('');try{const event=await importFile(file);setLast(event);setNotice(`Imported ${file.name} successfully.`)}catch(e){setNotice(e instanceof Error?e.message:String(e))}finally{if(ref.current)ref.current.value=''}}
 return <div>
  <PageHeader eyebrow="Data management" title="Imports & History" description="Upload compatible JSON batches, prevent duplicates, retain newer revisions and preserve manual routing decisions." />
  <div className="grid gap-4 sm:grid-cols-3 mb-6">
   {[['Unique records',total],['Usable texts',covered],['Import attempts',data.events.length]].map(([label,value])=><div className="panel p-5" key={label}><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold mt-2">{loading?'…':value}</p></div>)}
  </div>
  <div className="panel p-6 sm:p-8">
   <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void accept(e.dataTransfer.files[0])}} className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-6 py-12 text-center">
    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700"><UploadCloud size={30}/></div>
    <h2 className="text-lg font-semibold">Import JSON data</h2>
    <p className="mt-2 max-w-lg text-sm text-slate-600 leading-6">Upload a compatible JSON batch containing a batch ID, revision and source records. Files stay in your browser's IndexedDB; no server upload occurs.</p>
    <input ref={ref} type="file" accept=".json,application/json" className="hidden" onChange={e=>void accept(e.target.files?.[0])}/>
    <button type="button" disabled={busy||loading} onClick={()=>ref.current?.click()} className="btn-primary mt-6"><FileJson size={17}/>{busy?'Importing…':'Choose JSON File'}</button>
    <p className="text-xs text-slate-500 mt-3">You can also drag and drop a .json file here · Maximum 20 MB</p>
   </div>
   {(notice||error)&&<p role="status" className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{notice||error}</p>}
   {last&&<div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex gap-2 items-center font-semibold text-emerald-800"><CheckCircle2 size={18}/>Latest import receipt</p><div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700"><span>Received: <b>{last.received}</b></span><span>Inserted: <b>{last.inserted}</b></span><span>Updated: <b>{last.updated}</b></span><span>Ignored: <b>{last.ignored}</b></span><span>Text changed: <b>{last.text_changed}</b></span></div></div>}
  </div>
  <div className="grid gap-4 sm:grid-cols-3 mt-6">
    {[{icon:Database,name:'Idempotent imports',desc:'Existing same-revision records are not duplicated.'},{icon:History,name:'Latest revision wins',desc:'Newer source revisions replace older records without duplicating them.'},{icon:ShieldCheck,name:'Manual overrides survive',desc:'Routing corrections are stored separately.'}].map(({icon:Icon,name,desc})=><div key={name} className="panel p-5"><Icon className="text-teal-700 mb-3" size={22}/><h3 className="font-semibold text-sm">{name}</h3><p className="mt-2 text-xs text-slate-500 leading-5">{desc}</p></div>)}
  </div>
  <div className="panel p-6 mt-6 overflow-x-auto">
    <div className="flex items-center gap-3 justify-between mb-4"><h2 className="font-semibold">Import history</h2><span className="text-xs text-slate-500">Newest first</span></div>
    {!data.events.length?<p className="text-sm text-slate-500 py-6">No deliveries imported yet.</p>:<table className="w-full text-left text-sm min-w-[650px]"><thead className="text-xs text-slate-500 border-b"><tr>{['Batch / file','Revision','Received','Inserted','Updated','Ignored','Imported at'].map(h=><th key={h} className="py-3 pr-3">{h}</th>)}</tr></thead><tbody>{data.events.map((e,i)=><tr key={e.id??i} className="border-b border-slate-100"><td className="py-3 pr-3"><b>{e.batch_id}</b><p className="text-xs text-slate-500">{e.filename}</p></td><td>{e.revision}</td><td>{e.received}</td><td>{e.inserted}</td><td>{e.updated}</td><td>{e.ignored}</td><td className="text-xs">{new Date(e.imported_at).toLocaleString('en-IN')}</td></tr>)}</tbody></table>}
  </div>
  <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6"><div className="flex gap-3"><RotateCcw className="text-red-600 shrink-0"/><div className="flex-1"><h3 className="font-semibold text-slate-900">Reset this browser workspace</h3><p className="text-xs leading-5 text-slate-500 mt-1">Clears records, manual corrections and import history. Use only to restart the replay from scratch.</p><div className="mt-4 flex flex-wrap gap-3">{!confirmReset?<button className="btn-secondary" onClick={()=>setConfirmReset(true)}>Prepare reset</button>:<><button disabled={busy} onClick={async()=>{await reset();setLast(null);setNotice('Workspace reset.');setConfirmReset(false)}} className="rounded-lg bg-red-700 text-white px-4 py-2 text-sm">Confirm irreversible reset</button><button onClick={()=>setConfirmReset(false)} className="btn-secondary">Cancel</button></>}</div></div></div></div>
 </div>
}
