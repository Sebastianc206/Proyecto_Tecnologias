// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [error, setError]       = useState('');
  const [exito, setExito]       = useState('');

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError(''); setExito('');
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/registro', { 
        username, 
        password,
        fecha_nacimiento: fechaNacimiento || null,
        sexo: sexo || null
      });
      setExito('¡Cuenta creada con éxito! Redirigiendo...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al conectar con el servidor.');
    }
  };

  const disabled = exito !== '';

  return (
    <div style={S.page}>
      <style>{css}</style>
      <div className="card fade-in">
        <div style={S.winBar}>
          <span style={S.dot('#f7768e')} /><span style={S.dot('#e0af68')} /><span style={S.dot('#9ece6a')} />
          <span style={S.winLabel}>tutoria — registro</span>
        </div>

        <div style={S.body}>
          <div style={S.brandRow}>
            <span style={S.brandIcon}>⟩_</span>
            <div>
              <div style={S.brandName}>TutorIA</div>
              <div style={S.brandSub}>Asistente de Programación</div>
            </div>
            <span style={S.badge}><span style={S.pulseDot} />online</span>
          </div>

          <div style={S.divider} />
          <p style={S.sectionLabel}>Crear cuenta</p>

          {error && <div style={S.alertBox('error')}>✗ &nbsp;{error}</div>}
          {exito && <div style={S.alertBox('success')}>✓ &nbsp;{exito}</div>}

          <form onSubmit={manejarRegistro} style={S.form}>
            <div style={S.field}>
              <label style={S.label}>Usuario</label>
              <div className="input-wrap-r" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <input type="text" placeholder="elige_un_nombre" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={disabled} required style={S.input} className="cmd-input" />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Contraseña</label>
              <div className="input-wrap-r" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={disabled} required style={S.input} className="cmd-input" />
              </div>
            </div>
            
            <div style={S.field}>
              <label style={S.label}>Fecha de Nacimiento</label>
              <div className="input-wrap-r" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <input type="date" value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  disabled={disabled} style={S.input} className="cmd-input" />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Sexo</label>
              <div className="input-wrap-r" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <select value={sexo} onChange={(e) => setSexo(e.target.value)} disabled={disabled} style={{...S.input, backgroundColor: 'transparent', outline: 'none', border: 'none', color: '#c0caf5'}}>
                  <option value="" style={{color: '#000'}}>Seleccionar...</option>
                  <option value="Masculino" style={{color: '#000'}}>Masculino</option>
                  <option value="Femenino" style={{color: '#000'}}>Femenino</option>
                  <option value="Otro" style={{color: '#000'}}>Otro</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={disabled} className="submit-btn-r"
              style={{ ...S.submitBtn, backgroundColor: disabled ? '#2a2c45' : '#bb9af7', color: disabled ? '#565f89' : '#1a1b2e', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              {disabled ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={S.footer}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/" style={S.link}>Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', backgroundColor:'#1a1b2e', fontFamily:"'IBM Plex Sans', sans-serif", backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(187,154,247,0.05) 0%, transparent 60%)' },
  winBar: { display:'flex', alignItems:'center', gap:'6px', padding:'10px 16px', backgroundColor:'#0f1020', borderBottom:'1px solid #2a2c45' },
  winLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#3b3d5c', marginLeft:'8px' },
  dot: (c) => ({ display:'inline-block', width:'11px', height:'11px', borderRadius:'50%', backgroundColor:c }),
  body: { padding:'30px 30px 34px' },
  brandRow: { display:'flex', alignItems:'center', gap:'14px', marginBottom:'22px' },
  brandIcon: { fontFamily:"'JetBrains Mono', monospace", fontSize:'22px', color:'#bb9af7', lineHeight:1 },
  brandName: { fontFamily:"'JetBrains Mono', monospace", fontSize:'17px', fontWeight:'600', color:'#c0caf5', lineHeight:1.2 },
  brandSub: { fontSize:'12px', color:'#565f89', marginTop:'3px' },
  badge: { marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px', fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', color:'#9ece6a', backgroundColor:'rgba(158,206,106,0.08)', border:'1px solid rgba(158,206,106,0.2)', borderRadius:'3px', padding:'3px 8px' },
  pulseDot: { width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#9ece6a', animation:'pulse-dot 2s ease-in-out infinite' },
  divider: { height:'1px', backgroundColor:'#2a2c45', marginBottom:'22px' },
  sectionLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#565f89', marginBottom:'18px', letterSpacing:'0.05em' },
  alertBox: (t) => ({ fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', color: t==='error'?'#f7768e':'#9ece6a', backgroundColor: t==='error'?'rgba(247,118,142,0.08)':'rgba(158,206,106,0.08)', border:`1px solid ${t==='error'?'rgba(247,118,142,0.2)':'rgba(158,206,106,0.2)'}`, borderRadius:'3px', padding:'10px 14px', marginBottom:'16px' }),
  form: { display:'flex', flexDirection:'column', gap:'14px' },
  field: { display:'flex', flexDirection:'column', gap:'5px' },
  label: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#565f89', letterSpacing:'0.05em' },
  inputWrap: { display:'flex', alignItems:'center', backgroundColor:'#13141f', border:'1px solid #2a2c45', borderRadius:'4px', overflow:'hidden', transition:'border-color 0.2s' },
  prefix: { fontFamily:"'JetBrains Mono', monospace", fontSize:'14px', color:'#3b3d5c', padding:'0 8px 0 12px', userSelect:'none' },
  input: { flex:1, padding:'11px 12px 11px 0', backgroundColor:'transparent', border:'none', outline:'none', fontFamily:"'JetBrains Mono', monospace", fontSize:'14px', color:'#c0caf5' },
  submitBtn: { padding:'12px', border:'none', borderRadius:'4px', fontFamily:"'JetBrains Mono', monospace", fontSize:'13px', fontWeight:'600', transition:'background-color 0.15s, transform 0.1s' },
  footer: { marginTop:'22px', fontSize:'13px', color:'#565f89', textAlign:'center' },
  link: { color:'#7dcfff', textDecoration:'none', borderBottom:'1px solid rgba(125,207,255,0.25)' },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');
  @keyframes pulse-dot { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .card { width:100%; max-width:420px; background:#16213e; border:1px solid #2a2c45; border-radius:6px; overflow:hidden; }
  .fade-in { animation: fadeSlideIn 0.35s ease; }
  .input-wrap-r:focus-within { border-color:#bb9af7 !important; box-shadow:0 0 0 2px rgba(187,154,247,0.1); }
  .submit-btn-r:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .cmd-input::placeholder { color:#3b3d5c; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
`;