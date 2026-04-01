import { useState } from "react";

const clienti = [
  { id:1, nome:"GF Costruzioni Srls", referente:"Mario Rossi", email:"info@gfcostruzioni.it", ateco:"41.20", sede:"Via Roma 10, Macerata", alertAttivi:true },
  { id:2, nome:"Parrucchiera Bella Vita", referente:"Anna Bianchi", email:"bellavita@email.it", ateco:"96.02", sede:"Via Verdi 5, Civitanova", alertAttivi:true },
  { id:3, nome:"Officina Meccanica Turbo Srl", referente:"Luca Verdi", email:"turbo@email.it", ateco:"25.62", sede:"Zona Ind. Corridonia", alertAttivi:false },
];
const lavoratori = [
  { id:1, nome:"Mario", cognome:"Rossi", mansione:"Capocantiere", cId:1, note:"Preposto" },
  { id:2, nome:"Giuseppe", cognome:"Bianchi", mansione:"Operaio edile", cId:1 },
  { id:3, nome:"Paolo", cognome:"Neri", mansione:"Gruista", cId:1, note:"Addetto PS" },
  { id:4, nome:"Francesca", cognome:"Conti", mansione:"Amministrativa", cId:1 },
  { id:5, nome:"Anna", cognome:"Bianchi", mansione:"Titolare", cId:2, note:"DL" },
  { id:6, nome:"Sara", cognome:"Marchetti", mansione:"Parrucchiera", cId:2 },
  { id:7, nome:"Luca", cognome:"Verdi", mansione:"Resp. officina", cId:3, note:"Preposto" },
  { id:8, nome:"Marco", cognome:"Santini", mansione:"Tornitore", cId:3, note:"Addetto antincendio" },
];
const oggi = new Date();
const ggDa = d => Math.ceil((new Date(d)-oggi)/864e5);
const fmt = d => new Date(d).toLocaleDateString("it-IT");
const addM = (d,m) => { const r=new Date(d); r.setMonth(r.getMonth()+m); return r.toISOString().split("T")[0]; };
const scBase = [
  {id:1,cat:"Formazione",cId:1,lId:1,desc:"Corso preposti",de:"2024-03-15",p:24,aOn:true,log:[{s:90,d:"2025-12-15"},{s:60,d:"2026-01-14"}],note:"Agg. biennale 6h"},
  {id:2,cat:"Formazione",cId:1,lId:1,desc:"Corso primo soccorso A",de:"2023-06-01",p:36,aOn:true,log:[{s:90,d:"2025-12-01"},{s:60,d:"2026-01-01"},{s:30,d:"2026-02-01"},{s:0,d:"2026-03-01"}],note:"Agg. triennale"},
  {id:3,cat:"Formazione",cId:1,lId:2,desc:"Corso lavoratori rischio alto",de:"2024-01-10",p:60,aOn:true,log:[],note:"Agg. quinquennale 6h"},
  {id:4,cat:"Formazione",cId:1,lId:3,desc:"Corso gruista",de:"2023-11-05",p:60,aOn:true,log:[],note:"Agg. quinquennale"},
  {id:5,cat:"Formazione",cId:2,lId:5,desc:"Corso DL RSPP rischio basso",de:"2024-05-10",p:60,aOn:true,log:[],note:"Nuovo obbligo ASR 2025"},
  {id:6,cat:"Formazione",cId:2,lId:6,desc:"Corso lavoratori rischio basso",de:"2024-05-10",p:60,aOn:true,log:[],note:"Agg. quinquennale 6h"},
  {id:7,cat:"Formazione",cId:3,lId:7,desc:"Corso preposti",de:"2024-06-01",p:24,aOn:true,log:[{s:90,d:"2025-12-03"}],note:"Agg. biennale 6h presenza"},
  {id:8,cat:"Formazione",cId:3,lId:8,desc:"Corso antincendio liv.2",de:"2024-03-01",p:60,aOn:true,log:[],note:"Agg. quinquennale"},
  {id:10,cat:"Verifiche Imp/Att.re/Mezzi",cId:1,desc:"Verifica messa a terra",de:"2024-01-20",p:24,aOn:true,log:[{s:90,d:"2025-10-22"},{s:60,d:"2025-11-21"},{s:30,d:"2025-12-21"},{s:0,d:"2026-01-20"}],note:"DPR 462/01"},
  {id:11,cat:"Verifiche Imp/Att.re/Mezzi",cId:1,desc:"Revisione estintori",de:"2025-12-01",p:6,aOn:true,log:[],note:"Semestrale"},
  {id:12,cat:"Verifiche Imp/Att.re/Mezzi",cId:3,desc:"Verifica carroponte",de:"2024-05-15",p:12,aOn:false,log:[],note:"Annuale"},
  {id:13,cat:"DVR",cId:1,desc:"Aggiornamento DVR",de:"2024-01-15",p:36,aOn:true,log:[],note:"Triennale o a variazione"},
  {id:14,cat:"DVR",cId:1,desc:"Valutazione rumore",de:"2024-01-15",p:48,aOn:true,log:[],note:"Quadriennale"},
  {id:15,cat:"DVR",cId:2,desc:"Aggiornamento DVR",de:"2024-05-01",p:36,aOn:true,log:[],note:"Triennale o a variazione"},
  {id:16,cat:"DVR",cId:3,desc:"Aggiornamento DVR",de:"2024-03-01",p:36,aOn:true,log:[],note:"Triennale o a variazione"},
  {id:17,cat:"Scadenze Varie",cId:1,desc:"Rinnovo DURC",de:"2025-01-15",p:4,aOn:true,log:[{s:90,d:"2026-02-14"},{s:60,d:"2026-03-04"}],note:"Ogni 120 giorni"},
  {id:18,cat:"Scadenze Varie",cId:1,desc:"Invio MUD",de:"2025-04-30",p:12,aOn:true,log:[],note:"Annuale entro 30/04"},
];
const scadenze = scBase.map(s=>{const sc=addM(s.de,s.p),g=ggDa(sc);let st="ok";if(g<0)st="scaduto";else if(g<=30)st="urgente";else if(g<=90)st="inScadenza";return{...s,scad:sc,gg:g,stato:st};});
const SC={scaduto:{l:"SCADUTO",bg:"#DC2626",t:"#fff"},urgente:{l:"URGENTE",bg:"#F59E0B",t:"#000"},inScadenza:{l:"IN SCADENZA",bg:"#EAB308",t:"#000"},ok:{l:"OK",bg:"#16A34A",t:"#fff"}};
const CC={"Formazione":"#2563EB","Verifiche Imp/Att.re/Mezzi":"#7C3AED","DVR":"#0891B2","Scadenze Varie":"#D97706"};
const CK={"Formazione":"\uD83C\uDF93","Verifiche Imp/Att.re/Mezzi":"\uD83D\uDD27","DVR":"\uD83D\uDCCB","Scadenze Varie":"\uD83D\uDCCC"};
const Badge=({stato})=><span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:SC[stato].bg,color:SC[stato].t,letterSpacing:.5,whiteSpace:"nowrap"}}>{SC[stato].l}</span>;
const CatB=({cat})=><span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:600,background:CC[cat]+"15",color:CC[cat],border:`1px solid ${CC[cat]}30`,whiteSpace:"nowrap"}}>{CK[cat]} {cat}</span>;
const Stat=({label,value,color,icon})=><div style={{background:"#fff",borderRadius:12,padding:"14px 16px",flex:1,minWidth:110,boxShadow:"0 1px 3px rgba(0,0,0,.07)",borderLeft:`4px solid ${color}`}}><div style={{fontSize:10,color:"#6B7280",fontWeight:500,marginBottom:3}}>{icon} {label}</div><div style={{fontSize:24,fontWeight:800,color}}>{value}</div></div>;
function nextA(s){const sg=[90,60,30,0],done=s.log.map(l=>l.s),nx=sg.find(x=>!done.includes(x));if(nx===undefined)return"completato";return s.gg<=nx?`${nx}gg (pronto)`:`a ${nx}gg`;}

