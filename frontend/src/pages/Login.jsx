// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  
  // Memoria del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Tocamos la puerta del backend
      const respuesta = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      });

      // 2. Si nos abre, guardamos su ID y nombre en la memoria del navegador
      localStorage.setItem('usuarioTutorIA', JSON.stringify(respuesta.data.usuario));

      // 3. Lo dejamos pasar al chat
      navigate('/chat');

    } catch (err) {
      // Si la contraseña está mal, mostramos el error en pantalla
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Error al conectar con el servidor.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>TutorIA</h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 32px 0' }}>Inicia sesión para continuar aprendiendo</p>

        {/* Mostramos el error en rojo si te equivocas de clave */}
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

        <form onSubmit={manejarIngreso} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            type="text" 
            placeholder="Usuario" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
            style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} 
          />
          
          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s' }}>
            Ingresar al Chat
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}