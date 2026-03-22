# backend/models.py
from database import db
from datetime import datetime

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id_usuario = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    # Guardamos el hash por seguridad, nunca la contraseña en texto plano
    password_hash = db.Column(db.String(255), nullable=False) 
    
    # Relación Maestro: Un usuario tiene muchas conversaciones
    conversaciones = db.relationship('Conversacion', backref='usuario', lazy=True)


class Conversacion(db.Model):
    __tablename__ = 'conversaciones'
    
    id_conversacion = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    
    titulo = db.Column(db.String(100), nullable=False, default="Nuevo Chat")
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación Detalle: Una conversación tiene muchos mensajes/burbujas
    detalles = db.relationship('ConversacionDetalle', backref='conversacion', lazy=True)


class ConversacionDetalle(db.Model):
    __tablename__ = 'conversacion_detalles'
    
    id_detalle = db.Column(db.Integer, primary_key=True)
    id_conversacion = db.Column(db.Integer, db.ForeignKey('conversaciones.id_conversacion'), nullable=False)
    
    rol = db.Column(db.String(10), nullable=False) # Guardará 'user' o 'ia'
    contenido = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)