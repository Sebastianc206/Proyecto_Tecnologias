// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(''); // NUEVO: Estado para el mensaje de éxito

  const manejarRegistro = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setExito('');

    try {
      await axios.post('http://127.0.0.1:5000/api/auth/registro', {
        username: username,
        password: password
      });

      // NUEVO: En lugar de un alert(), mostramos un texto verde elegante
      setExito('¡Cuenta creada con éxito! Redirigiendo al Login...');
      
      // Esperamos 2 segundos para que el usuario lea el mensaje y luego lo enviamos al Login
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      // Si el backend detecta que el usuario ya existe, aquí se captura y se muestra el error en rojo
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
        
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Crear Cuenta</h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 32px 0' }}>Únete a TutorIA y guarda tu progreso</p>
        
        {/* Mensaje de Error (Rojo) */}
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px' }}>{error}</div>}
        
        {/* Mensaje de Éxito (Verde) */}
        {exito && <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '15px' }}>{exito}</div>}

        <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            type="text" 
            placeholder="Elige un Nombre de Usuario" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={exito !== ''} // Bloqueamos el input si ya tuvo éxito
            required 
            style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} 
          />
          <input 
            type="password" 
            placeholder="Crea una Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={exito !== ''} // Bloqueamos el input si ya tuvo éxito
            required 
            style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} 
          />
          
          <button type="submit" disabled={exito !== ''} style={{ width: '100%', padding: '14px', backgroundColor: exito ? '#9ca3af' : '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: exito ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
            {exito ? 'Creando...' : 'Crear mi Cuenta'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          ¿Ya tienes cuenta? <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}