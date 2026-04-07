# backend/models.py
from database import db
from datetime import datetime, timedelta

# --- FUNCIÓN PARA FORZAR HORA DE GUATEMALA (UTC-6) ---
def obtener_hora_guatemala():
    # Restamos 6 horas directamente a la hora universal para enviar una fecha sin zona horaria
    return datetime.utcnow() - timedelta(hours=6)

class Usuario(db.Model):
    __tablename__ = 'usuario'
    
    id_usuario = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False) 
    
    fecha_nacimiento = db.Column(db.Date, nullable=True)
    sexo = db.Column(db.String(20), nullable=True)
    
    conversaciones = db.relationship('Conversacion', backref='usuario', lazy=True)
    bitacoras = db.relationship('BitacoraConexion', backref='usuario', lazy=True)


class Conversacion(db.Model):
    __tablename__ = 'conversacion'
    
    id_conversacion = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    
    titulo = db.Column(db.String(100), nullable=False, default="Nuevo Chat")
    fecha_creacion = db.Column(db.DateTime, default=obtener_hora_guatemala)
    
    detalles = db.relationship('ConversacionDetalle', backref='conversacion', lazy=True)


class ConversacionDetalle(db.Model):
    __tablename__ = 'conversacion_detalle'
    
    id_detalle = db.Column(db.Integer, primary_key=True)
    id_conversacion = db.Column(db.Integer, db.ForeignKey('conversacion.id_conversacion'), nullable=False)
    
    rol = db.Column(db.String(10), nullable=False) 
    contenido = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=obtener_hora_guatemala)


class BitacoraConexion(db.Model):
    __tablename__ = 'bitacora_conexion'
    
    id_bitacora = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    
    fecha_entrada = db.Column(db.DateTime, default=obtener_hora_guatemala)
    fecha_salida = db.Column(db.DateTime, nullable=True)