export type SourceType = 'call' | 'meeting'
export type Route = 'Sales & Opportunity' | 'Partnerships' | 'Customer Success' | 'Vendor & Procurement' | 'Internal Operations' | 'Outreach & Coaching' | 'Needs Review'
export const ROUTES: Route[] = ['Sales & Opportunity', 'Partnerships', 'Customer Success', 'Vendor & Procurement', 'Internal Operations', 'Outreach & Coaching', 'Needs Review']
export type JsonObject = Record<string, unknown>
export interface InputRecord { record_ref: string; source_type: SourceType; source_id: string; payload: JsonObject; transcript_payload: JsonObject | null }
export interface Batch { batch_id: string; revision: number; exported_at: string; records: InputRecord[] }
export interface StoredRecord extends InputRecord { key: string; revision: number; batch_id: string; imported_at: string }
export interface Decision { key: string; route: Route; updated_at: string; note: string }
export interface AnalysisState { key: string; revision: number; status: 'pending' | 'current' | 'stale' }
export interface ImportEvent { id?: number; batch_id: string; filename: string; revision: number; imported_at: string; received: number; inserted: number; updated: number; ignored: number; text_changed: number }
export interface Snapshot { records: StoredRecord[]; decisions: Decision[]; analyses: AnalysisState[]; events: ImportEvent[] }
export const emptySnapshot = (): Snapshot => ({ records: [], decisions: [], analyses: [], events: [] })
export const recordKey = (v: {source_type:SourceType;source_id:string}) => `${v.source_type}:${v.source_id}`
export function usableText(r: Pick<InputRecord,'source_type'|'payload'|'transcript_payload'>): boolean {
  if (r.source_type === 'call') return typeof r.payload.transcript === 'string' && r.payload.transcript.trim().length > 0
  const turns = r.transcript_payload?.turns
  return Array.isArray(turns) && turns.some(t => !!t && typeof t === 'object' && typeof (t as JsonObject).text === 'string' && ((t as JsonObject).text as string).trim().length > 0)
}
export function textFingerprint(r: Pick<InputRecord,'source_type'|'payload'|'transcript_payload'>): string {
  return r.source_type === 'call' ? JSON.stringify(r.payload.transcript ?? null) : JSON.stringify(r.transcript_payload?.turns ?? null)
}
function obj(v: unknown): v is JsonObject { return !!v && typeof v === 'object' && !Array.isArray(v) }
export function validateBatch(raw: unknown): Batch {
  if (!obj(raw)) throw new Error('Root must be a JSON object.')
  if (typeof raw.batch_id !== 'string' || !raw.batch_id.trim()) throw new Error('Missing batch_id.')
  if (!Number.isSafeInteger(raw.revision) || (raw.revision as number) < 1) throw new Error('revision must be a positive integer.')
  if (typeof raw.exported_at !== 'string' || Number.isNaN(Date.parse(raw.exported_at))) throw new Error('Invalid exported_at timestamp.')
  if (!Array.isArray(raw.records) || raw.records.length === 0) throw new Error('records must be a non-empty array.')
  const seen = new Set<string>()
  for (const [i, value] of raw.records.entries()) {
    const r = value as InputRecord
    if (!obj(r) || (r.source_type !== 'call' && r.source_type !== 'meeting')) throw new Error(`Record ${i+1}: invalid source_type.`)
    if (typeof r.source_id !== 'string' || !r.source_id.trim()) throw new Error(`Record ${i+1}: missing source_id.`)
    if (typeof r.record_ref !== 'string' || !r.record_ref.trim()) throw new Error(`Record ${i+1}: missing record_ref.`)
    if (!obj(r.payload) || r.payload.id !== r.source_id) throw new Error(`Record ${i+1}: payload.id must equal source_id.`)
    if (r.transcript_payload !== null && !obj(r.transcript_payload)) throw new Error(`Record ${i+1}: transcript_payload must be an object or null.`)
    if (r.source_type === 'call' && r.transcript_payload !== null) throw new Error(`Record ${i+1}: calls must have a null transcript_payload.`)
    if (r.source_type === 'meeting' && r.transcript_payload && r.transcript_payload.meeting_id !== r.source_id) throw new Error(`Record ${i+1}: transcript meeting_id does not match source_id.`)
    if (r.source_type === 'meeting' && r.transcript_payload && !Array.isArray(r.transcript_payload.turns)) throw new Error(`Record ${i+1}: meeting turns must be an array.`)
    const key = recordKey(r)
    if (seen.has(key)) throw new Error(`Duplicate identity within delivery: ${key}. No changes applied.`)
    seen.add(key)
  }
  return raw as unknown as Batch
}
