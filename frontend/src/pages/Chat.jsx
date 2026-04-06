import { useState, useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
  const navigate = useNavigate();
  const datosUsuario = JSON.parse(localStorage.getItem('usuarioTutorIA'));

  // --- MEMORIA DEL COMPONENTE ---
  const [mensajes, setMensajes] = useState([]);
  const [textoInput, setTextoInput] = useState('');
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [historialChats, setHistorialChats] = useState([]); 
  const [chatActualId, setChatActualId] = useState(null);

  // --- NUEVA MEMORIA PARA VOZ ---
  const [grabando, setGrabando] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!datosUsuario) navigate('/');
    else {
      cargarPanelLateral();
      iniciarNuevoChat();
    }
  }, []);

  // --- FUNCIONES DE BASE DE DATOS ---
  const cargarPanelLateral = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/usuario/${datosUsuario.id_usuario}`);
      setHistorialChats(res.data);
    } catch (error) { console.error(error); }
  };

  const cargarChatEspecifico = async (id_conversacion) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/conversacion/${id_conversacion}`);
      setMensajes(res.data);
      setChatActualId(id_conversacion);
    } catch (error) { console.error(error); }
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
        // 1. Extraer datos de los Headers
        const nuevoId = response.headers.get('X-ID-Conversacion');
        
        // Decodificamos el texto. Usamos un fallback por si el header viene vacío
        const textoUserRaw = response.headers.get('X-Texto-Transcrito') || "";
        const textoIARaw = response.headers.get('X-Respuesta-IA') || "";

        // Para manejar caracteres especiales de forma segura:
        const textoUser = decodeURIComponent(escape(textoUserRaw));
        const textoIA = decodeURIComponent(escape(textoIARaw));

        // 2. Actualizar la interfaz de usuario
        if (nuevoId && nuevoId !== "null") setChatActualId(nuevoId);
        
        setMensajes(prev => [
          ...prev, 
          { rol: 'user', texto: textoUser || "Audio enviado" }, 
          { rol: 'ia', texto: textoIA || "Aquí tienes mi respuesta..." }
        ]);
        
        if (!chatActualId) {
          cargarPanelLateral();
        }

        // 3. Reproducir el audio de respuesta
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

  // --- FUNCIÓN DE ENVÍO TEXTO ---
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (textoInput.trim() === '') return;

    const nuevoMsg = { rol: 'user', texto: textoInput };
    setMensajes((prev) => [...prev, nuevoMsg]);
    setTextoInput('');
    setCargando(true);

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/ia/chat', {
        id_usuario: datosUsuario.id_usuario,
        id_conversacion: chatActualId,
        mensaje: nuevoMsg.texto
      });
      setMensajes((prev) => [...prev, { rol: 'ia', texto: res.data.respuesta }]);
      if (!chatActualId) {
        setChatActualId(res.data.id_conversacion);
        cargarPanelLateral();
      }
    } catch (error) {
      setMensajes((prev) => [...prev, { rol: 'ia', texto: "Error de conexión." }]);
    } finally { setCargando(false); }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioTutorIA');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#ffffff', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
      
      {/* PANEL LATERAL */}
      <div style={{ width: sidebarAbierto ? '260px' : '0px', transition: 'width 0.3s ease', overflow: 'hidden', backgroundColor: '#f9f9f9', borderRight: sidebarAbierto ? '1px solid #e5e5e5' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
          <button onClick={iniciarNuevoChat} style={{ width: '100%', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}>+ Nuevo Chat</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {historialChats.map((chat) => (
            <div key={chat.id_conversacion} onClick={() => cargarChatEspecifico(chat.id_conversacion)} style={{ padding: '10px', cursor: 'pointer', borderRadius: '6px', backgroundColor: chatActualId === chat.id_conversacion ? '#e5e7eb' : 'transparent' }}>
              💬 {chat.titulo}
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5' }}>
          <span>👤 {datosUsuario?.username}</span>
          <button onClick={cerrarSesion} style={{ color: '#ff4c4c', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px' }}>Salir</button>
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>☰</button>
          <h2 style={{ marginLeft: '15px' }}>TutorIA</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mensajes.map((msg, index) => (
            <div key={index} style={{ backgroundColor: msg.rol === 'ia' ? '#f9fafb' : '#ffffff', padding: '24px 20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ width: '100%', maxWidth: '750px', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '24px' }}>{msg.rol === 'user' ? '🧑‍💻' : '🤖'}</div>
                <div style={{ flex: 1 }}>{msg.texto}</div>
              </div>
            </div>
          ))}
          {cargando && <div style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#888' }}>TutorIA está procesando...</div>}
        </div>

        {/* INPUT Y BOTONES */}
<div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: 'transparent' }}>
  <div style={{ 
    width: '100%', 
    maxWidth: '850px', // Un poco más ancho para que quepa todo
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' // Espacio real entre el input y el micro
  }}>
    
    <form onSubmit={manejarEnvio} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input 
        type="text" 
        placeholder="Escribe o usa el micrófono..." 
        value={textoInput}
        onChange={(e) => setTextoInput(e.target.value)}
        disabled={cargando} 
        style={{ 
          width: '100%', 
          padding: '16px 50px 16px 20px', 
          borderRadius: '12px', 
          border: '1px solid #d1d5db', 
          backgroundColor: '#ffffff', 
          fontSize: '16px', 
          outline: 'none', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box' 
        }}
      />
      <button 
        type="submit" 
        disabled={cargando} 
        style={{ 
          position: 'absolute', 
          right: '10px', 
          background: '#e5e7eb', 
          border: 'none', 
          borderRadius: '8px', 
          padding: '8px 12px', 
          cursor: cargando ? 'not-allowed' : 'pointer',
          color: '#4b5563'
        }}
      >
        ➤
      </button>
    </form>
    
    {/* BOTÓN DE MICRÓFONO FUERA DEL FORM PARA QUE NO HAGA SUBMIT */}
    <button 
      onClick={toggleGrabacion}
      disabled={cargando}
      title={grabando ? "Detener grabación" : "Hablar con TutorIA"}
      style={{ 
        width: '54px', 
        height: '54px', 
        minWidth: '54px', // Evita que se encoja
        borderRadius: '12px', 
        border: 'none', 
        backgroundColor: grabando ? '#ef4444' : '#3b82f6', 
        color: 'white', 
        fontSize: '22px', 
        cursor: 'pointer', 
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: grabando ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {grabando ? '⏹️' : '🎤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}