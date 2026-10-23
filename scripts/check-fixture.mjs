// Run locally with: node scripts/check-fixture.mjs "C:/path/to/candidate/data"
// Read-only: confirms aggregate replay expectations and evidence phrases.
import fs from 'node:fs'
import path from 'node:path'
const directory=process.argv[2]
if (!directory) {console.error('Usage: node scripts/check-fixture.mjs <folder-containing-01_initial.json-and-02_update.json>');process.exit(2)}
const initial=JSON.parse(fs.readFileSync(path.join(directory,'01_initial.json'),'utf8'))
const update=JSON.parse(fs.readFileSync(path.join(directory,'02_update.json'),'utf8'))
const id=r=>`${r.source_type}:${r.source_id}`
const map=new Map()
function apply(batch){for(const r of batch.records){const key=id(r); if(!map.has(key)||map.get(key).revision<batch.revision)map.set(key,{...r,revision:batch.revision})}}
function hasText(r){if(r.source_type==='call')return typeof r.payload.transcript==='string'&&r.payload.transcript.trim().length>0;return Array.isArray(r.transcript_payload?.turns)&&r.transcript_payload.turns.some(t=>typeof t.text==='string'&&t.text.trim())}
const check=(name,got,expected)=>{const ok=got===expected; console.log(`${ok?'PASS':'FAIL'} ${name}: ${got} (expected ${expected})`);if(!ok)process.exitCode=1}
apply(initial);check('Initial records',map.size,44);check('Initial usable texts',[...map.values()].filter(hasText).length,17)
apply({...initial,records:[...initial.records].reverse()});check('Reordered duplicate count',map.size,44)
apply(update);check('Updated records',map.size,44);check('Updated usable texts',[...map.values()].filter(hasText).length,18)
apply(initial);check('Older revision replay',map.size,44)
const m07=[...map.values()].find(r=>r.record_ref==='M07');check('M07 current revision',m07?.revision,2)
console.log('Note: Persistent manual route override must additionally be tested in the browser.')
