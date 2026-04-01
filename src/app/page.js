'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CATS = ["Formazione", "Verifiche Imp/Att.re/Mezzi", "DVR", "Scadenze Varie"];
const SC = { scaduto:{l:"SCADUTO",bg:"#DC2626",t:"#fff"}, urgente:{l:"URGENTE",bg:"#F59E0B",t:"#000"}, inScadenza:{l:"IN SCADENZA",bg:"#EAB308",t:"#000"}, ok:{l:"OK",bg:"#16A34A",t:"#fff"} };
const CC = {"Formazione":"#2563EB","Verifiche Imp/Att.re/Mezzi":"#7C3AED","DVR":"#0891B2","Scadenze Varie":"#D97706"};
const CK = {"Formazione":"\uD83C\uDF93","Verifiche Imp/Att.re/Mezzi":"\uD83D\uDD27","DVR":"\uD83D\uDCCB","Scadenze Varie":"\uD83D\uDCCC"};

const oggi = new Date();
const ggDa = d => d ? Math.ceil((new Date(d) - oggi) / 864e5) : null;
const fmtD = d => d ? new Date(d).toLocaleDateString("it-IT") : "-";
const getSt = gg => { if (gg === null) return "ok"; if (gg < 0) return "scaduto"; if (gg <= 30) return "urgente"; if (gg <= 90) return "inScadenza"; return "ok"; };

