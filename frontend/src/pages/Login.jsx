// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const respuesta = await axios.post('http://127.0.0.1:5000/api/auth/login', { username, password });
      localStorage.setItem('usuarioTutorIA', JSON.stringify(respuesta.data.usuario));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{css}</style>
      <div className="card fade-in">
        <div style={S.winBar}>
          <span style={S.dot('#f7768e')} /><span style={S.dot('#e0af68')} /><span style={S.dot('#9ece6a')} />
          <span style={S.winLabel}>tutoria — login</span>
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
          <p style={S.sectionLabel}>Iniciar sesión</p>

          {error && <div style={S.error}>✗ &nbsp;{error}</div>}

          <form onSubmit={manejarIngreso} style={S.form}>
            <div style={S.field}>
              <label style={S.label}>Usuario</label>
              <div className="input-wrap" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <input type="text" placeholder="nombre_usuario" value={username}
                  onChange={(e) => setUsername(e.target.value)} required
                  style={S.input} className="cmd-input" />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Contraseña</label>
              <div className="input-wrap" style={S.inputWrap}>
                <span style={S.prefix}>›</span>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  style={S.input} className="cmd-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="submit-btn"
              style={{ ...S.submitBtn, opacity: loading ? 0.65 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Autenticando...' : 'Ingresar'}
            </button>
          </form>

          <p style={S.footer}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={S.link}>Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', backgroundColor:'#1a1b2e', fontFamily:"'IBM Plex Sans', sans-serif", backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(122,162,247,0.05) 0%, transparent 60%)' },
  winBar: { display:'flex', alignItems:'center', gap:'6px', padding:'10px 16px', backgroundColor:'#0f1020', borderBottom:'1px solid #2a2c45' },
  winLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#3b3d5c', marginLeft:'8px' },
  dot: (c) => ({ display:'inline-block', width:'11px', height:'11px', borderRadius:'50%', backgroundColor:c }),
  body: { padding:'30px 30px 34px' },
  brandRow: { display:'flex', alignItems:'center', gap:'14px', marginBottom:'22px' },
  brandIcon: { fontFamily:"'JetBrains Mono', monospace", fontSize:'22px', color:'#7aa2f7', lineHeight:1 },
  brandName: { fontFamily:"'JetBrains Mono', monospace", fontSize:'17px', fontWeight:'600', color:'#c0caf5', lineHeight:1.2 },
  brandSub: { fontSize:'12px', color:'#565f89', marginTop:'3px' },
  badge: { marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px', fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', color:'#9ece6a', backgroundColor:'rgba(158,206,106,0.08)', border:'1px solid rgba(158,206,106,0.2)', borderRadius:'3px', padding:'3px 8px' },
  pulseDot: { width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#9ece6a', animation:'pulse-dot 2s ease-in-out infinite' },
  divider: { height:'1px', backgroundColor:'#2a2c45', marginBottom:'22px' },
  sectionLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#565f89', marginBottom:'18px', letterSpacing:'0.05em' },
  error: { fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', color:'#f7768e', backgroundColor:'rgba(247,118,142,0.08)', border:'1px solid rgba(247,118,142,0.2)', borderRadius:'3px', padding:'10px 14px', marginBottom:'16px' },
  form: { display:'flex', flexDirection:'column', gap:'14px' },
  field: { display:'flex', flexDirection:'column', gap:'5px' },
  label: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#565f89', letterSpacing:'0.05em' },
  inputWrap: { display:'flex', alignItems:'center', backgroundColor:'#13141f', border:'1px solid #2a2c45', borderRadius:'4px', overflow:'hidden', transition:'border-color 0.2s' },
  prefix: { fontFamily:"'JetBrains Mono', monospace", fontSize:'14px', color:'#3b3d5c', padding:'0 8px 0 12px', userSelect:'none' },
  input: { flex:1, padding:'11px 12px 11px 0', backgroundColor:'transparent', border:'none', outline:'none', fontFamily:"'JetBrains Mono', monospace", fontSize:'14px', color:'#c0caf5' },
  submitBtn: { padding:'12px', backgroundColor:'#7aa2f7', color:'#1a1b2e', border:'none', borderRadius:'4px', fontFamily:"'JetBrains Mono', monospace", fontSize:'13px', fontWeight:'600', transition:'background-color 0.15s, transform 0.1s' },
  footer: { marginTop:'22px', fontSize:'13px', color:'#565f89', textAlign:'center' },
  link: { color:'#7dcfff', textDecoration:'none', borderBottom:'1px solid rgba(125,207,255,0.25)' },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');
  @keyframes pulse-dot { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .card { width:100%; max-width:420px; background:#16213e; border:1px solid #2a2c45; border-radius:6px; overflow:hidden; }
  .fade-in { animation: fadeSlideIn 0.35s ease; }
  .input-wrap:focus-within { border-color:#7aa2f7 !important; box-shadow:0 0 0 2px rgba(122,162,247,0.1); }
  .submit-btn:hover:not(:disabled) { background-color:#89b4fa !important; transform:translateY(-1px); }
  .cmd-input::placeholder { color:#3b3d5c; }
`;