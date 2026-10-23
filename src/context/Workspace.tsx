import {createContext,useCallback,useContext,useEffect,useState} from 'react'
import type {ReactNode} from 'react'
import {applyImport,loadSnapshot,resetWorkspace,saveDecision} from '../lib/db'
import {emptySnapshot,validateBatch} from '../lib/data'
import type {Decision,ImportEvent,Route,Snapshot} from '../lib/data'
interface WorkspaceValue {data:Snapshot;loading:boolean;busy:boolean;error:string;importFile:(file:File)=>Promise<ImportEvent>;setRoute:(key:string,route:Route,note:string)=>Promise<void>;reset:()=>Promise<void>;reload:()=>Promise<void>}
const Context=createContext<WorkspaceValue|null>(null)
export function WorkspaceProvider({children}:{children:ReactNode}) {
 const [data,setData]=useState<Snapshot>(emptySnapshot())
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const reload=useCallback(async()=>{setData(await loadSnapshot())},[])
 useEffect(()=>{reload().catch(e=>setError(String(e))).finally(()=>setLoading(false))},[reload])
 const importFile=async(file:File)=>{
   if(busy)throw new Error('Import already running')
   setBusy(true);setError('')
   try {
     if(!file.name.toLowerCase().endsWith('.json'))throw new Error('Choose a JSON file.')
     if(file.size>20*1024*1024)throw new Error('File exceeds 20 MB import limit.')
     let raw:unknown
     try {raw=JSON.parse(await file.text())}catch{throw new Error('Invalid JSON syntax.')}
     const batch=validateBatch(raw)
     const event=await applyImport(batch,file.name)
     await reload();return event
   }catch(e){setError(e instanceof Error?e.message:String(e));throw e}finally{setBusy(false)}
 }
 const setRoute=async(key:string,route:Route,note:string)=>{setBusy(true);setError('');try{await saveDecision({key,route,note,updated_at:new Date().toISOString()} satisfies Decision);await reload()}catch(e){setError(String(e));throw e}finally{setBusy(false)}}
 const reset=async()=>{setBusy(true);setError('');try{await resetWorkspace();await reload()}catch(e){setError(String(e));throw e}finally{setBusy(false)}}
 return <Context.Provider value={{data,loading,busy,error,importFile,setRoute,reset,reload}}>{children}</Context.Provider>
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error('Missing WorkspaceProvider');return value}
