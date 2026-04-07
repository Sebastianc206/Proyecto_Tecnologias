// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
  const navigate = useNavigate();
  const feedRef  = useRef(null);

  const datosUsuario = JSON.parse(localStorage.getItem('usuarioTutorIA'));
  useEffect(() => { if (!datosUsuario) navigate('/'); }, [datosUsuario, navigate]);

  const [mensajes, setMensajes]             = useState([]);
  const [textoInput, setTextoInput]         = useState('');
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [cargando, setCargando]             = useState(false);
  const [historialChats, setHistorialChats] = useState([]);
  const [chatActualId, setChatActualId]     = useState(null);

  // --- LÓGICA DE VOZ (ESTADOS Y REFS) ---
  const [grabando, setGrabando] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [mensajes, cargando]);

  useEffect(() => {
    if (datosUsuario) { cargarPanelLateral(); iniciarNuevoChat(); }
  }, []);

  const cargarPanelLateral = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/usuario/${datosUsuario.id_usuario}`);
      setHistorialChats(res.data);
    } catch (err) { console.error('Error al cargar historial lateral:', err); }
  };

  const cargarChatEspecifico = async (id_conversacion) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/conversacion/${id_conversacion}`);
      setMensajes(res.data);
      setChatActualId(id_conversacion);
    } catch (err) { console.error('Error al cargar mensajes:', err); }
  };

  const iniciarNuevoChat = () => {
    setChatActualId(null);
    setMensajes([{ rol: 'ia', texto: `¡Hola, ${datosUsuario?.username}! Soy TutorIA. ¿Prefieres escribirme o hablarme hoy?` }]);
  };

  // --- LÓGICA DE GRABACIÓN DE VOZ ---
  const toggleGrabacion = async () => {
    if (grabando) {
      mediaRecorderRef.current.stop();
      setGrabando(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
        mediaRecorderRef.current.onstop = enviarVozAlBackend;

        mediaRecorderRef.current.start();
        setGrabando(true);
      } catch (err) {
        alert("No se pudo acceder al micrófono.");
      }
    }
  };

  const enviarVozAlBackend = async () => {
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('id_usuario', datosUsuario.id_usuario);
    if (chatActualId) formData.append('id_conversacion', chatActualId);

    setCargando(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/ia/chat-voz', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const nuevoId = response.headers.get('X-ID-Conversacion');
        const textoUserRaw = response.headers.get('X-Texto-Transcrito') || "";
        const textoIARaw = response.headers.get('X-Respuesta-IA') || "";

        const textoUser = decodeURIComponent(escape(textoUserRaw));
        const textoIA = decodeURIComponent(escape(textoIARaw));

        if (nuevoId && nuevoId !== "null") setChatActualId(nuevoId);
        
        setMensajes(prev => [
          ...prev, 
          { rol: 'user', texto: textoUser || "Audio enviado" }, 
          { rol: 'ia', texto: textoIA || "Aquí tienes mi respuesta..." }
        ]);
        
        if (!chatActualId) {
          cargarPanelLateral();
        }

        const audioBlobRes = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlobRes);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error("Error en chat de voz:", error);
      setMensajes(prev => [...prev, { rol: 'ia', texto: "Error al procesar el audio." }]);
    } finally {
      setCargando(false);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (textoInput.trim() === '') return;
    const nuevoMensajeUsuario = { rol: 'user', texto: textoInput };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setTextoInput('');
    setCargando(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/ia/chat', {
        id_usuario: datosUsuario.id_usuario,
        id_conversacion: chatActualId,
        mensaje: nuevoMensajeUsuario.texto,
      });
      setMensajes((prev) => [...prev, { rol: 'ia', texto: res.data.respuesta }]);
      if (!chatActualId) { setChatActualId(res.data.id_conversacion); cargarPanelLateral(); }
    } catch {
      setMensajes((prev) => [...prev, { rol: 'ia', texto: '✗ Error: No me pude conectar con el servidor de TutorIA.' }]);
    } finally { setCargando(false); }
  };

  // --- LÓGICA DE CIERRE DE SESIÓN CON BITÁCORA ---
  const cerrarSesion = async () => { 
    if (datosUsuario && datosUsuario.id_bitacora) {
      try {
        await axios.post('http://127.0.0.1:5000/api/auth/logout', {
          id_bitacora: datosUsuario.id_bitacora
        });
      } catch (error) {
        console.error("Error al registrar salida en bitácora", error);
      }
    }
    localStorage.removeItem('usuarioTutorIA'); 
    navigate('/'); 
  };

  if (!datosUsuario) return null;

  return (
    <div style={S.shell}>
      <style>{css}</style>

      {/* ── SIDEBAR ────────────────────────────────── */}
      <aside style={S.sidebar(sidebarAbierto)}>
        <div style={S.sidebarTop}>
          <div style={S.appBrand}>
            <span style={S.brandIcon}>⟩_</span>
            <div>
              <div style={S.brandName}>TutorIA</div>
              <div style={S.brandSub}>v1.0</div>
            </div>
            <span style={S.onlinePill}><span style={S.pulseDot} />online</span>
          </div>
          <button className="new-chat-btn" style={S.newChatBtn} onClick={iniciarNuevoChat}>
            + &nbsp;Nueva conversación
          </button>
        </div>

        <div style={S.sidebarBody}>
          <p style={S.sidebarSectionLabel}>Conversaciones</p>
          {historialChats.length === 0
            ? <p style={S.emptyHint}>Sin historial aún.</p>
            : historialChats.map((chat) => (
              <div key={chat.id_conversacion} className="chat-item"
                style={S.chatItem(chatActualId === chat.id_conversacion)}
                onClick={() => cargarChatEspecifico(chat.id_conversacion)}
                title={chat.titulo}>
                <span style={S.chatItemDot(chatActualId === chat.id_conversacion)} />
                <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{chat.titulo}</span>
              </div>
            ))
          }
        </div>

        <div style={S.sidebarFooter}>
          <span style={S.userChip}><span style={S.userAt}>@</span>{datosUsuario.username}</span>
          <button className="exit-btn" style={S.exitBtn} onClick={cerrarSesion}>Salir</button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────── */}
      <main style={S.main}>

        {/* Topbar */}
        <div style={S.topbar}>
          <button className="menu-btn" style={S.menuBtn} onClick={() => setSidebarAbierto(!sidebarAbierto)}>☰</button>
          <div style={S.topbarCenter}>
            <span style={S.topbarTitle}>TutorIA</span>
            <span style={S.topbarSep}>/</span>
            <span style={S.topbarSub}>Pensamiento Computacional & Programación</span>
          </div>
          <span style={S.readyPill}>● sys.ready</span>
        </div>

        {/* Feed */}
        <div style={S.feed} ref={feedRef}>
          {mensajes.map((msg, i) => (
            <div key={i} style={S.msgRow(msg.rol)} className="msg-row">
              {msg.rol === 'ia' && (
                <div style={S.msgInner}>
                  <div style={S.iaAvatar}>AI</div>
                  <div style={S.msgContent}>
                    <span style={S.iaLabel}>TutorIA</span>
                    <div style={S.iaText} className="msg-text">{msg.texto}</div>
                  </div>
                </div>
              )}
              {msg.rol === 'user' && (
                <div style={S.msgInner}>
                  <div style={S.userAvatar}>{datosUsuario.username.charAt(0).toUpperCase()}</div>
                  <div style={S.msgContent}>
                    <span style={S.userLabel}>{datosUsuario.username}</span>
                    <div style={S.userText}>{msg.texto}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {cargando && (
            <div style={S.msgRow('ia')} className="msg-row">
              <div style={S.msgInner}>
                <div style={S.iaAvatar}>AI</div>
                <div style={S.msgContent}>
                  <span style={S.iaLabel}>TutorIA</span>
                  <div style={S.loadingDots}>
                    <span className="ld" style={S.ldDot(0)} /><span className="ld" style={S.ldDot(1)} /><span className="ld" style={S.ldDot(2)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={S.inputArea}>
          <form onSubmit={manejarEnvio} style={S.inputForm}>
            <div className="input-bar" style={S.inputBar}>
              <span style={S.inputPrompt}>›</span>
              <input className="chat-input" type="text"
                placeholder="Escribe tu pregunta aquí..."
                value={textoInput}
                onChange={(e) => setTextoInput(e.target.value)}
                disabled={cargando} style={S.inputField} />
              
              <button 
                type="button" 
                onClick={toggleGrabacion}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 15px',
                  fontSize: '20px', color: grabando ? '#f7768e' : '#7aa2f7'
                }}>
                {grabando ? '🛑' : '🎤'}
              </button>

              <button type="submit" disabled={cargando} className="send-btn" style={S.sendBtn(cargando)}>
                {cargando ? '...' : 'Enviar ↵'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ── STYLES ─────────────────────────────────────── */
const S = {
  shell: { display:'flex', height:'100vh', backgroundColor:'#1a1b2e', fontFamily:"'IBM Plex Sans', sans-serif", color:'#c0caf5', overflow:'hidden' },
  sidebar: (o) => ({ width:o?'260px':'0px', minWidth:o?'260px':'0px', transition:'width 0.28s ease, min-width 0.28s ease', overflow:'hidden', backgroundColor:'#0f1020', borderRight:'1px solid #2a2c45', display:'flex', flexDirection:'column', whiteSpace:'nowrap' }),
  sidebarTop: { padding:'20px 16px 14px', borderBottom:'1px solid #2a2c45', display:'flex', flexDirection:'column', gap:'14px' },
  appBrand: { display:'flex', alignItems:'center', gap:'10px' },
  brandIcon: { fontFamily:"'JetBrains Mono', monospace", fontSize:'20px', color:'#7aa2f7', lineHeight:1, flexShrink:0 },
  brandName: { fontFamily:"'JetBrains Mono', monospace", fontSize:'14px', fontWeight:'600', color:'#c0caf5', lineHeight:1.2 },
  brandSub: { fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', color:'#3b3d5c', marginTop:'2px' },
  onlinePill: { marginLeft:'auto', display:'flex', alignItems:'center', gap:'5px', fontFamily:"'JetBrains Mono', monospace", fontSize:'9px', color:'#9ece6a', backgroundColor:'rgba(158,206,106,0.08)', border:'1px solid rgba(158,206,106,0.2)', borderRadius:'3px', padding:'3px 7px', flexShrink:0 },
  pulseDot: { width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#9ece6a', animation:'pulse-dot 2s ease-in-out infinite', flexShrink:0 },
  newChatBtn: { width:'100%', padding:'9px 12px', backgroundColor:'transparent', border:'1px solid #2a2c45', borderRadius:'4px', cursor:'pointer', fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', color:'#7aa2f7', textAlign:'left', transition:'background-color 0.15s, border-color 0.15s' },
  sidebarBody: { flex:1, overflowY:'auto', padding:'16px 12px' },
  sidebarSectionLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', color:'#3b3d5c', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', paddingLeft:'6px' },
  chatItem: (a) => ({ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', color: a?'#c0caf5':'#565f89', cursor:'pointer', borderRadius:'4px', marginBottom:'3px', backgroundColor: a?'#1e2035':'transparent', borderLeft: a?'2px solid #7aa2f7':'2px solid transparent', overflow:'hidden', textOverflow:'ellipsis', transition:'background-color 0.15s, color 0.15s' }),
  chatItemDot: (a) => ({ width:'5px', height:'5px', borderRadius:'50%', backgroundColor: a?'#7aa2f7':'#3b3d5c', flexShrink:0 }),
  emptyHint: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#3b3d5c', paddingLeft:'6px', fontStyle:'italic' },
  sidebarFooter: { padding:'14px 16px', borderTop:'1px solid #2a2c45', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userChip: { fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', color:'#c0caf5', display:'flex', alignItems:'center', gap:'5px' },
  userAt: { color:'#9ece6a' },
  exitBtn: { background:'none', border:'1px solid rgba(247,118,142,0.2)', borderRadius:'3px', color:'#f7768e', cursor:'pointer', fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', padding:'4px 9px', transition:'background-color 0.15s' },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  topbar: { display:'flex', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #2a2c45', backgroundColor:'#13141f', flexShrink:0, gap:'14px' },
  menuBtn: { background:'none', border:'none', color:'#565f89', cursor:'pointer', fontSize:'16px', padding:'4px 6px', borderRadius:'3px', lineHeight:1, transition:'color 0.15s', flexShrink:0 },
  topbarCenter: { display:'flex', alignItems:'center', gap:'8px', overflow:'hidden' },
  topbarTitle: { fontFamily:"'JetBrains Mono', monospace", fontSize:'13px', fontWeight:'600', color:'#7aa2f7', whiteSpace:'nowrap' },
  topbarSep: { color:'#2a2c45', fontSize:'16px' },
  topbarSub: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#3b3d5c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  readyPill: { marginLeft:'auto', fontFamily:"'JetBrains Mono', monospace", fontSize:'10px', color:'#9ece6a', backgroundColor:'rgba(158,206,106,0.08)', border:'1px solid rgba(158,206,106,0.15)', borderRadius:'3px', padding:'3px 8px', flexShrink:0 },
  feed: { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', padding:'8px 0' },
  msgRow: (rol) => ({
    display:'flex', justifyContent:'center',
    padding:'16px 24px',
    backgroundColor: rol==='ia' ? '#161728' : 'transparent',
    borderLeft: rol==='ia' ? '3px solid #7aa2f7' : '3px solid transparent',
    animation:'fadeSlideIn 0.22s ease',
  }),
  msgInner: { width:'100%', maxWidth:'800px', display:'flex', gap:'14px', alignItems:'flex-start' },
  iaAvatar: { flexShrink:0, width:'30px', height:'30px', borderRadius:'4px', backgroundColor:'rgba(122,162,247,0.15)', border:'1px solid rgba(122,162,247,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', fontWeight:'600', color:'#7aa2f7', marginTop:'2px' },
  iaLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#7aa2f7', marginBottom:'6px', display:'block', letterSpacing:'0.04em' },
  iaText: { fontSize:'15px', lineHeight:'1.8', color:'#c0caf5', fontFamily:"'IBM Plex Sans', sans-serif" },
  userAvatar: { flexShrink:0, width:'30px', height:'30px', borderRadius:'4px', backgroundColor:'rgba(187,154,247,0.12)', border:'1px solid rgba(187,154,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono', monospace", fontSize:'13px', fontWeight:'600', color:'#bb9af7', marginTop:'2px' },
  userLabel: { fontFamily:"'JetBrains Mono', monospace", fontSize:'11px', color:'#bb9af7', marginBottom:'6px', display:'block', letterSpacing:'0.04em' },
  userText: { fontSize:'15px', lineHeight:'1.75', color:'#a9b1d6', fontFamily:"'IBM Plex Sans', sans-serif" },
  msgContent: { flex:1, minWidth:0 },
  loadingDots: { display:'flex', gap:'5px', alignItems:'center', marginTop:'4px', height:'20px' },
  ldDot: (i) => ({ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#7aa2f7', animation:`pulse-dot 1.2s ease-in-out ${i*0.2}s infinite` }),
  inputArea: { padding:'14px 24px 18px', backgroundColor:'#13141f', borderTop:'1px solid #2a2c45', display:'flex', justifyContent:'center', flexShrink:0 },
  inputForm: { width:'100%', maxWidth:'800px' },
  inputBar: { display:'flex', alignItems:'center', backgroundColor:'#1e1f3b', border:'1px solid #2a2c45', borderRadius:'5px', overflow:'hidden', transition:'border-color 0.2s' },
  inputPrompt: { fontFamily:"'JetBrains Mono', monospace", fontSize:'15px', color:'#7aa2f7', padding:'0 6px 0 16px', userSelect:'none', flexShrink:0 },
  inputField: { flex:1, padding:'13px 8px', backgroundColor:'transparent', border:'none', outline:'none', fontFamily:"'IBM Plex Sans', sans-serif", fontSize:'15px', color:'#c0caf5', minWidth:0 },
  sendBtn: (d) => ({ padding:'10px 20px', margin:'6px', backgroundColor: d?'#1e2035':'#7aa2f7', color: d?'#565f89':'#1a1b2e', border:'none', borderRadius:'4px', fontFamily:"'JetBrains Mono', monospace", fontSize:'12px', fontWeight:'600', cursor: d?'not-allowed':'pointer', flexShrink:0, transition:'background-color 0.15s' }),
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  @keyframes pulse-dot { 0%,100%{opacity:.4;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2c45;border-radius:2px}

  .new-chat-btn:hover { background-color:rgba(122,162,247,0.08) !important; border-color:#7aa2f7 !important; }
  .chat-item:hover     { background-color:#1e2035 !important; color:#c0caf5 !important; }
  .exit-btn:hover      { background-color:rgba(247,118,142,0.1) !important; }
  .menu-btn:hover      { color:#c0caf5 !important; background:rgba(255,255,255,0.04); }
  .send-btn:hover:not(:disabled) { background-color:#89b4fa !important; }
  .input-bar:focus-within { border-color:#7aa2f7 !important; box-shadow:0 0 0 2px rgba(122,162,247,0.08); }
  .chat-input::placeholder { color:#3b3d5c; }

  .msg-text pre { background:#0f1020; border:1px solid #2a2c45; border-radius:4px; padding:14px 16px; overflow-x:auto; margin:10px 0; font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.65; color:#a9b1d6; }
  .msg-text code { background:#1e2035; color:#7dcfff; border-radius:3px; padding:1px 6px; font-family:'JetBrains Mono',monospace; font-size:13px; }
  .msg-text pre code { background:transparent; padding:0; color:inherit; }
`;