import type { Route, Snapshot } from './data'
import { recordKey, usableText } from './data'
import { allAnalyses, type ConversationAnalysis } from './analysis'
import { metrics, personOf } from './insights'

export interface ExportFile { path: string; content: string; contentType: string }
export interface ManifestEntry {
  source_type: string; source_id: string; record_ref: string; applied_source_revision: number
  suggested_primary_route: Route; effective_primary_route: Route; routes: Route[]
  output_paths: string[]; processing_review_state: string; manual_override: boolean
  analysis_freshness: string; manual_reason: string | null; evidence_count: number
}
export interface ExportManifest {
  schema_version: string; workspace: string; activity_date: string
  generated_at: string; total_records: number; usable_text_records: number
  analysis_method: string; entries: ManifestEntry[]; files: {path:string;content_type:string}[]
}
export interface ExportBundle { files: ExportFile[]; manifest: ExportManifest }
const ROOT = 'revenueiq-exports'
const ROUTE_DIR: Partial<Record<Route,string>> = {
  'Sales & Opportunity':'sales', 'Partnerships':'partnerships', 'Customer Success':'customer-success',
  'Vendor & Procurement':'vendor-procurement', 'Internal Operations':'internal-operations',
  'Outreach & Coaching':'coaching', 'Needs Review':'needs-review'
}
const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_')
const text = (value: unknown) => value === undefined || value === null ? '' : String(value)
const csv = (value: unknown) => `"${text(value).replace(/"/g,'""')}"`
function csvTable(columns:string[],rows:unknown[][]) { return [columns.map(csv).join(','),...rows.map(row=>row.map(csv).join(','))].join('\r\n')+'\r\n' }
function uniqueRoutes(a:ConversationAnalysis):Route[] {
  // A manual override supersedes the suggested primary route as an active destination.
  // Secondary routes remain active unless equal to the overridden primary route.
  return [...new Set([a.effectivePrimary,...a.secondary.filter(x=>x!==a.primary && x!==a.effectivePrimary)])]
}
function managerBrief(snapshot:Snapshot,analyses:ConversationAnalysis[]):string {
 const m=metrics(snapshot)
 const current=analyses.filter(a=>a.status==='current')
 const work=current.filter(a=>a.action)
 const evidence=(ref:string)=>current.find(a=>a.recordRef===ref)
 const highlights=['M03','M07','C10'].map(ref=>evidence(ref)).filter((a):a is ConversationAnalysis=>!!a)
 const lines=[
 '# RevenueIQ — Manager Brief', '', '**Selected activity date:** 21 August 2026 (Asia/Kolkata)',
 '', '> Scope: a selected assessment sample, not a complete sales funnel. Source text is adapted. Do not infer close rates or historical trends.',
 '', '## Activity and coverage', '',
 `- Unique records: **${m.total}** (${m.calls} calls, ${m.meetings} meetings).`,
 `- Usable transcript text: **${m.covered}/${m.total}** (${m.coverage.toFixed(1)}%).`,
 `- Records without usable text: **${m.missing}**; no transcript insights fabricated.`,
 `- Evidence-validated conversations: **${current.length}**.`,
 `- Manual routing overrides: **${m.overrides}**.`,
 '', '## Three significant findings and evidence', ''
 ]
 const explanations:Record<string,string> = {
  M03:'Product-fit risk: the buyer expected a credit product but learned the domestic card is prepaid. Verify fit before advancing the opportunity.',
  M07:'Existing-customer friction: payment-entry fields carry stale values. Escalate distinct product issues rather than treating this as a new sale.',
  C10:'Contact boundary: the recipient left the target company and declined an unsolicited follow-up call. Honor that preference and correct contact data.'
 }
 for(const a of highlights) {
  lines.push(`### ${a.recordRef}: ${a.headline}`,'', explanations[a.recordRef], '',`- Effective route: ${a.effectivePrimary}`,`- Recommended action: ${a.action}`)
  for(const e of a.evidence)lines.push(`- Source: **${e.locator}** — “${e.quote.replace(/\n/g,' ')}”`)
  lines.push('')
 }
 if(!highlights.length)lines.push('These findings become available after importing source records with usable text.','')
 lines.push('## Manager worklist','')
 for(const a of work.slice(0,18))lines.push(`- **${a.recordRef}** [${a.effectivePrimary}]: ${a.action} (See ${a.recordRef} export for evidence.)`)
 if(!work.length)lines.push('No evidence-backed actions are available until a qualifying import.','')
 lines.push('', '## Decision considered and rejected','',
 'Rejected: treating every outbound conversation, external meeting, or source status as a qualified sales opportunity. Vendor, customer-support and internal discussions require different owners. Evidence-based primary/secondary routing with manual override prevents misleading pipeline counts.',
 '', '## Quality and evidence policy','',
 'Call excerpts are exact substrings of currently imported transcript text. Meeting citations include 1-based transcript turn numbers. No synthetic talk ratios, timestamps, revenue or conversion rates. A changed transcript must revalidate its evidence before being marked current.',
 '', '## Export notes','',
 'The manifest.json enumerates active files only. Every logical output has a single active filename within this archive. Generating a new ZIP reconstructs the archive and replaces obsolete routes instead of accumulating stale destinations.', ''
 )
 return lines.join('\n')
}
export function buildExportBundle(snapshot:Snapshot, generatedAt=''):ExportBundle {
 const analyses=allAnalyses(snapshot)
 const currentTime=generatedAt || new Date().toISOString()
 const files:ExportFile[]=[]
 const put=(path:string,content:string,contentType:string)=>{
   if(files.some(f=>f.path===path))throw new Error(`Export name collision: ${path}`)
   files.push({path,content,contentType})
 }
 const manifestEntries:ManifestEntry[]=[]
 for(const r of [...snapshot.records].sort((a,b)=>a.record_ref.localeCompare(b.record_ref,undefined,{numeric:true}))) {
  const a=analyses.find(item=>item.key===recordKey(r))!
  const decision=snapshot.decisions.find(d=>d.key===a.key)
  const routes=uniqueRoutes(a)
  const filename=`${safe(r.record_ref)}-${r.source_type}-${safe(r.source_id)}.json`
  const outputPaths=routes.map(route=>`${ROOT}/${ROUTE_DIR[route] ?? 'needs-review'}/${filename}`)
  const freshness=a.status==='current'?'current':a.status==='evidence-mismatch'?'stale-evidence':'pending-source-evidence'
  const document={schema_version:'1.0',identity:{source_type:r.source_type,source_id:r.source_id,record_ref:r.record_ref},
    applied_source_revision:r.revision, imported_batch_id:r.batch_id,source_imported_at:r.imported_at,
    route:{suggested_primary:a.primary,effective_primary:a.effectivePrimary,secondary:a.secondary,active_routes:routes,manual_override:!!decision,manual_reason:decision?.note??null,manual_updated_at:decision?.updated_at??null},
    review:{status:a.status,analysis_freshness:freshness,review_state:decision?'manually-routed':a.status==='current'?'evidence-validated-awaiting-manager-review':'requires-source-review'},
    intelligence:{headline:a.headline,summary:a.summary,action:a.action,concern:a.concern,rationale:a.rationale,evidence:a.evidence},
    source_metadata:r.payload,transcript_payload:r.transcript_payload}
  for(const path of outputPaths)put(path,JSON.stringify(document,null,2)+'\n','application/json')
  manifestEntries.push({source_type:r.source_type,source_id:r.source_id,record_ref:r.record_ref,applied_source_revision:r.revision,suggested_primary_route:a.primary,effective_primary_route:a.effectivePrimary,routes,output_paths:outputPaths,processing_review_state:document.review.review_state,manual_override:!!decision,analysis_freshness:freshness,manual_reason:decision?.note??null,evidence_count:a.evidence.length})
 }
 put(`${ROOT}/manager-brief/2026-08-21.md`,managerBrief(snapshot,analyses),'text/markdown')
 put(`${ROOT}/reports/activity-summary.csv`,csvTable(['record_ref','source_type','source_id','revision','source_person','usable_text','route','analysis_status','manual_override'],
  [...snapshot.records].sort((a,b)=>a.record_ref.localeCompare(b.record_ref,undefined,{numeric:true})).map(r=>{
   const a=analyses.find(x=>x.key===recordKey(r))!;return [r.record_ref,r.source_type,r.source_id,r.revision,personOf(r),usableText(r),a.effectivePrimary,a.status,a.overridden]
  })),'text/csv')
 put(`${ROOT}/reports/review-status.csv`,csvTable(['record_ref','source_type','source_id','revision','effective_routes','review_state','freshness','evidence_count','manual_override','manual_note'],
 manifestEntries.map(e=>[e.record_ref,e.source_type,e.source_id,e.applied_source_revision,e.routes.join(' | '),e.processing_review_state,e.analysis_freshness,e.evidence_count,e.manual_override,e.manual_reason])),'text/csv')
 const manifest:ExportManifest={schema_version:'1.0',workspace:'RevenueIQ',activity_date:'2026-08-21',generated_at:currentTime,total_records:snapshot.records.length,
 usable_text_records:snapshot.records.filter(usableText).length,analysis_method:'Deterministic, curated source-phrase validation; no model calls',entries:manifestEntries,
 files:files.map(f=>({path:f.path,content_type:f.contentType}))}
 put(`${ROOT}/manifest.json`,JSON.stringify(manifest,null,2)+'\n','application/json')
 // Verify all file references point at active outputs.
 const paths=new Set(files.map(f=>f.path))
 for(const entry of manifestEntries)for(const path of entry.output_paths)if(!paths.has(path))throw new Error(`Missing active export: ${path}`)
 return {files,manifest}
}

