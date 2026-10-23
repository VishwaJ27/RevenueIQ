const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')
const fs=require('fs'),path=require('path'),vm=require('vm')
const base=path.resolve(__dirname,'../src/lib'),cache={}
function load(name){if(cache[name])return cache[name].exports;const code=fs.readFileSync(path.join(base,name+'.ts'),'utf8');const compiled=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};cache[name]=module;const requireLocal=(s)=>s.startsWith('.')?load(path.basename(s)):require(s);new Function('require','module','exports',compiled)(requireLocal,module,module.exports);return module.exports}
const {buildExportBundle,makeZip}=load('exporter'),{validateBatch,recordKey}=load('data')
const dataDir=process.argv[2]
if(!dataDir)throw Error('Pass dataset directory')
const initial=validateBatch(JSON.parse(fs.readFileSync(path.join(dataDir,'01_initial.json')))),update=validateBatch(JSON.parse(fs.readFileSync(path.join(dataDir,'02_update.json'))))
const records=new Map()
function apply(batch){for(const r of batch.records){const key=recordKey(r),old=records.get(key);if(!old||old.revision<batch.revision)records.set(key,{...r,key,revision:batch.revision,batch_id:batch.batch_id,imported_at:batch.exported_at})}}
apply(initial);if(records.size!==44)throw Error('Initial count')
const m07=[...records.values()].find(r=>r.record_ref==='M07');const decisions=[{key:m07.key,route:'Vendor & Procurement',updated_at:'2026-08-22T00:00:00Z',note:'Test correction'}]
apply(initial);apply(update);apply(initial)
const snapshot={records:[...records.values()],decisions,analyses:[],events:[]}
let bundle=buildExportBundle(snapshot,'2026-08-22T10:00:00Z')
const entry=bundle.manifest.entries.find(e=>e.record_ref==='M07')
if(records.size!==44||entry.applied_source_revision!==2||entry.effective_primary_route!=='Vendor & Procurement'||!entry.manual_override||bundle.manifest.usable_text_records!==18)throw Error('Replay failed')
if(entry.output_paths.some(x=>x.includes('/customer-success/')))throw Error('Obsolete route left active')
const paths=new Set(bundle.files.map(f=>f.path));for(const e of bundle.manifest.entries)for(const f of e.output_paths)if(!paths.has(f))throw Error('Missing path')
if(bundle.files.length!==paths.size)throw Error('Duplicate output')
const a=JSON.stringify(bundle.files)
const b=JSON.stringify(buildExportBundle(snapshot,'2026-08-22T10:00:00Z').files)
if(a!==b)throw Error('Nondeterministic outputs')
fs.writeFileSync('/mnt/data/phase6-test-exports.zip',Buffer.from(makeZip(bundle.files)))
console.log(JSON.stringify({records:records.size,texts:bundle.manifest.usable_text_records,files:bundle.files.length,manifest_entries:bundle.manifest.entries.length,M07:entry},null,2))
