'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError('Credenziali non valide. Riprova.');
      setLoading(false);
      return;
    }

    // Check if profile is active
    const { data: profilo } = await supabase.from('profili').select('*').eq('id', data.user.id).single();
    
    if (profilo && !profilo.attivo) {
      await supabase.auth.signOut();
      setError('Il tuo accesso è stato disattivato. Contatta Ecostudio.');
      setLoading(false);
      return;
    }

    // Redirect to main app
    window.location.href = '/';
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0B1929 0%,#1E3A5F 50%,#142744 100%)',fontFamily:"'Segoe UI',-apple-system,sans-serif",padding:16}}>
      <div style={{width:'100%',maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:28,fontWeight:900,letterSpacing:2,color:'#4ADE80'}}>ECOSTUDIO S.R.L.</div>
          <div style={{fontSize:11,color:'#94A3B8',letterSpacing:1.5,marginTop:6}}>Centro Elaborazione Dati</div>
          <div style={{fontSize:10,color:'#64748B',letterSpacing:2,marginTop:3}}>Rifiuti ~ Ambiente ~ Sicurezza</div>
        </div>

        {/* Login card */}
        <div style={{background:'#fff',borderRadius:16,padding:'32px 28px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          <h1 style={{fontSize:20,fontWeight:800,color:'#0F172A',margin:'0 0 4px',textAlign:'center'}}>Accedi al Portale</h1>
          <p style={{fontSize:13,color:'#6B7280',margin:'0 0 24px',textAlign:'center'}}>Scadenzario Sicurezza sul Lavoro</p>
          
          <div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="tuaemail@esempio.it"
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid #D1D5DB',fontSize:14,outline:'none',boxSizing:'border-box',transition:'border .2s'}}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="Inserisci password"
                style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1px solid #D1D5DB',fontSize:14,outline:'none',boxSizing:'border-box'}}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
              />
            </div>
            
            {error && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#DC2626'}}>{error}</div>}
            
            <button 
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{width:'100%',padding:'12px',background:loading?'#93C5FD':'#1E40AF',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:loading?'wait':'pointer',transition:'background .2s'}}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:10,color:'#4B6584'}}>
          ECOSTUDIO S.r.l. — Via G.B. Velluti, 100 — 62100 Macerata (MC)<br/>
          P.IVA 01387220435 — Tel 0733-280192
        </div>
      </div>
    </div>
  );
}
