# backend/routes/historial_routes.py
from flask import Blueprint, jsonify
from models import Conversacion, ConversacionDetalle

historial_bp = Blueprint('historial_bp', __name__)

# --- RUTA 1: Obtener la lista de chats para el panel lateral ---
@historial_bp.route('/usuario/<int:usuario_id>', methods=['GET'])
def obtener_conversaciones(usuario_id):
    # Buscamos todas las conversaciones del usuario, ordenadas de la más nueva a la más vieja
    conversaciones = Conversacion.query.filter_by(id_usuario=usuario_id).order_by(Conversacion.fecha_creacion.desc()).all()
    
    # Empaquetamos los datos en una lista de diccionarios (JSON)
    resultado = []
    for conv in conversaciones:
        resultado.append({
            "id_conversacion": conv.id_conversacion,
            "titulo": conv.titulo,
            "fecha": conv.fecha_creacion.strftime("%Y-%m-%d %H:%M")
        })
        
    return jsonify(resultado), 200

# --- RUTA 2: Obtener los globos de texto de un chat específico ---
@historial_bp.route('/conversacion/<int:conversacion_id>', methods=['GET'])
def obtener_mensajes(conversacion_id):
    # Buscamos los detalles de la conversación, ordenados cronológicamente (ascendente)
    mensajes = ConversacionDetalle.query.filter_by(id_conversacion=conversacion_id).order_by(ConversacionDetalle.fecha_creacion.asc()).all()
    
    resultado = []
    for msg in mensajes:
        resultado.append({
            "id_detalle": msg.id_detalle,
            "rol": msg.rol,
            "texto": msg.contenido # Usamos 'texto' para que coincida con lo que React ya espera
        })
        
    return jsonify(resultado), 200