// Standards-compliant ZIP writer (STORE method, CRC32, UTF-8). No runtime dependency or remote upload.
const enc=new TextEncoder()
const crcTable=(()=>{const a=new Uint32Array(256);for(let i=0;i<256;i++){let v=i;for(let j=0;j<8;j++)v=v&1?0xedb88320^(v>>>1):v>>>1;a[i]=v>>>0}return a})()
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function u16(view:DataView,offset:number,n:number){view.setUint16(offset,n,true)}
function u32(view:DataView,offset:number,n:number){view.setUint32(offset,n>>>0,true)}
export function makeZip(files:ExportFile[]):Uint8Array {
 const prepared=files.map(f=>({name:enc.encode(f.path),bytes:enc.encode(f.content)}))
 if(prepared.length>65535)throw new Error('Too many export files.')
 let offset=0
 const local:Uint8Array[]=[];const central:Uint8Array[]=[]
 for(const item of prepared){
  const crc=crc32(item.bytes);const size=item.bytes.byteLength
  const h=new Uint8Array(30+item.name.length),v=new DataView(h.buffer)
  u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x0800);u16(v,8,0);u32(v,14,crc);u32(v,18,size);u32(v,22,size);u16(v,26,item.name.length);h.set(item.name,30)
  local.push(h,item.bytes)
  const c=new Uint8Array(46+item.name.length),cv=new DataView(c.buffer)
  u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x0800);u16(cv,10,0);u32(cv,16,crc);u32(cv,20,size);u32(cv,24,size);u16(cv,28,item.name.length);u32(cv,42,offset);c.set(item.name,46)
  central.push(c);offset+=h.length+size
 }
 const centralStart=offset
 for(const item of central)offset+=item.length
 if(offset>0xffffffff)throw new Error('Export exceeds ZIP32 limit.')
 const e=new Uint8Array(22),ev=new DataView(e.buffer)
 u32(ev,0,0x06054b50);u16(ev,8,prepared.length);u16(ev,10,prepared.length);u32(ev,12,offset-centralStart);u32(ev,16,centralStart)
 const result=new Uint8Array(offset+22);let at=0
 for(const part of [...local,...central,e]){result.set(part,at);at+=part.length}
 return result
}
export function downloadExportZip(snapshot:Snapshot):{count:number;records:number} {
 const bundle=buildExportBundle(snapshot)
 const bytes=makeZip(bundle.files)
 const blob=new Blob([new Uint8Array(bytes)],{type:'application/zip'})
 const url=URL.createObjectURL(blob)
 const anchor=document.createElement('a');anchor.href=url;anchor.download='RevenueIQ-Exports.zip';document.body.appendChild(anchor);anchor.click();anchor.remove()
 setTimeout(()=>URL.revokeObjectURL(url),12000)
 return {count:bundle.files.length,records:bundle.manifest.total_records}
}