export default function App(){
  const[pg,setPg]=useState("dash");
  const[selC,setSelC]=useState(null);
  const[selCat,setSelCat]=useState(null);
  const[lpop,setLpop]=useState(null);
  const[srch,setSrch]=useState("");
  const cnt=f=>scadenze.filter(f).length;
  const tS=cnt(s=>s.stato==="scaduto"),tU=cnt(s=>s.stato==="urgente"),tI=cnt(s=>s.stato==="inScadenza"),tO=cnt(s=>s.stato==="ok");
  const cSt=id=>{const c=scadenze.filter(s=>s.cId===id);return{s:c.filter(x=>x.stato==="scaduto").length,u:c.filter(x=>x.stato==="urgente").length,i:c.filter(x=>x.stato==="inScadenza").length,o:c.filter(x=>x.stato==="ok").length,t:c.length};};
  const cSem=id=>{const s=cSt(id);if(s.s)return"scaduto";if(s.u)return"urgente";if(s.i)return"inScadenza";return"ok";};
  const goC=c=>{setSelC(c);setPg("det");setSelCat(null);};

  const esportaBackup=()=>{
    const now=new Date().toISOString().split("T")[0];
    const sep=";";
    let csv="BACKUP SCADENZARIO ECOSTUDIO - "+now+"\n\n";
    csv+="=== CLIENTI ===\n";
    csv+=["Nome","Referente","Email","ATECO","Sede","Alert Attivi"].join(sep)+"\n";
    clienti.forEach(c=>csv+=[c.nome,c.referente,c.email,c.ateco,c.sede,c.alertAttivi?"SI":"NO"].join(sep)+"\n");
    csv+="\n=== LAVORATORI ===\n";
    csv+=["Nome","Cognome","Mansione","Cliente","Note"].join(sep)+"\n";
    lavoratori.forEach(l=>{const cl=clienti.find(c=>c.id===l.cId);csv+=[l.nome,l.cognome,l.mansione,cl?.nome||"",l.note||""].join(sep)+"\n";});
    csv+="\n=== SCADENZE ===\n";
    csv+=["Categoria","Cliente","Lavoratore","Descrizione","Data Esecuzione","Periodicita Mesi","Scadenza","Giorni","Stato","Alert On","Avvisi Inviati","Note"].join(sep)+"\n";
    scadenze.forEach(s=>{const cl=clienti.find(c=>c.id===s.cId);const lv=s.lId?lavoratori.find(l=>l.id===s.lId):null;csv+=[s.cat,cl?.nome||"",lv?`${lv.nome} ${lv.cognome}`:"",s.desc,s.de,s.p,s.scad,s.gg,SC[s.stato].l,s.aOn?"SI":"NO",s.log.map(l=>`${l.s}gg:${l.d}`).join("|"),s.note||""].join(sep)+"\n";});
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`backup_ecostudio_${now}.csv`;a.click();
    URL.revokeObjectURL(url);
  };

  return(
    <div style={{display:"flex",fontFamily:"'Segoe UI',-apple-system,sans-serif",background:"#F1F5F9",minHeight:"100vh"}}>
      {/* SIDEBAR */}
      <div style={{width:210,background:"linear-gradient(180deg,#0B1929,#142744)",color:"#fff",display:"flex",flexDirection:"column",minHeight:"100vh",flexShrink:0}}>
        <div style={{padding:"22px 16px 18px",borderBottom:"1px solid #1E3A5F",textAlign:"center"}}>
          <div style={{fontSize:19,fontWeight:900,letterSpacing:1.5,color:"#4ADE80"}}>ECOSTUDIO</div>
          <div style={{fontSize:8,color:"#94A3B8",letterSpacing:2,marginTop:3}}>SICUREZZA & AMBIENTE</div>
        </div>
        <nav style={{padding:"14px 8px",flex:1,display:"flex",flexDirection:"column",gap:2}}>
          {[{id:"dash",ic:"\uD83D\uDCCA",lb:"Dashboard"},{id:"alert",ic:"\uD83D\uDEA8",lb:"Alert"},{id:"cli",ic:"\uD83C\uDFE2",lb:"Clienti"}].map(it=>(
            <button key={it.id} onClick={()=>{setPg(it.id);setSelC(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",background:pg===it.id||(pg==="det"&&it.id==="cli")?"rgba(37,99,235,.35)":"transparent",border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:pg===it.id?700:400,textAlign:"left"}}>
              <span style={{fontSize:15}}>{it.ic}</span>{it.lb}
              {it.id==="alert"&&(tS+tU)>0&&<span style={{marginLeft:"auto",background:"#DC2626",padding:"2px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>{tS+tU}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"8px 10px"}}>
          <button onClick={esportaBackup} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"rgba(74,222,128,.15)",border:"1px solid rgba(74,222,128,.3)",color:"#4ADE80",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600}}>
            {"\uD83D\uDCBE"} Esporta Backup
          </button>
        </div>
        <div style={{padding:"14px 16px",borderTop:"1px solid #1E3A5F",fontSize:8.5,color:"#4B6584",lineHeight:1.6}}>ECOSTUDIO S.r.l.<br/>Via G.B. Velluti, 100<br/>62100 Macerata (MC)<br/>P.IVA 01387220435<br/>Tel 0733-280192</div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,padding:"24px 28px",overflowY:"auto",maxHeight:"100vh"}}>

      {pg==="dash"&&<div>
        <h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>Dashboard Scadenzario</h1>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:28}}>
          <Stat label="SCADUTI" value={tS} color="#DC2626" icon="\uD83D\uDD34"/>
          <Stat label="URGENTI" value={tU} color="#F59E0B" icon="\uD83D\uDFE0"/>
          <Stat label="IN SCADENZA" value={tI} color="#EAB308" icon="\uD83D\uDFE1"/>
          <Stat label="IN REGOLA" value={tO} color="#16A34A" icon="\uD83D\uDFE2"/>
        </div>
        <h2 style={{fontSize:15,fontWeight:700,color:"#374151",margin:"0 0 12px"}}>Clienti</h2>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clienti.map(c=>{const s=cSt(c.id),sem=cSem(c.id);return(
            <div key={c.id} onClick={()=>goC(c)} style={{background:"#fff",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[sem].bg}`}}>
              <div><div style={{fontWeight:700,fontSize:15,color:"#1F2937"}}>{c.nome}</div><div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{c.referente} \u00B7 {c.sede}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{display:"flex",gap:8,fontSize:12}}>
                  {s.s>0&&<span style={{color:"#DC2626",fontWeight:700}}>{s.s} \uD83D\uDD34</span>}
                  {s.u>0&&<span style={{color:"#F59E0B",fontWeight:700}}>{s.u} \uD83D\uDFE0</span>}
                  {s.i>0&&<span style={{color:"#EAB308",fontWeight:700}}>{s.i} \uD83D\uDFE1</span>}
                  <span style={{color:"#16A34A",fontWeight:700}}>{s.o} \uD83D\uDFE2</span>
                </div>
                <span style={{fontSize:20,color:"#CBD5E1"}}>{"\u203A"}</span>
              </div>
            </div>);})}
        </div>
      </div>}

      {pg==="alert"&&<div>
        <h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>{"\uD83D\uDEA8"} Alert</h1>
        {(()=>{const cr=scadenze.filter(s=>s.gg<=90).sort((a,b)=>a.gg-b.gg);return cr.length===0?<div style={{background:"#F0FDF4",padding:24,borderRadius:12,textAlign:"center",color:"#16A34A",fontWeight:600}}>Tutto in regola!</div>:
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{cr.map(s=>{const cl=clienti.find(c=>c.id===s.cId),lv=s.lId?lavoratori.find(l=>l.id===s.lId):null;return(
          <div key={s.id} style={{background:"#fff",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 2px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[s.stato].bg}`}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}><Badge stato={s.stato}/><CatB cat={s.cat}/>{!s.aOn&&<span style={{fontSize:10,color:"#9CA3AF"}}>{"\uD83D\uDD15"} off</span>}</div>
              <div style={{fontWeight:600,fontSize:14,color:"#1F2937"}}>{s.desc}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{cl?.nome}{lv?` \u00B7 ${lv.nome} ${lv.cognome}`:""} \u00B7 Scade: {fmt(s.scad)}</div>
            </div>
            <div style={{textAlign:"right",minWidth:85}}>
              <div style={{fontSize:24,fontWeight:800,color:SC[s.stato].bg}}>{s.gg}</div>
              <div style={{fontSize:10,color:"#9CA3AF"}}>giorni</div>
              <button onClick={()=>setLpop(s)} style={{marginTop:4,fontSize:10,color:"#2563EB",background:"none",border:"none",cursor:"pointer"}}>{"\uD83D\uDCE7"} log ({s.log.length})</button>
            </div>
          </div>);})}</div>;})()}
      </div>}

      {pg==="cli"&&<div>
        <h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:"0 0 20px"}}>{"\uD83C\uDFE2"} Clienti</h1>
        <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Cerca cliente..." style={{width:"100%",maxWidth:340,padding:"10px 14px",borderRadius:10,border:"1px solid #E5E7EB",fontSize:14,marginBottom:16,outline:"none"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clienti.filter(c=>c.nome.toLowerCase().includes(srch.toLowerCase())).map(c=>{const sem=cSem(c.id),s=cSt(c.id);return(
            <div key={c.id} onClick={()=>goC(c)} style={{background:"#fff",borderRadius:12,padding:"18px 22px",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderLeft:`5px solid ${SC[sem].bg}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,fontSize:16,color:"#1F2937"}}>{c.nome}</div><div style={{fontSize:12,color:"#6B7280",marginTop:3}}>{c.referente} \u00B7 {c.email}</div><div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{c.sede} \u00B7 ATECO {c.ateco}</div></div>
                <div style={{textAlign:"right"}}><Badge stato={sem}/><div style={{fontSize:11,color:"#9CA3AF",marginTop:6}}>{s.t} scadenze</div><div style={{fontSize:11,color:c.alertAttivi?"#16A34A":"#9CA3AF",marginTop:2}}>{c.alertAttivi?"\uD83D\uDD14 Alert attivi":"\uD83D\uDD15 Alert off"}</div></div>
              </div>
            </div>);})}
        </div>
      </div>}

      {pg==="det"&&selC&&(()=>{const c=selC,cs=scadenze.filter(s=>s.cId===c.id),s=cSt(c.id),cats=["Formazione","Verifiche Imp/Att.re/Mezzi","DVR","Scadenze Varie"],fl=selCat?cs.filter(x=>x.cat===selCat):cs,cL=lavoratori.filter(l=>l.cId===c.id);return<div>
        <button onClick={()=>{setPg("cli");setSelC(null);}} style={{background:"none",border:"none",color:"#2563EB",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:12,padding:0}}>{"\u2190"} Clienti</button>
        <div style={{background:"#fff",borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div><h1 style={{fontSize:20,fontWeight:800,color:"#0F172A",margin:"0 0 4px"}}>{c.nome}</h1><div style={{fontSize:13,color:"#6B7280"}}>{c.referente} \u00B7 {c.email} \u00B7 {c.sede}</div></div>
            <Badge stato={cSem(c.id)}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
            <Stat label="SCADUTI" value={s.s} color="#DC2626" icon="\uD83D\uDD34"/>
            <Stat label="URGENTI" value={s.u} color="#F59E0B" icon="\uD83D\uDFE0"/>
            <Stat label="IN SCADENZA" value={s.i} color="#EAB308" icon="\uD83D\uDFE1"/>
            <Stat label="OK" value={s.o} color="#16A34A" icon="\uD83D\uDFE2"/>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:"14px 20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:16}}>
          <h3 style={{fontSize:13,fontWeight:700,color:"#374151",margin:"0 0 8px"}}>{"\uD83D\uDC65"} Lavoratori ({cL.length})</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{cL.map(l=><div key={l.id} style={{background:"#F8FAFC",padding:"6px 12px",borderRadius:8,fontSize:12,border:"1px solid #E2E8F0"}}><span style={{fontWeight:600}}>{l.nome} {l.cognome}</span><span style={{color:"#6B7280"}}> \u00B7 {l.mansione}</span>{l.note&&<span style={{color:"#2563EB",fontSize:10}}> ({l.note})</span>}</div>)}</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={()=>setSelCat(null)} style={{padding:"7px 14px",borderRadius:20,border:!selCat?"2px solid #1E40AF":"1px solid #D1D5DB",background:!selCat?"#EFF6FF":"#fff",color:!selCat?"#1E40AF":"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer"}}>Tutte ({cs.length})</button>
          {cats.map(ct=>{const n=cs.filter(x=>x.cat===ct).length;if(!n)return null;return<button key={ct} onClick={()=>setSelCat(ct)} style={{padding:"7px 14px",borderRadius:20,border:selCat===ct?`2px solid ${CC[ct]}`:"1px solid #D1D5DB",background:selCat===ct?CC[ct]+"12":"#fff",color:selCat===ct?CC[ct]:"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer"}}>{CK[ct]} {ct.split("/")[0]} ({n})</button>;})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {fl.sort((a,b)=>a.gg-b.gg).map(sc=>{const lv=sc.lId?lavoratori.find(l=>l.id===sc.lId):null;return(
            <div key={sc.id} style={{background:"#fff",borderRadius:10,padding:"12px 16px",boxShadow:"0 1px 2px rgba(0,0,0,.05)",borderLeft:`5px solid ${SC[sc.stato].bg}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}><Badge stato={sc.stato}/><CatB cat={sc.cat}/>{!sc.aOn&&<span style={{fontSize:10,color:"#9CA3AF"}}>{"\uD83D\uDD15"}</span>}</div>
                <div style={{fontWeight:600,fontSize:13,color:"#1F2937"}}>{sc.desc}</div>
                <div style={{fontSize:11,color:"#6B7280",marginTop:1}}>{lv?`${lv.nome} ${lv.cognome} \u00B7 `:""}Eseguito: {fmt(sc.de)} \u00B7 Ogni {sc.p} mesi \u00B7 Scade: {fmt(sc.scad)}</div>
                {sc.note&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{sc.note}</div>}
              </div>
              <div style={{textAlign:"right",minWidth:80}}>
                <div style={{fontSize:20,fontWeight:800,color:SC[sc.stato].bg}}>{sc.gg}</div>
                <div style={{fontSize:9,color:"#9CA3AF"}}>giorni</div>
                <div style={{fontSize:9,color:"#6B7280",marginTop:3}}>Alert: {nextA(sc)}</div>
                <button onClick={()=>setLpop(sc)} style={{fontSize:9,color:"#2563EB",background:"none",border:"none",cursor:"pointer",marginTop:2}}>{"\uD83D\uDCE7"} log ({sc.log.length})</button>
              </div>
            </div>);})}
        </div>
      </div>;})()}

      </div>

      {lpop&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setLpop(null)}>
        <div style={{background:"#fff",borderRadius:12,padding:24,minWidth:280,maxWidth:360}} onClick={e=>e.stopPropagation()}>
          <h3 style={{margin:"0 0 14px",fontSize:15,color:"#1F2937"}}>{"\uD83D\uDCE7"} Log: {lpop.desc}</h3>
          {lpop.log.length===0?<p style={{color:"#9CA3AF",fontSize:13}}>Nessun avviso inviato.</p>:
          <div style={{display:"flex",flexDirection:"column",gap:6}}>{lpop.log.map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"#F3F4F6",borderRadius:8,fontSize:13}}><span style={{fontWeight:600}}>Soglia {l.s} gg</span><span style={{color:"#6B7280"}}>{fmt(l.d)}</span></div>)}</div>}
          <div style={{fontSize:11,color:"#6B7280",marginTop:10}}>Prossimo alert: <strong>{nextA(lpop)}</strong></div>
          <button onClick={()=>setLpop(null)} style={{marginTop:14,padding:"8px 20px",background:"#1E40AF",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>Chiudi</button>
        </div>
      </div>}
    </div>
  );
}
