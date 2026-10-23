import type { AnalysisState, Decision, ImportEvent, Snapshot, StoredRecord } from './data'
import { emptySnapshot } from './data'
const DB_NAME = 'revenueiq-assessment-v1'
const VERSION = 1
const STORES = ['records', 'decisions', 'analyses', 'events'] as const
function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
}
export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME, VERSION)
    r.onupgradeneeded=()=>{
      const d=r.result
      if(!d.objectStoreNames.contains('records')) d.createObjectStore('records',{keyPath:'key'})
      if(!d.objectStoreNames.contains('decisions')) d.createObjectStore('decisions',{keyPath:'key'})
      if(!d.objectStoreNames.contains('analyses')) d.createObjectStore('analyses',{keyPath:'key'})
      if(!d.objectStoreNames.contains('events')) d.createObjectStore('events',{keyPath:'id',autoIncrement:true})
    }
    r.onsuccess=()=>resolve(r.result)
    r.onerror=()=>reject(r.error)
    r.onblocked=()=>reject(new Error('Database is blocked by another tab. Close other RevenueIQ tabs.'))
  })
}
function complete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error ?? new Error('Transaction aborted'));tx.onerror=()=>reject(tx.error ?? new Error('Database error'))})
}
export async function loadSnapshot(): Promise<Snapshot> {
  const db=await openDb()
  try {
    const tx=db.transaction(STORES,'readonly')
    const rs=requestValue(tx.objectStore('records').getAll()) as Promise<StoredRecord[]>
    const ds=requestValue(tx.objectStore('decisions').getAll()) as Promise<Decision[]>
    const as=requestValue(tx.objectStore('analyses').getAll()) as Promise<AnalysisState[]>
    const es=requestValue(tx.objectStore('events').getAll()) as Promise<ImportEvent[]>
    const result=await Promise.all([rs,ds,as,es])
    return {records:result[0],decisions:result[1],analyses:result[2],events:result[3].reverse()}
  } finally { db.close() }
}
export async function applyImport(batch: import('./data').Batch, filename: string): Promise<ImportEvent> {
  const {recordKey,textFingerprint}=await import('./data')
  const db=await openDb()
  try {
    const tx=db.transaction(['records','analyses','events'],'readwrite')
    const done=complete(tx)
    const records=tx.objectStore('records')
    const analyses=tx.objectStore('analyses')
    const event:ImportEvent={batch_id:batch.batch_id,filename,revision:batch.revision,imported_at:new Date().toISOString(),received:batch.records.length,inserted:0,updated:0,ignored:0,text_changed:0}
    // Requests are queued inside one IndexedDB transaction. No partial batch commits.
    for(const item of batch.records) {
      const key=recordKey(item)
      const existing=await requestValue<StoredRecord|undefined>(records.get(key))
      if(existing && existing.revision>=batch.revision) {event.ignored++;continue}
      const changed=!!existing && textFingerprint(existing)!==textFingerprint(item)
      const next:StoredRecord={...item,key,revision:batch.revision,batch_id:batch.batch_id,imported_at:event.imported_at}
      records.put(next)
      if(existing){event.updated++;if(changed)event.text_changed++} else event.inserted++
      const previousAnalysis=await requestValue<AnalysisState|undefined>(analyses.get(key))
      if (!existing || changed) analyses.put({key,revision:previousAnalysis?.revision??0,status:previousAnalysis?.status==='current' ? 'stale' : 'pending'} satisfies AnalysisState)
    }
    tx.objectStore('events').add(event)
    await done
    return event
  } finally {db.close()}
}
export async function saveDecision(decision:Decision):Promise<void>{
  const db=await openDb()
  try {const tx=db.transaction('decisions','readwrite'); const done=complete(tx);tx.objectStore('decisions').put(decision);await done}finally{db.close()}
}
export async function resetWorkspace():Promise<void>{
  const db=await openDb()
  try {const tx=db.transaction(STORES,'readwrite');const done=complete(tx);for(const store of STORES)tx.objectStore(store).clear();await done}finally{db.close()}
}
export {emptySnapshot}
