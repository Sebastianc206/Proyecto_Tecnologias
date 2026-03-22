// frontend/src/pages/Chat.jsx
import { useState, useEffect } from 'react'; // Importamos useEffect
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
  const navigate = useNavigate();

  // 1. OBTENER USUARIO: Si no hay nadie logueado, lo pateamos al Login por seguridad
  const datosUsuario = JSON.parse(localStorage.getItem('usuarioTutorIA'));
  useEffect(() => {
    if (!datosUsuario) navigate('/');
  }, [datosUsuario, navigate]);

  // --- MEMORIA DEL COMPONENTE ---
  const [mensajes, setMensajes] = useState([]);
  const [textoInput, setTextoInput] = useState('');
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [cargando, setCargando] = useState(false);
  
  // NUEVO: Memoria real para la base de datos
  const [historialChats, setHistorialChats] = useState([]); // Lista del panel lateral
  const [chatActualId, setChatActualId] = useState(null);   // ID del chat que estamos viendo

  // --- EFECTOS AUTOMÁTICOS ---
  // Cuando la pantalla carga por primera vez, vamos a buscar los chats del usuario
  useEffect(() => {
    if (datosUsuario) {
      cargarPanelLateral();
      iniciarNuevoChat(); // Empezamos con la pantalla limpia
    }
  }, []);

  // --- FUNCIONES DE BASE DE DATOS ---
  const cargarPanelLateral = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/usuario/${datosUsuario.id_usuario}`);
      setHistorialChats(res.data);
    } catch (error) {
      console.error("Error al cargar historial lateral:", error);
    }
  };

  const cargarChatEspecifico = async (id_conversacion) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/historial/conversacion/${id_conversacion}`);
      setMensajes(res.data); // Ponemos los globos de texto de la BD en la pantalla
      setChatActualId(id_conversacion); // Le decimos a React en qué chat estamos
    } catch (error) {
      console.error("Error al cargar los mensajes del chat:", error);
    }
  };

  const iniciarNuevoChat = () => {
    setChatActualId(null);
    setMensajes([
      { rol: 'ia', texto: `¡Hola, ${datosUsuario?.username}! Soy TutorIA. ¿En qué concepto de Pensamiento Computacional o Programación te puedo ayudar hoy?` }
    ]);
  };

  // --- FUNCIÓN DE ENVÍO ACTUALIZADA ---
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (textoInput.trim() === '') return;

    const nuevoMensajeUsuario = { rol: 'user', texto: textoInput };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]); // Dibujamos el globo del usuario
    setTextoInput('');
    setCargando(true);

    try {
      // Ahora enviamos el formato que pide nuestra nueva ruta de Flask
      const respuestaServidor = await axios.post('http://127.0.0.1:5000/api/ia/chat', {
        id_usuario: datosUsuario.id_usuario,
        id_conversacion: chatActualId, // Si es null, Flask sabrá que debe crear uno nuevo
        mensaje: nuevoMensajeUsuario.texto
      });

      // Dibujamos el globo de la IA
      setMensajes((prev) => [...prev, { rol: 'ia', texto: respuestaServidor.data.respuesta }]);

      // Si era un chat nuevo, actualizamos el ID y refrescamos el panel lateral
      if (!chatActualId) {
        setChatActualId(respuestaServidor.data.id_conversacion);
        cargarPanelLateral();
      }

    } catch (error) {
      setMensajes((prev) => [...prev, { rol: 'ia', texto: "Error: No me pude conectar con el servidor de TutorIA." }]);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioTutorIA');
    navigate('/');
  };

  if (!datosUsuario) return null; // Evita parpadeos si no hay usuario

  // --- DISEÑO VISUAL ---
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#333' }}>
      
      {/* PANEL LATERAL */}
      <div style={{ width: sidebarAbierto ? '260px' : '0px', transition: 'width 0.3s ease', overflow: 'hidden', backgroundColor: '#f9f9f9', borderRight: sidebarAbierto ? '1px solid #e5e5e5' : 'none', display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
        <div style={{ padding: '20px' }}>
          <button onClick={iniciarNuevoChat} style={{ width: '100%', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500' }}>
            <span>+</span> Nuevo Chat
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <p style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '10px' }}>Tus Conversaciones</p>
          
          {/* AHORA MAPEAMOS LOS CHATS REALES DE LA BASE DE DATOS */}
          {historialChats.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>No hay chats anteriores.</p>
          ) : (
            historialChats.map((chat) => (
              <div 
                key={chat.id_conversacion} 
                onClick={() => cargarChatEspecifico(chat.id_conversacion)}
                style={{ 
                  padding: '10px', 
                  fontSize: '14px', 
                  color: '#444', 
                  cursor: 'pointer', 
                  borderRadius: '6px', 
                  marginBottom: '5px',
                  backgroundColor: chatActualId === chat.id_conversacion ? '#e5e7eb' : 'transparent', // Resaltamos el chat activo
                  overflow: 'hidden', textOverflow: 'ellipsis'
                }}
                title={chat.titulo}
              >
                💬 {chat.titulo}
              </div>
            ))
          )}
        </div>
        
        <div style={{ padding: '20px', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>👤 {datosUsuario.username}</span>
          <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: '#ff4c4c', cursor: 'pointer', fontSize: '12px' }}>Salir</button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DEL CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666', marginRight: '15px' }}>
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#222' }}>TutorIA</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {mensajes.map((msg, index) => (
            <div key={index} style={{ width: '100%', backgroundColor: msg.rol === 'ia' ? '#f9fafb' : '#ffffff', borderBottom: msg.rol === 'ia' ? '1px solid #f0f0f0' : 'none', display: 'flex', justifyContent: 'center', padding: '24px 20px' }}>
              <div style={{ width: '100%', maxWidth: '750px', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '24px' }}>{msg.rol === 'user' ? '🧑‍💻' : '🤖'}</div>
                <div style={{ flex: 1, fontSize: '16px', lineHeight: '1.6', color: '#374151', paddingTop: '4px' }}>
                  {msg.texto}
                </div>
              </div>
            </div>
          ))}

          {cargando && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 20px', backgroundColor: '#f9fafb' }}>
              <div style={{ width: '100%', maxWidth: '750px', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '24px' }}>🤖</div>
                <div style={{ flex: 1, fontSize: '16px', color: '#6b7280', fontStyle: 'italic', paddingTop: '4px' }}>
                  TutorIA está analizando y guardando tu duda...
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: 'transparent' }}>
          <form onSubmit={manejarEnvio} style={{ width: '100%', maxWidth: '750px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Escribe tu mensaje a TutorIA..." 
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              disabled={cargando} 
              style={{ width: '100%', padding: '16px 50px 16px 20px', borderRadius: '12px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', fontSize: '16px', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={cargando} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#e5e7eb', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: cargando ? 'not-allowed' : 'pointer', color: '#4b5563', fontWeight: 'bold' }}>
              ➤
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}