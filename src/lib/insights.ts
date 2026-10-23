import type {StoredRecord, Snapshot} from './data'
import {recordKey, usableText} from './data'

export function labelOf(r:StoredRecord) {
 return String(r.payload.title || r.payload.rep_name || r.record_ref)
}
export function personOf(r:StoredRecord) {
 return String(r.source_type==='call' ? (r.payload.rep_name || r.payload.rep_email || 'Unknown rep') : (r.payload.organizer_email || 'Unknown organizer'))
}
export function dateOf(r:StoredRecord) {
 const raw=r.source_type==='call' ? r.payload.started_at : (r.payload.start_time || r.payload.starts_at || r.payload.started_at || r.payload.start_at)
 return typeof raw==='string' && !Number.isNaN(Date.parse(raw)) ? new Date(raw).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Not provided'
}
export function reviewState(r:StoredRecord, data:Snapshot) {
 const d=data.decisions.find(d=>d.key===recordKey(r))
 if (d) return 'Manually routed'
 if (usableText(r)) return 'Needs routing review'
 return 'Text unavailable'
}
export function metrics(data:Snapshot) {
 const total=data.records.length, calls=data.records.filter(r=>r.source_type==='call').length
 const covered=data.records.filter(usableText).length
 return {total,calls,meetings:total-calls,covered,missing:total-covered,coverage:total?covered/total*100:0,review:data.records.filter(usableText).filter(r=>!data.decisions.some(d=>d.key===recordKey(r))).length,overrides:data.decisions.length,revision2:data.records.filter(r=>r.revision>=2).length}
}
export function countsByPerson(data:Snapshot, source:'call'|'meeting') {
 const counts=new Map<string,number>()
 for(const r of data.records.filter(r=>r.source_type===source)){ const k=personOf(r); counts.set(k,(counts.get(k)||0)+1) }
 return [...counts.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name))
}
