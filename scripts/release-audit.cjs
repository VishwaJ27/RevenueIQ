/* Standalone release audit: exercises production source modules against candidate deliveries. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict')
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')
const base=path.resolve(__dirname,'../src/lib'), cache={}
function load(name){if(cache[name])return cache[name].exports;const file=path.join(base,name+'.ts'),source=fs.readFileSync(file,'utf8');const out=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});assert.equal((out.diagnostics||[]).length,0,`Syntax diagnostics: ${name}`);const module={exports:{}};cache[name]=module;new Function('require','module','exports',out.outputText)((s)=>s.startsWith('.')?load(path.basename(s)):require(s),module,module.exports);return module.exports}
const {validateBatch,recordKey,usableText}=load('data');const {allAnalyses}=load('analysis');const {buildExportBundle,makeZip}=load('exporter')
const dir=process.argv[2]||path.resolve(__dirname,'../../revenueiq_phase1/candidate/data')
const initial=validateBatch(JSON.parse(fs.readFileSync(path.join(dir,'01_initial.json'))))
const update=validateBatch(JSON.parse(fs.readFileSync(path.join(dir,'02_update.json'))))
const map=new Map();function apply(batch){let inserted=0,updated=0,ignored=0;for(const r of batch.records){const k=recordKey(r),prev=map.get(k);if(prev && prev.revision>=batch.revision){ignored++;continue}map.set(k,{...r,key:k,revision:batch.revision,batch_id:batch.batch_id,imported_at:batch.exported_at});prev?updated++:inserted++}return {inserted,updated,ignored}}
assert.deepEqual(apply(initial),{inserted:44,updated:0,ignored:0});assert.equal([...map.values()].filter(usableText).length,17)
assert.deepEqual(apply({...initial,records:[...initial.records].reverse()}),{inserted:0,updated:0,ignored:44})
const m07=[...map.values()].find(r=>r.record_ref==='M07');assert(m07)
const decisions=[{key:m07.key,route:'Vendor & Procurement',updated_at:'2026-08-22T00:00:00Z',note:'Manager override test'}]
assert.deepEqual(apply(update),{inserted:0,updated:1,ignored:0});assert.deepEqual(apply(initial),{inserted:0,updated:0,ignored:44})
assert.equal(map.size,44);assert.equal([...map.values()].filter(usableText).length,18);assert.equal(map.get(m07.key).revision,2)
const snapshot={records:[...map.values()],decisions,analyses:[],events:[]}
const analyses=allAnalyses(snapshot);assert.equal(analyses.filter(x=>x.status==='current').length,18)
for(const a of analyses.filter(x=>x.status==='current')) assert(a.evidence.length>0,`${a.recordRef} missing evidence`)
const bundle=buildExportBundle(snapshot,'2026-08-22T10:00:00.000Z')
assert.equal(bundle.manifest.entries.length,44);assert.equal(bundle.manifest.usable_text_records,18)
const entry=bundle.manifest.entries.find(x=>x.record_ref==='M07');assert.equal(entry.applied_source_revision,2);assert.equal(entry.effective_primary_route,'Vendor & Procurement');assert.equal(entry.manual_override,true)
const paths=new Set(bundle.files.map(f=>f.path));assert.equal(paths.size,bundle.files.length)
for(const e of bundle.manifest.entries)for(const p of e.output_paths)assert(paths.has(p),`Missing ${p}`)
assert(entry.output_paths.every(x=>!x.includes('/customer-success/')))
const zip=makeZip(bundle.files);assert.equal(new DataView(zip.buffer).getUint32(0,true),0x04034b50)
assert.equal(JSON.stringify(bundle.files),JSON.stringify(buildExportBundle(snapshot,'2026-08-22T10:00:00.000Z').files))
for(const file of ['src/App.tsx','src/context/Workspace.tsx',...fs.readdirSync(path.resolve(__dirname,'../src/pages')).map(x=>'src/pages/'+x)]) {const contents=fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');const out=ts.transpileModule(contents,{fileName:file,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext},reportDiagnostics:true});assert.equal(out.diagnostics.length,0,`Syntax issue in ${file}`)}
console.log(JSON.stringify({status:'PASS',uniqueRecords:map.size,usableText:18,validatedAnalyses:18,manifestEntries:bundle.manifest.entries.length,exportFiles:bundle.files.length,zipBytes:zip.length,M07revision:entry.applied_source_revision,overrideRetained:entry.manual_override,notes:'Source-module and fixture replay tests only; not a browser or npm build verification.'},null,2))