const inputS = {width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #D1D5DB",fontSize:13,outline:"none",boxSizing:"border-box"};
const lblS = {fontSize:12,fontWeight:600,color:"#374151",marginBottom:4,display:"block"};
const btnP = {padding:"10px 22px",background:"#1E40AF",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700};
const btnD = {padding:"8px 16px",background:"#DC2626",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600};
const btnG = {padding:"8px 16px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600};

const Badge = ({stato}) => <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:SC[stato].bg,color:SC[stato].t,letterSpacing:.5,whiteSpace:"nowrap"}}>{SC[stato].l}</span>;
const StatC = ({label,value,color,icon}) => <div style={{background:"#fff",borderRadius:12,padding:"14px 16px",flex:1,minWidth:110,boxShadow:"0 1px 3px rgba(0,0,0,.07)",borderLeft:`4px solid ${color}`}}><div style={{fontSize:10,color:"#6B7280",fontWeight:500,marginBottom:3}}>{icon} {label}</div><div style={{fontSize:24,fontWeight:800,color}}>{value}</div></div>;
const Modal = ({title,onClose,children}) => <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={onClose}><div style={{background:"#fff",borderRadius:14,padding:"24px 28px",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h2 style={{fontSize:17,fontWeight:800,color:"#0F172A",margin:0}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9CA3AF"}}>&times;</button></div>{children}</div></div>;
const Field = ({label,children}) => <div style={{marginBottom:14}}><label style={lblS}>{label}</label>{children}</div>;
const addBtn = (label, onClick) => <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#1E40AF",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700}}>+ {label}</button>;

function enrichScad(s) { const gg = ggDa(s.data_scadenza); return { ...s, gg, stato: getSt(gg) }; }

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [clienti, setClienti] = useState([]);
  const [lavs, setLavs] = useState([]);
  const [scads, setScads] = useState([]);
  const [archivio, setArchivio] = useState([]);
  const [cons, setCons] = useState([]);
  const [fatt, setFatt] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pg, setPg] = useState("dash");
  const [selC, setSelC] = useState(null);
  const [selCat, setSelCat] = useState(null);
  const [modal, setModal] = useState(null);
  const [lpop, setLpop] = useState(null);
  const [srch, setSrch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const isAdmin = profilo?.ruolo === 'admin';
  const clienteIdFiltro = !isAdmin && profilo?.cliente_id ? profilo.cliente_id : null;

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
      if (!session) { window.location.href = '/login'; return; }
      setUser(session.user);
      supabase.from('profili').select('*').eq('id', session.user.id).single().then(({data}) => {
        if (data && !data.attivo) { supabase.auth.signOut(); window.location.href = '/login'; return; }
        setProfilo(data);
      });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) window.location.href = '/login';
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    if (!profilo) return;
    const q = clienteIdFiltro ? `.eq('cliente_id',${clienteIdFiltro})` : '';
    const [c, l, s, a, co, al, fa] = await Promise.all([
      clienteIdFiltro ? supabase.from('clienti').select('*').eq('id',clienteIdFiltro) : supabase.from('clienti').select('*').order('nome'),
      clienteIdFiltro ? supabase.from('lavoratori').select('*').eq('cliente_id',clienteIdFiltro).order('cognome') : supabase.from('lavoratori').select('*').order('cognome'),
      clienteIdFiltro ? supabase.from('scadenze').select('*').eq('cliente_id',clienteIdFiltro).order('data_scadenza') : supabase.from('scadenze').select('*').order('data_scadenza'),
      supabase.from('archivio').select('*').order('categoria,descrizione'),
      isAdmin ? supabase.from('consulenza').select('*').order('data_scadenza') : {data:[]},
      supabase.from('alert_log').select('*').order('data_invio'),
      isAdmin ? supabase.from('fatturazione').select('*').order('data_fattura') : {data:[]},
    ]);
    setClienti(c.data || []);
    setLavs(l.data || []);
    setScads((s.data || []).map(enrichScad));
    setArchivio(a.data || []);
    setCons(co.data || []);
    setAlertLogs(al.data || []);
    setFatt(fa.data || []);
    if (isAdmin) {
      const { data: profs } = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'list'}) }).then(r=>r.json());
      setProfiles(profs || []);
    }
    setLoading(false);
  }, [profilo, isAdmin, clienteIdFiltro]);

  useEffect(() => { if (profilo) loadAll(); }, [profilo, loadAll]);

  // CRUD
  const saveCliente = async (f) => {
    const d = { nome:f.nome, referente:f.referente, email:f.email, ateco:f.ateco, sede:f.sede, alert_attivi:f.alert_attivi, consulente:f.consulente, note:f.note };
    if (f.id) await supabase.from('clienti').update(d).eq('id', f.id);
    else await supabase.from('clienti').insert(d);
    await loadAll(); setModal(null); showToast("Cliente salvato!");
    if (selC?.id === f.id) { const r = await supabase.from('clienti').select('*').eq('id',f.id).single(); if(r.data) setSelC(r.data); }
  };
  const deleteCliente = async (id) => {
    await supabase.from('clienti').delete().eq('id', id);
    await loadAll(); setSelC(null); setPg("cli"); setConfirm(null); showToast("Cliente eliminato");
  };
  const saveLav = async (f) => {
    const d = { nome:f.nome, cognome:f.cognome, mansione:f.mansione, cliente_id:f.cliente_id, note:f.note };
    if (f.id) await supabase.from('lavoratori').update(d).eq('id', f.id);
    else await supabase.from('lavoratori').insert(d);
    await loadAll(); setModal(null); showToast("Lavoratore salvato!");
  };
  const deleteLav = async (id) => {
    await supabase.from('lavoratori').delete().eq('id', id);
    await loadAll(); setConfirm(null); showToast("Lavoratore eliminato");
  };
  const saveScad = async (f) => {
    const d = { categoria:f.categoria, cliente_id:f.cliente_id, lavoratore_id:f.lavoratore_id||null, descrizione:f.descrizione, data_esecuzione:f.data_esecuzione, periodicita_mesi:f.periodicita_mesi, alert_on:f.alert_on, note:f.note };
    if (f.id) await supabase.from('scadenze').update(d).eq('id', f.id);
    else await supabase.from('scadenze').insert(d);
    await loadAll(); setModal(null); showToast("Scadenza salvata!");
  };
  const deleteScad = async (id) => {
    await supabase.from('scadenze').delete().eq('id', id);
    await loadAll(); setConfirm(null); showToast("Scadenza eliminata");
  };
  const toggleAlert = async (id, current) => {
    await supabase.from('scadenze').update({ alert_on: !current }).eq('id', id);
    await loadAll();
  };
  const toggleAlertCli = async (id, current) => {
    await supabase.from('clienti').update({ alert_attivi: !current }).eq('id', id);
    await loadAll();
    if (selC?.id === id) setSelC(prev => ({...prev, alert_attivi: !current}));
  };
  const saveArch = async (f) => {
    const d = { categoria:f.categoria, descrizione:f.descrizione, periodicita_mesi:f.periodicita_mesi, note:f.note };
    if (f.id) await supabase.from('archivio').update(d).eq('id', f.id);
    else await supabase.from('archivio').insert(d);
    await loadAll(); setModal(null); showToast("Voce archivio salvata!");
  };
  const deleteArch = async (id) => { await supabase.from('archivio').delete().eq('id',id); await loadAll(); setConfirm(null); showToast("Voce eliminata"); };
  const saveCons = async (f) => {
    const d = { descrizione:f.descrizione, data_scadenza:f.data_scadenza||null, note:f.note };
    if (f.id) await supabase.from('consulenza').update(d).eq('id', f.id);
    else await supabase.from('consulenza').insert(d);
    await loadAll(); setModal(null); showToast("Nota salvata!");
  };
  const deleteCons = async (id) => { await supabase.from('consulenza').delete().eq('id',id); await loadAll(); setConfirm(null); showToast("Nota eliminata"); };
  const saveFatt = async (f) => {
    const d = { cliente_id:f.cliente_id, descrizione:f.descrizione, data_fattura:f.data_fattura||null, importo:f.importo||null, periodicita_mesi:f.periodicita_mesi||null, note:f.note };
    if (f.id) await supabase.from('fatturazione').update(d).eq('id', f.id);
    else await supabase.from('fatturazione').insert(d);
    await loadAll(); setModal(null); showToast("Fatturazione salvata!");
  };
  const deleteFatt = async (id) => { await supabase.from('fatturazione').delete().eq('id',id); await loadAll(); setConfirm(null); showToast("Voce eliminata"); };

  // User management
  const createUserAccess = async (email, password, cliente_id) => {
    const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'create',email,password,cliente_id,ruolo:'cliente'}) });
    const data = await res.json();
    if (data.error) { showToast("Errore: " + data.error); return; }
    await loadAll(); showToast("Accesso creato!");
  };
  const toggleUserAccess = async (user_id, currentlyActive) => {
    const action = currentlyActive ? 'disable' : 'enable';
    await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action,user_id}) });
    await loadAll(); showToast(currentlyActive ? "Accesso disattivato" : "Accesso riattivato");
  };
  const resetUserPassword = async (user_id, newPassword) => {
    const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'reset_password',user_id,password:newPassword}) });
    const data = await res.json();
    if (data.error) { showToast("Errore: " + data.error); return; }
    showToast("Password aggiornata!");
  };
  const deleteUserAccess = async (user_id) => {
    await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'delete',user_id}) });
    await loadAll(); setConfirm(null); showToast("Accesso eliminato");
  };
  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/login'; };

  // Stats
  const cnt = f => scads.filter(f).length;
  const tS=cnt(s=>s.stato==="scaduto"),tU=cnt(s=>s.stato==="urgente"),tI=cnt(s=>s.stato==="inScadenza"),tO=cnt(s=>s.stato==="ok");
  const cSt = id => { const c=scads.filter(s=>s.cliente_id===id); return{s:c.filter(x=>x.stato==="scaduto").length,u:c.filter(x=>x.stato==="urgente").length,i:c.filter(x=>x.stato==="inScadenza").length,o:c.filter(x=>x.stato==="ok").length,t:c.length}; };
  const cSem = id => { const s=cSt(id); if(s.s)return"scaduto"; if(s.u)return"urgente"; if(s.i)return"inScadenza"; return"ok"; };
  const goC = c => { setSelC(c); setPg("det"); setSelCat(null); };
  const scadLogs = id => alertLogs.filter(l => l.scadenza_id === id);
  const nextAl = s => { const sg=[90,60,30,0], done=scadLogs(s.id).map(l=>l.soglia_giorni), nx=sg.find(x=>!done.includes(x)); if(nx===undefined)return"completato"; return s.gg!==null&&s.gg<=nx?`${nx}gg (pronto)`:`a ${nx}gg`; };

  // Backup
  const backup = () => {
    const now=new Date().toISOString().split("T")[0]; const sep=";";
    let csv="BACKUP ECOSTUDIO - "+now+"\n\n=== CLIENTI ===\n";
    csv+=["Nome","Referente","Email","ATECO","Sede","Alert"].join(sep)+"\n";
    clienti.forEach(c=>csv+=[c.nome,c.referente||"",c.email||"",c.ateco||"",c.sede||"",c.alert_attivi?"SI":"NO"].join(sep)+"\n");
    csv+="\n=== LAVORATORI ===\n"+["Nome","Cognome","Mansione","Cliente","Note"].join(sep)+"\n";
    lavs.forEach(l=>{const cl=clienti.find(c=>c.id===l.cliente_id);csv+=[l.nome,l.cognome,l.mansione||"",cl?.nome||"",l.note||""].join(sep)+"\n";});
    csv+="\n=== SCADENZE ===\n"+["Categoria","Cliente","Lavoratore","Descrizione","Data Esec.","Mesi","Scadenza","Giorni","Stato","Alert","Note"].join(sep)+"\n";
    scads.forEach(s=>{const cl=clienti.find(c=>c.id===s.cliente_id);const lv=s.lavoratore_id?lavs.find(l=>l.id===s.lavoratore_id):null;csv+=[s.categoria,cl?.nome||"",lv?`${lv.nome} ${lv.cognome}`:"",s.descrizione,s.data_esecuzione||"",s.periodicita_mesi,s.data_scadenza||"",s.gg??"",SC[s.stato].l,s.alert_on?"SI":"NO",s.note||""].join(sep)+"\n";});
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup_ecostudio_${now}.csv`;a.click();
    showToast("Backup scaricato!");
  };

  // FORMS
  const ClienteForm = ({data}) => {
    const [f,setF]=useState(data||{nome:"",referente:"",email:"",ateco:"",sede:"",consulente:"",alert_attivi:true,note:""});
    return <div>
      <Field label="Nome Azienda *"><input style={inputS} value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></Field>
      <Field label="Referente"><input style={inputS} value={f.referente||""} onChange={e=>setF({...f,referente:e.target.value})}/></Field>
      <Field label="Email"><input style={inputS} type="email" value={f.email||""} onChange={e=>setF({...f,email:e.target.value})}/></Field>
      <div style={{display:"flex",gap:12}}><div style={{flex:1}}><Field label="ATECO"><input style={inputS} value={f.ateco||""} onChange={e=>setF({...f,ateco:e.target.value})}/></Field></div><div style={{flex:2}}><Field label="Sede"><input style={inputS} value={f.sede||""} onChange={e=>setF({...f,sede:e.target.value})}/></Field></div></div>
      <Field label="Consulente"><input style={inputS} value={f.consulente||""} onChange={e=>setF({...f,consulente:e.target.value})} placeholder="Nome del consulente responsabile"/></Field>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><input type="checkbox" checked={f.alert_attivi} onChange={e=>setF({...f,alert_attivi:e.target.checked})}/><span style={{fontSize:13}}>Alert email attivi</span></div>
      <Field label="Note"><textarea style={{...inputS,minHeight:100,resize:"vertical"}} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})} placeholder="Annotazioni, informazioni aggiuntive..."/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:f.nome?1:.5}} disabled={!f.nome} onClick={()=>saveCliente(f)}>Salva</button></div>
    </div>;
  };

  const LavForm = ({data,clienteId}) => {
    const [f,setF]=useState(data||{nome:"",cognome:"",mansione:"",cliente_id:clienteId||"",note:""});
    return <div>
      <div style={{display:"flex",gap:12}}><div style={{flex:1}}><Field label="Nome *"><input style={inputS} value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></Field></div><div style={{flex:1}}><Field label="Cognome *"><input style={inputS} value={f.cognome} onChange={e=>setF({...f,cognome:e.target.value})}/></Field></div></div>
      <Field label="Mansione"><input style={inputS} value={f.mansione||""} onChange={e=>setF({...f,mansione:e.target.value})}/></Field>
      <Field label="Cliente *"><select style={inputS} value={f.cliente_id} onChange={e=>setF({...f,cliente_id:Number(e.target.value)})}><option value="">-- Seleziona --</option>{clienti.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
      <Field label="Note"><input style={inputS} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})} placeholder="Es: Preposto, Addetto PS..."/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:(f.nome&&f.cognome&&f.cliente_id)?1:.5}} disabled={!f.nome||!f.cognome||!f.cliente_id} onClick={()=>saveLav(f)}>Salva</button></div>
    </div>;
  };

  const ScadForm = ({data,clienteId}) => {
    const [f,setF]=useState(data||{categoria:"Formazione",cliente_id:clienteId||"",lavoratore_id:null,descrizione:"",data_esecuzione:"",periodicita_mesi:60,alert_on:true,note:""});
    const [custom,setCustom]=useState(false);
    const cLavs=lavs.filter(l=>l.cliente_id===Number(f.cliente_id));
    const archCat=archivio.filter(a=>a.categoria===f.categoria);
    const onArch=val=>{if(val==="_custom"){setCustom(true);setF({...f,descrizione:""});return;}const it=archivio.find(a=>a.id===Number(val));if(it){setF({...f,descrizione:it.descrizione,periodicita_mesi:it.periodicita_mesi||f.periodicita_mesi,note:it.note||f.note});setCustom(false);}};
    return <div>
      <Field label="Categoria *"><select style={inputS} value={f.categoria} onChange={e=>setF({...f,categoria:e.target.value,descrizione:"",note:""})}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
      <Field label="Cliente *"><select style={inputS} value={f.cliente_id} onChange={e=>setF({...f,cliente_id:Number(e.target.value),lavoratore_id:null})}><option value="">-- Seleziona --</option>{clienti.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
      {f.categoria==="Formazione"&&<Field label="Lavoratore"><select style={inputS} value={f.lavoratore_id||""} onChange={e=>setF({...f,lavoratore_id:e.target.value?Number(e.target.value):null})}><option value="">-- Nessuno --</option>{cLavs.map(l=><option key={l.id} value={l.id}>{l.nome} {l.cognome}</option>)}</select></Field>}
      <Field label="Descrizione * (da Archivio o personalizzata)">
        {!data&&!custom?<div><select style={inputS} value={archCat.find(a=>a.descrizione===f.descrizione)?.id||""} onChange={e=>onArch(e.target.value)}><option value="">-- Scegli dall archivio --</option>{archCat.map(a=><option key={a.id} value={a.id}>{a.descrizione} ({a.periodicita_mesi}m)</option>)}<option value="_custom">{"\u270F"} Inserisci manualmente...</option></select>{f.descrizione&&<div style={{marginTop:4,fontSize:11,color:"#16A34A",fontWeight:600}}>Selezionato: {f.descrizione}</div>}</div>
        :<input style={inputS} value={f.descrizione} onChange={e=>setF({...f,descrizione:e.target.value})} placeholder="Scrivi descrizione..."/>}
        {custom&&<button onClick={()=>setCustom(false)} style={{fontSize:10,color:"#2563EB",background:"none",border:"none",cursor:"pointer",marginTop:4}}>Torna all archivio</button>}
      </Field>
      <div style={{display:"flex",gap:12}}><div style={{flex:1}}><Field label="Data Esecuzione *"><input style={inputS} type="date" value={f.data_esecuzione||""} onChange={e=>setF({...f,data_esecuzione:e.target.value})}/></Field></div><div style={{flex:1}}><Field label="Periodicita (mesi) *"><input style={inputS} type="number" min="1" value={f.periodicita_mesi} onChange={e=>setF({...f,periodicita_mesi:Number(e.target.value)})}/></Field></div></div>
      <Field label="Note"><input style={inputS} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})}/></Field>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><input type="checkbox" checked={f.alert_on} onChange={e=>setF({...f,alert_on:e.target.checked})}/><span style={{fontSize:13}}>Avvisi email attivi</span></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:(f.descrizione&&f.cliente_id&&f.data_esecuzione&&f.periodicita_mesi)?1:.5}} disabled={!f.descrizione||!f.cliente_id||!f.data_esecuzione||!f.periodicita_mesi} onClick={()=>saveScad(f)}>Salva</button></div>
    </div>;
  };

  const ArchForm = ({data}) => {
    const [f,setF]=useState(data||{categoria:"Formazione",descrizione:"",periodicita_mesi:0,note:""});
    return <div>
      <Field label="Categoria *"><select style={inputS} value={f.categoria} onChange={e=>setF({...f,categoria:e.target.value})}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
      <Field label="Descrizione *"><input style={inputS} value={f.descrizione} onChange={e=>setF({...f,descrizione:e.target.value})}/></Field>
      <Field label="Periodicita (mesi)"><input style={inputS} type="number" min="0" value={f.periodicita_mesi} onChange={e=>setF({...f,periodicita_mesi:Number(e.target.value)})}/></Field>
      <Field label="Note"><input style={inputS} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:f.descrizione?1:.5}} disabled={!f.descrizione} onClick={()=>saveArch(f)}>Salva</button></div>
    </div>;
  };

  const ConsForm = ({data}) => {
    const [f,setF]=useState(data||{descrizione:"",data_scadenza:"",note:""});
    return <div>
      <Field label="Descrizione *"><input style={inputS} value={f.descrizione} onChange={e=>setF({...f,descrizione:e.target.value})}/></Field>
      <Field label="Data scadenza"><input style={inputS} type="date" value={f.data_scadenza||""} onChange={e=>setF({...f,data_scadenza:e.target.value})}/></Field>
      <Field label="Note"><textarea style={{...inputS,minHeight:80}} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:f.descrizione?1:.5}} disabled={!f.descrizione} onClick={()=>saveCons(f)}>Salva</button></div>
    </div>;
  };

  const UserAccessForm = ({clienteData}) => {
    const [email,setEmail]=useState(clienteData?.email||"");
    const [pwd,setPwd]=useState("");
    return <div>
      <Field label="Email (username) *"><input style={inputS} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
      <Field label="Password *"><input style={inputS} type="text" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Minimo 6 caratteri"/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:(email&&pwd&&pwd.length>=6)?1:.5}} disabled={!email||!pwd||pwd.length<6} onClick={()=>{createUserAccess(email,pwd,clienteData.id);setModal(null);}}>Crea Accesso</button></div>
    </div>;
  };

  const ResetPwdForm = ({userId}) => {
    const [pwd,setPwd]=useState("");
    return <div>
      <Field label="Nuova Password *"><input style={inputS} type="text" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Minimo 6 caratteri"/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:(pwd&&pwd.length>=6)?1:.5}} disabled={!pwd||pwd.length<6} onClick={()=>{resetUserPassword(userId,pwd);setModal(null);}}>Aggiorna</button></div>
    </div>;
  };

  const FattForm = ({data}) => {
    const [f,setF]=useState(data||{cliente_id:"",descrizione:"",data_fattura:"",importo:"",periodicita_mesi:"",note:""});
    return <div>
      <Field label="Cliente *"><select style={inputS} value={f.cliente_id} onChange={e=>setF({...f,cliente_id:Number(e.target.value)})}><option value="">-- Seleziona --</option>{clienti.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
      <Field label="Descrizione *"><input style={inputS} value={f.descrizione} onChange={e=>setF({...f,descrizione:e.target.value})} placeholder="Es: Fattura consulenza annuale, Acconto primo semestre..."/></Field>
      <div style={{display:"flex",gap:12}}>
        <div style={{flex:1}}><Field label="Data fattura"><input style={inputS} type="date" value={f.data_fattura||""} onChange={e=>setF({...f,data_fattura:e.target.value})}/></Field></div>
        <div style={{flex:1}}><Field label="Importo EUR"><input style={inputS} type="number" min="0" step="0.01" value={f.importo||""} onChange={e=>setF({...f,importo:e.target.value?Number(e.target.value):""})}/></Field></div>
      </div>
      <Field label="Periodicita (mesi, opzionale)"><input style={inputS} type="number" min="0" value={f.periodicita_mesi||""} onChange={e=>setF({...f,periodicita_mesi:e.target.value?Number(e.target.value):""})} placeholder="Es: 12 = annuale, 6 = semestrale"/></Field>
      <Field label="Note"><textarea style={{...inputS,minHeight:60}} value={f.note||""} onChange={e=>setF({...f,note:e.target.value})}/></Field>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button style={btnG} onClick={()=>setModal(null)}>Annulla</button><button style={{...btnP,opacity:(f.descrizione&&f.cliente_id)?1:.5}} disabled={!f.descrizione||!f.cliente_id} onClick={()=>saveFatt(f)}>Salva</button></div>
    </div>;
  };

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:18,color:"#6B7280"}}>Caricamento...</div>;

  const statoBg = st => st==="scaduto"?"#FEE2E2":st==="urgente"?"#FEF3C7":st==="inScadenza"?"#FEF9C3":"#DCFCE7";
  const bdr = "1px solid #D1D5DB";
  const thS = {padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:bdr,textAlign:"center",whiteSpace:"nowrap"};
  const tdS = {padding:"7px 10px",border:bdr,fontSize:12,verticalAlign:"middle"};

  const Legenda = () => <div style={{display:"flex",gap:14,flexWrap:"wrap",padding:"10px 14px",background:"#F8FAFC",borderRadius:8,border:"1px solid #E2E8F0",marginBottom:14}}>
    <span style={{fontSize:11,fontWeight:700,color:"#374151"}}>LEGENDA:</span>
    {[["#DC2626","SCADUTO","Oltre la data"],["#F59E0B","URGENTE","Entro 30gg"],["#EAB308","IN SCADENZA","Entro 90gg"],["#16A34A","OK","Oltre 90gg"]].map(([col,lab,desc])=>
      <span key={lab} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10}}><span style={{display:"inline-block",width:12,height:12,borderRadius:3,background:col}}></span><strong style={{color:col}}>{lab}</strong><span style={{color:"#6B7280"}}>= {desc}</span></span>
    )}
  </div>;

  // Excel table renderer
  const renderTable = (items) => <div style={{overflowX:"auto",borderRadius:8,border:bdr}}>
    <table style={{borderCollapse:"collapse",width:"100%",minWidth:700}}>
      <thead><tr>
        <th style={{...thS,textAlign:"left",minWidth:200}}>Adempimento</th>
        <th style={{...thS,width:80}}>Mesi</th>
        <th style={{...thS,width:100}}>Eseguito</th>
        <th style={{...thS,width:100}}>Scadenza</th>
        <th style={{...thS,width:60}}>Giorni</th>
        <th style={{...thS,width:90}}>Stato</th>
        <th style={{...thS,width:45}}>Alert</th>
        <th style={{...thS,width:70}}>Azioni</th>
      </tr></thead>
      <tbody>
        {items.sort((a,b)=>(a.gg??9999)-(b.gg??9999)).map((sc,ri)=><tr key={sc.id} style={{background:ri%2===0?"#fff":"#F9FAFB"}}>
          <td style={{...tdS,textAlign:"left",fontWeight:600,color:"#1F2937"}}><div>{sc.descrizione}</div>{sc.note&&<div style={{fontSize:10,color:"#9CA3AF",fontWeight:400}}>{sc.note}</div>}</td>
          <td style={{...tdS,textAlign:"center",fontWeight:600}}>{sc.periodicita_mesi}</td>
          <td style={{...tdS,textAlign:"center"}}>{fmtD(sc.data_esecuzione)}</td>
          <td style={{...tdS,textAlign:"center",fontWeight:600}}>{fmtD(sc.data_scadenza)}</td>
          <td style={{...tdS,textAlign:"center",fontWeight:800,fontSize:16,color:SC[sc.stato].bg,background:statoBg(sc.stato)}}>{sc.gg??"-"}</td>
          <td style={{...tdS,textAlign:"center",background:statoBg(sc.stato)}}><Badge stato={sc.stato}/></td>
          <td style={{...tdS,textAlign:"center"}}><button onClick={()=>toggleAlert(sc.id,sc.alert_on)} style={{fontSize:14,background:"none",border:"none",cursor:"pointer"}}>{sc.alert_on?"\uD83D\uDD14":"\uD83D\uDD15"}</button></td>
          <td style={{...tdS,textAlign:"center"}}><div style={{display:"flex",gap:4,justifyContent:"center"}}>
            <button onClick={()=>setModal({type:"scad",data:sc})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#6B7280"}}>{"\u270F"}</button>
            <button onClick={()=>setLpop(sc)} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#2563EB"}}>{"\uD83D\uDCE7"}</button>
            <button onClick={()=>setConfirm({msg:`Eliminare "${sc.descrizione}"?`,action:()=>deleteScad(sc.id)})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#DC2626"}}>{"\uD83D\uDDD1"}</button>
          </div></td>
        </tr>)}
        {items.length===0&&<tr><td colSpan={8} style={{...tdS,textAlign:"center",color:"#9CA3AF",padding:20}}>Nessuna scadenza.</td></tr>}
      </tbody>
    </table>
  </div>;

  // Formazione matrix
  const renderMatrix = (cs, cL) => {
    const formS = cs.filter(x=>x.categoria==="Formazione");
    const corsi = [...new Set(formS.map(s=>s.descrizione))];
    const lavF = cL.filter(l=>formS.some(s=>s.lavoratore_id===l.id));
    if(!lavF.length||!corsi.length) return <div style={{padding:20,textAlign:"center",color:"#9CA3AF"}}>Nessun corso inserito.</div>;
    return <div style={{overflowX:"auto",borderRadius:8,border:bdr}}>
      <table style={{borderCollapse:"collapse",width:"100%",minWidth:corsi.length*140+200}}>
        <thead><tr><th style={{...thS,textAlign:"left",minWidth:190,position:"sticky",left:0,zIndex:2}}>Lavoratore</th>{corsi.map(c=><th key={c} style={{...thS,minWidth:130,fontSize:10}}>{c}</th>)}</tr></thead>
        <tbody>{lavF.map((l,ri)=><tr key={l.id}><td style={{...tdS,textAlign:"left",fontWeight:600,color:"#1F2937",background:ri%2===0?"#fff":"#F9FAFB",position:"sticky",left:0,zIndex:1,borderRight:"2px solid #94A3B8"}}><div>{l.nome} {l.cognome}</div><div style={{fontSize:9,color:"#6B7280",fontWeight:400}}>{l.mansione}{l.note?` · ${l.note}`:""}</div></td>
          {corsi.map(corso=>{const sc=formS.find(s=>s.lavoratore_id===l.id&&s.descrizione===corso);if(!sc)return<td key={corso} style={{...tdS,background:ri%2===0?"#fff":"#F9FAFB",textAlign:"center",color:"#D1D5DB"}}>{"\u2014"}</td>;return<td key={corso} style={{...tdS,background:statoBg(sc.stato),textAlign:"center",cursor:"pointer"}} onClick={()=>setModal({type:"scad",data:sc})}>
            <div style={{fontWeight:800,fontSize:16,color:SC[sc.stato].bg}}>{sc.gg}</div>
            <div style={{fontSize:9,color:"#6B7280"}}>gg | {fmtD(sc.data_scadenza)}</div>
            <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:2}}>
              <button onClick={e=>{e.stopPropagation();toggleAlert(sc.id,sc.alert_on);}} style={{fontSize:10,background:"none",border:"none",cursor:"pointer",color:sc.alert_on?"#16A34A":"#9CA3AF"}}>{sc.alert_on?"\uD83D\uDD14":"\uD83D\uDD15"}</button>
              <button onClick={e=>{e.stopPropagation();setLpop(sc);}} style={{fontSize:10,background:"none",border:"none",cursor:"pointer",color:"#2563EB"}}>{"\uD83D\uDCE7"}</button>
            </div></td>;})}
        </tr>)}</tbody>
      </table>
    </div>;
  };

  const tabBase = {padding:"10px 18px",border:"none",borderBottom:"3px solid transparent",cursor:"pointer",fontSize:13,fontWeight:600,background:"none",color:"#6B7280"};

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      {/* SIDEBAR */}
      <div style={{width:210,background:"linear-gradient(180deg,#0B1929,#142744)",color:"#fff",display:"flex",flexDirection:"column",minHeight:"100vh",flexShrink:0}}>
        <div style={{padding:"22px 16px 18px",borderBottom:"1px solid #1E3A5F",textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:900,letterSpacing:1.5,color:"#4ADE80"}}>ECOSTUDIO S.R.L.</div>
          <div style={{fontSize:8,color:"#94A3B8",letterSpacing:1,marginTop:4}}>Centro Elaborazione Dati</div>
          <div style={{fontSize:7.5,color:"#64748B",letterSpacing:1.5,marginTop:2}}>Rifiuti ~ Ambiente ~ Sicurezza</div>
        </div>
        <nav style={{padding:"14px 8px",flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {[{id:"dash",ic:"\uD83D\uDCCA",lb:"Dashboard",admin:false},{id:"alert",ic:"\uD83D\uDEA8",lb:"Alert",admin:false},{id:"cli",ic:"\uD83C\uDFE2",lb:"Clienti",admin:true},{id:"arch",ic:"\uD83D\uDCC2",lb:"Archivio",admin:true},{id:"fatt",ic:"\uD83D\uDCB6",lb:"Fatturazione",admin:true},{id:"cons",ic:"\uD83D\uDD12",lb:"Consulenza",admin:true}].filter(it=>isAdmin||!it.admin).map(it=>(
            <button key={it.id} onClick={()=>{setPg(it.id);setSelC(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:pg===it.id||(pg==="det"&&it.id==="cli")?"rgba(37,99,235,.35)":"transparent",border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:pg===it.id?700:400,textAlign:"left"}}>
              <span style={{fontSize:15}}>{it.ic}</span>{it.lb}
              {it.id==="alert"&&(tS+tU)>0&&<span style={{marginLeft:"auto",background:"#DC2626",padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>{tS+tU}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
          {isAdmin&&<button onClick={backup} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",color:"#4ADE80",borderRadius:10,cursor:"pointer",fontSize:11,fontWeight:600}}>{"\uD83D\uDCBE"} Esporta Backup</button>}
          <button onClick={logout} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",background:"rgba(248,113,113,.15)",border:"1px solid rgba(248,113,113,.3)",color:"#F87171",borderRadius:10,cursor:"pointer",fontSize:11,fontWeight:600}}>{"\uD83D\uDEAA"} Esci</button>
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #1E3A5F",fontSize:8,color:"#4B6584",lineHeight:1.6}}>ECOSTUDIO S.r.l.<br/>Via G.B. Velluti, 100<br/>62100 Macerata (MC)<br/>P.IVA 01387220435<br/>Tel 0733-280192</div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,padding:"24px 28px",overflowY:"auto",maxHeight:"100vh"}}>

        {/* DASHBOARD */}
        {pg==="dash"&&<div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>{isAdmin?"Dashboard Scadenzario":"Le tue Scadenze"}</h1>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:28}}>
            <StatC label="SCADUTI" value={tS} color="#DC2626" icon={"\uD83D\uDD34"}/><StatC label="URGENTI" value={tU} color="#F59E0B" icon={"\uD83D\uDFE0"}/><StatC label="IN SCADENZA" value={tI} color="#EAB308" icon={"\uD83D\uDFE1"}/><StatC label="IN REGOLA" value={tO} color="#16A34A" icon={"\uD83D\uDFE2"}/>
          </div>
          {isAdmin&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:15,fontWeight:700,color:"#374151",margin:0}}>Clienti</h2>{addBtn("Nuovo Cliente",()=>setModal({type:"cliente"}))}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {clienti.map(c=>{const s=cSt(c.id),sem=cSem(c.id);return<div key={c.id} onClick={()=>goC(c)} style={{background:"#fff",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[sem].bg}`}}>
                <div><div style={{fontWeight:700,fontSize:15,color:"#1F2937"}}>{c.nome}</div><div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{c.referente} · {c.sede}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:14}}><div style={{display:"flex",gap:8,fontSize:12}}>{s.s>0&&<span style={{color:"#DC2626",fontWeight:700}}>{s.s} {"\uD83D\uDD34"}</span>}{s.u>0&&<span style={{color:"#F59E0B",fontWeight:700}}>{s.u} {"\uD83D\uDFE0"}</span>}{s.i>0&&<span style={{color:"#EAB308",fontWeight:700}}>{s.i} {"\uD83D\uDFE1"}</span>}<span style={{color:"#16A34A",fontWeight:700}}>{s.o} {"\uD83D\uDFE2"}</span></div><span style={{fontSize:20,color:"#CBD5E1"}}>{"\u203A"}</span></div>
              </div>;})}
            </div>
          </div>}
          {!isAdmin&&<div>
            <Legenda/>
            {scads.sort((a,b)=>(a.gg??9999)-(b.gg??9999)).map(s=><div key={s.id} style={{background:"#fff",borderRadius:10,padding:"12px 16px",marginBottom:6,borderLeft:`5px solid ${SC[s.stato].bg}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:600,fontSize:13,color:"#1F2937"}}>{s.descrizione}</div><div style={{fontSize:11,color:"#6B7280",marginTop:1}}>{s.categoria} · Scade: {fmtD(s.data_scadenza)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:SC[s.stato].bg}}>{s.gg??"-"}</div><div style={{fontSize:9,color:"#9CA3AF"}}>giorni</div></div>
            </div>)}
          </div>}
        </div>}

        {/* ALERT */}
        {pg==="alert"&&<div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>{"\uD83D\uDEA8"} Alert</h1>
          {(()=>{const cr=scads.filter(s=>s.gg!==null&&s.gg<=90).sort((a,b)=>a.gg-b.gg);return!cr.length?<div style={{background:"#F0FDF4",padding:24,borderRadius:12,textAlign:"center",color:"#16A34A",fontWeight:600}}>Tutto in regola!</div>:
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{cr.map(s=>{const cl=clienti.find(c=>c.id===s.cliente_id),lv=s.lavoratore_id?lavs.find(l=>l.id===s.lavoratore_id):null;return<div key={s.id} style={{background:"#fff",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 2px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[s.stato].bg}`}}>
            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}><Badge stato={s.stato}/>{!s.alert_on&&<span style={{fontSize:10,color:"#9CA3AF"}}>{"\uD83D\uDD15"} off</span>}</div><div style={{fontWeight:600,fontSize:14,color:"#1F2937"}}>{s.descrizione}</div><div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{cl?.nome}{lv?` · ${lv.nome} ${lv.cognome}`:""} · Scade: {fmtD(s.data_scadenza)}</div></div>
            <div style={{textAlign:"right",minWidth:85}}><div style={{fontSize:24,fontWeight:800,color:SC[s.stato].bg}}>{s.gg}</div><div style={{fontSize:10,color:"#9CA3AF"}}>giorni</div></div>
          </div>;})}</div>;})()}
        </div>}

        {/* CLIENTI */}
        {pg==="cli"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:0}}>{"\uD83C\uDFE2"} Clienti</h1>{addBtn("Nuovo Cliente",()=>setModal({type:"cliente"}))}</div>
          <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Cerca cliente..." style={{...inputS,maxWidth:340,marginBottom:16}}/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {clienti.filter(c=>c.nome.toLowerCase().includes(srch.toLowerCase())).map(c=>{const sem=cSem(c.id),s=cSt(c.id);return<div key={c.id} onClick={()=>goC(c)} style={{background:"#fff",borderRadius:12,padding:"18px 22px",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[sem].bg}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:16,color:"#1F2937"}}>{c.nome}</div><div style={{fontSize:12,color:"#6B7280",marginTop:3}}>{c.referente} · {c.email}</div><div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{c.sede}</div></div><div style={{textAlign:"right"}}><Badge stato={sem}/><div style={{fontSize:11,color:"#9CA3AF",marginTop:6}}>{s.t} scadenze</div></div></div>
            </div>;})}
          </div>
        </div>}

        {/* DETTAGLIO CLIENTE */}
        {pg==="det"&&selC&&(()=>{const c=selC,cs=scads.filter(s=>s.cliente_id===c.id),s=cSt(c.id),cL=lavs.filter(l=>l.cliente_id===c.id),at=selCat||"Formazione",tabS=cs.filter(x=>x.categoria===at);return<div>
          <button onClick={()=>{setPg("cli");setSelC(null);}} style={{background:"none",border:"none",color:"#2563EB",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:12,padding:0}}>{"\u2190"} Clienti</button>
          <div style={{background:"#fff",borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
              <div><h1 style={{fontSize:20,fontWeight:800,color:"#0F172A",margin:"0 0 4px"}}>{c.nome}</h1><div style={{fontSize:13,color:"#6B7280"}}>{c.referente} · {c.email} · {c.sede}{c.consulente&&<span style={{color:"#2563EB",fontWeight:600}}> · Consulente: {c.consulente}</span>}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Badge stato={cSem(c.id)}/><button onClick={()=>setModal({type:"cliente",data:c})} style={{...btnG,fontSize:11,padding:"6px 12px"}}>{"\u270F"}</button><button onClick={()=>setConfirm({msg:`Eliminare ${c.nome}?`,action:()=>deleteCliente(c.id)})} style={{...btnD,fontSize:11,padding:"6px 12px"}}>{"\uD83D\uDDD1"}</button></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}><span style={{fontSize:12,color:c.alert_attivi?"#16A34A":"#9CA3AF",fontWeight:600}}>{c.alert_attivi?"\uD83D\uDD14 Alert attivi":"\uD83D\uDD15 Alert off"}</span><button onClick={()=>toggleAlertCli(c.id,c.alert_attivi)} style={{fontSize:11,color:"#2563EB",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>{c.alert_attivi?"Disattiva":"Attiva"}</button></div>
            <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}><StatC label="SCADUTI" value={s.s} color="#DC2626" icon={"\uD83D\uDD34"}/><StatC label="URGENTI" value={s.u} color="#F59E0B" icon={"\uD83D\uDFE0"}/><StatC label="IN SCADENZA" value={s.i} color="#EAB308" icon={"\uD83D\uDFE1"}/><StatC label="OK" value={s.o} color="#16A34A" icon={"\uD83D\uDFE2"}/></div>
          </div>
          {isAdmin&&(()=>{const cp=profiles.find(p=>p.cliente_id===c.id&&p.ruolo==='cliente');return<div style={{background:"#fff",borderRadius:12,padding:"14px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:16}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"#374151",margin:"0 0 10px"}}>{"\uD83D\uDD11"} Accesso Portale Cliente</h3>
            {cp?<div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:12}}>{"\uD83D\uDCE7"} {cp.email}</span>
                <span style={{fontSize:11,fontWeight:700,color:cp.attivo?"#16A34A":"#DC2626",background:cp.attivo?"#DCFCE7":"#FEE2E2",padding:"2px 10px",borderRadius:12}}>{cp.attivo?"ATTIVO":"DISATTIVATO"}</span>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                <button onClick={()=>toggleUserAccess(cp.id,cp.attivo)} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:cp.attivo?"#FEE2E2":"#DCFCE7",color:cp.attivo?"#DC2626":"#16A34A"}}>{cp.attivo?"Disattiva accesso":"Riattiva accesso"}</button>
                <button onClick={()=>setModal({type:"resetpwd",userId:cp.id})} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"1px solid #D1D5DB",borderRadius:8,cursor:"pointer",background:"#fff",color:"#374151"}}>Reset password</button>
                <button onClick={()=>setConfirm({msg:"Eliminare completamente l'accesso?",action:()=>deleteUserAccess(cp.id)})} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:"#FEE2E2",color:"#DC2626"}}>Elimina accesso</button>
              </div>
            </div>:<div>
              <p style={{fontSize:12,color:"#9CA3AF",marginBottom:10}}>Nessun accesso configurato per questo cliente.</p>
              <button onClick={()=>setModal({type:"useraccess",clienteData:c})} style={{...btnP,fontSize:12,padding:"8px 16px"}}>+ Crea accesso cliente</button>
            </div>}
          </div>;})()}
          <Legenda/>
          <div style={{background:"#fff",borderRadius:"12px 12px 0 0",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{display:"flex",borderBottom:"2px solid #E5E7EB",padding:"0 8px",overflowX:"auto"}}>
              {CATS.map(cat=>{const n=cs.filter(x=>x.categoria===cat).length,active=at===cat;return<button key={cat} onClick={()=>setSelCat(cat)} style={{...tabBase,color:active?CC[cat]:"#6B7280",borderBottomColor:active?CC[cat]:"transparent",fontWeight:active?700:500,background:active?"#FAFAFA":"transparent"}}>{CK[cat]} {cat.split("/")[0]} ({n})</button>;})}
            </div>
            <div style={{padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:700,color:CC[at],margin:0}}>{CK[at]} {at}</h3>
                <div style={{display:"flex",gap:8}}>{at==="Formazione"&&addBtn("Lavoratore",()=>setModal({type:"lav",clienteId:c.id}))}{addBtn("Scadenza",()=>setModal({type:"scad",clienteId:c.id}))}</div>
              </div>
              {at==="Formazione"&&<div>{renderMatrix(cs,cL)}
                <div style={{marginTop:14,padding:"10px 14px",background:"#F8FAFC",borderRadius:8,border:"1px solid #E2E8F0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{"\uD83D\uDC65"} Lavoratori ({cL.length})</span>{addBtn("Lavoratore",()=>setModal({type:"lav",clienteId:c.id}))}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{cL.map(l=><div key={l.id} style={{background:"#fff",padding:"4px 10px",borderRadius:6,fontSize:11,border:"1px solid #E2E8F0",display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600}}>{l.nome} {l.cognome}</span><button onClick={()=>setModal({type:"lav",data:l})} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#9CA3AF"}}>{"\u270F"}</button><button onClick={()=>setConfirm({msg:`Eliminare ${l.nome} ${l.cognome}?`,action:()=>deleteLav(l.id)})} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#DC2626"}}>{"\u00D7"}</button></div>)}</div>
                </div>
              </div>}
              {at!=="Formazione"&&renderTable(tabS)}
            </div>
          </div>
        </div>;})()}

        {/* ARCHIVIO */}
        {pg==="arch"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:0}}>{"\uD83D\uDCC2"} Archivio</h1>{addBtn("Nuova Voce",()=>setModal({type:"arch"}))}</div>
          <p style={{fontSize:13,color:"#6B7280",marginBottom:16}}>Catalogo adempimenti predefiniti. Compare nel menu a tendina quando aggiungi scadenze.</p>
          {CATS.map(cat=>{const items=archivio.filter(a=>a.categoria===cat);if(!items.length)return null;return<div key={cat} style={{marginBottom:20}}>
            <h2 style={{fontSize:15,fontWeight:700,color:CC[cat],margin:"0 0 10px"}}>{CK[cat]} {cat} ({items.length})</h2>
            <div style={{overflowX:"auto",borderRadius:8,border:bdr}}><table style={{borderCollapse:"collapse",width:"100%"}}><thead><tr><th style={{...thS,textAlign:"left"}}>Descrizione</th><th style={{...thS,width:80}}>Mesi</th><th style={{...thS,textAlign:"left"}}>Note</th><th style={{...thS,width:70}}>Azioni</th></tr></thead><tbody>{items.map((a,i)=><tr key={a.id} style={{background:i%2===0?"#fff":"#F9FAFB"}}><td style={{...tdS,fontWeight:600}}>{a.descrizione}</td><td style={{...tdS,textAlign:"center",fontWeight:700}}>{a.periodicita_mesi||"-"}</td><td style={{...tdS,color:"#6B7280"}}>{a.note||""}</td><td style={{...tdS,textAlign:"center"}}><button onClick={()=>setModal({type:"arch",data:a})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#6B7280"}}>{"\u270F"}</button><button onClick={()=>setConfirm({msg:`Eliminare "${a.descrizione}"?`,action:()=>deleteArch(a.id)})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#DC2626"}}>{"\uD83D\uDDD1"}</button></td></tr>)}</tbody></table></div>
          </div>;})}
        </div>}

        {/* CONSULENZA */}
        {pg==="cons"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:0}}>{"\uD83D\uDD12"} Consulenza</h1>{addBtn("Nuova Nota",()=>setModal({type:"cons"}))}</div>
          <div style={{background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#92400E"}}>{"\uD83D\uDD12"} Sezione privata — non visibile ai clienti.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cons.sort((a,b)=>{if(!a.data_scadenza)return 1;if(!b.data_scadenza)return -1;return new Date(a.data_scadenza)-new Date(b.data_scadenza);}).map(c=>{const gg=ggDa(c.data_scadenza),stato=getSt(gg);return<div key={c.id} style={{background:"#fff",borderRadius:10,padding:"14px 18px",border:"1px solid #E5E7EB",borderLeft:`5px solid ${SC[stato].bg}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:"#1F2937"}}>{c.descrizione}</div>{c.data_scadenza&&<div style={{fontSize:12,color:"#6B7280",marginTop:2}}>Scadenza: {fmtD(c.data_scadenza)} {gg!==null&&<span style={{fontWeight:700,color:SC[stato].bg}}>({gg}gg)</span>}</div>}{c.note&&<div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{c.note}</div>}</div>
              <div style={{display:"flex",gap:6}}><button onClick={()=>setModal({type:"cons",data:c})} style={{fontSize:13,background:"none",border:"none",cursor:"pointer",color:"#6B7280"}}>{"\u270F"}</button><button onClick={()=>setConfirm({msg:`Eliminare "${c.descrizione}"?`,action:()=>deleteCons(c.id)})} style={{fontSize:13,background:"none",border:"none",cursor:"pointer",color:"#DC2626"}}>{"\uD83D\uDDD1"}</button></div>
            </div>;})}
            {!cons.length&&<div style={{padding:20,textAlign:"center",color:"#9CA3AF"}}>Nessuna nota.</div>}
          </div>
        </div>}

        {/* FATTURAZIONE */}
        {pg==="fatt"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:0}}>{"\uD83D\uDCB6"} Fatturazione</h1>{addBtn("Nuova Voce",()=>setModal({type:"fatt"}))}</div>
          <div style={{background:"#FEF3C7",border:"1px solid #F59E0B",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#92400E"}}>{"\uD83D\uDD12"} Sezione privata — non visibile ai clienti. Non incide sui semafori delle scadenze.</div>
          {(()=>{const grouped={};fatt.forEach(f=>{const cName=clienti.find(c=>c.id===f.cliente_id)?.nome||"Senza cliente";if(!grouped[cName])grouped[cName]=[];grouped[cName].push(f);});const keys=Object.keys(grouped).sort();return!keys.length?<div style={{padding:20,textAlign:"center",color:"#9CA3AF"}}>Nessuna voce di fatturazione.</div>:keys.map(k=><div key={k} style={{marginBottom:20}}>
            <h2 style={{fontSize:15,fontWeight:700,color:"#374151",margin:"0 0 10px"}}>{"\uD83C\uDFE2"} {k}</h2>
            <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #D1D5DB"}}><table style={{borderCollapse:"collapse",width:"100%",minWidth:600}}>
              <thead><tr>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"left"}}>Descrizione</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:100}}>Data</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:90}}>Importo</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:70}}>Mesi</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:70}}>Giorni</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:90}}>Stato</th>
                <th style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#fff",background:"#1E3A5F",border:"1px solid #D1D5DB",textAlign:"center",width:70}}>Azioni</th>
              </tr></thead>
              <tbody>{grouped[k].sort((a,b)=>{if(!a.data_fattura)return 1;if(!b.data_fattura)return -1;return new Date(a.data_fattura)-new Date(b.data_fattura);}).map((f,i)=>{const gg=ggDa(f.data_fattura),stato=getSt(gg),sbg=stato==="scaduto"?"#FEE2E2":stato==="urgente"?"#FEF3C7":stato==="inScadenza"?"#FEF9C3":"#DCFCE7";return<tr key={f.id} style={{background:i%2===0?"#fff":"#F9FAFB"}}>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",fontSize:12,fontWeight:600}}><div>{f.descrizione}</div>{f.note&&<div style={{fontSize:10,color:"#9CA3AF",fontWeight:400}}>{f.note}</div>}</td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",fontSize:12,textAlign:"center"}}>{fmtD(f.data_fattura)}</td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",fontSize:12,textAlign:"center",fontWeight:600}}>{f.importo?`${f.importo.toLocaleString("it-IT")} \u20AC`:"-"}</td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",fontSize:12,textAlign:"center"}}>{f.periodicita_mesi||"-"}</td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",fontSize:16,textAlign:"center",fontWeight:800,color:SC[stato].bg,background:sbg}}>{gg??"-"}</td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",textAlign:"center",background:sbg}}><Badge stato={stato}/></td>
                <td style={{padding:"7px 10px",border:"1px solid #E5E7EB",textAlign:"center"}}><button onClick={()=>setModal({type:"fatt",data:f})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#6B7280"}}>{"\u270F"}</button><button onClick={()=>setConfirm({msg:`Eliminare "${f.descrizione}"?`,action:()=>deleteFatt(f.id)})} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:"#DC2626"}}>{"\uD83D\uDDD1"}</button></td>
              </tr>;})}</tbody>
            </table></div>
          </div>);})()}
        </div>}

      </div>

      {/* MODALS */}
      {modal?.type==="cliente"&&<Modal title={modal.data?"Modifica Cliente":"Nuovo Cliente"} onClose={()=>setModal(null)}><ClienteForm data={modal.data}/></Modal>}
      {modal?.type==="lav"&&<Modal title={modal.data?"Modifica Lavoratore":"Nuovo Lavoratore"} onClose={()=>setModal(null)}><LavForm data={modal.data} clienteId={modal.clienteId}/></Modal>}
      {modal?.type==="scad"&&<Modal title={modal.data?"Modifica Scadenza":"Nuova Scadenza"} onClose={()=>setModal(null)}><ScadForm data={modal.data} clienteId={modal.clienteId}/></Modal>}
      {modal?.type==="arch"&&<Modal title={modal.data?"Modifica Voce":"Nuova Voce Archivio"} onClose={()=>setModal(null)}><ArchForm data={modal.data}/></Modal>}
      {modal?.type==="fatt"&&<Modal title={modal.data?"Modifica Fatturazione":"Nuova Fatturazione"} onClose={()=>setModal(null)}><FattForm data={modal.data}/></Modal>}
      {modal?.type==="cons"&&<Modal title={modal.data?"Modifica Nota":"Nuova Nota"} onClose={()=>setModal(null)}><ConsForm data={modal.data}/></Modal>}
      {modal?.type==="useraccess"&&<Modal title="Crea Accesso Cliente" onClose={()=>setModal(null)}><UserAccessForm clienteData={modal.clienteData}/></Modal>}
      {modal?.type==="resetpwd"&&<Modal title="Reset Password" onClose={()=>setModal(null)}><ResetPwdForm userId={modal.userId}/></Modal>}

      {lpop&&<Modal title={`\uD83D\uDCE7 Log: ${lpop.descrizione}`} onClose={()=>setLpop(null)}>
        {(()=>{const logs=scadLogs(lpop.id);return!logs.length?<p style={{color:"#9CA3AF",fontSize:13}}>Nessun avviso inviato.</p>:<div style={{display:"flex",flexDirection:"column",gap:6}}>{logs.map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"#F3F4F6",borderRadius:8,fontSize:13}}><span style={{fontWeight:600}}>Soglia {l.soglia_giorni}gg</span><span style={{color:"#6B7280"}}>{fmtD(l.data_invio)}</span></div>)}</div>;})()}
        <div style={{fontSize:11,color:"#6B7280",marginTop:10}}>Prossimo alert: <strong>{nextAl(lpop)}</strong></div>
      </Modal>}

      {confirm&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={()=>setConfirm(null)}><div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:380,textAlign:"center"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:36,marginBottom:10}}>{"\u26A0\uFE0F"}</div><p style={{fontSize:14,color:"#374151",margin:"0 0 20px"}}>{confirm.msg}</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button style={btnG} onClick={()=>setConfirm(null)}>Annulla</button><button style={btnD} onClick={confirm.action}>Conferma</button></div></div></div>}

      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0F172A",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:400,boxShadow:"0 4px 12px rgba(0,0,0,.2)"}}>{toast}</div>}
    </div>
  );
}
