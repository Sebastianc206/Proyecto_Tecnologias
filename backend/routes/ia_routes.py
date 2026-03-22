# backend/routes/ia_routes.py
from flask import Blueprint, request, jsonify
from services.ia_service import generar_respuesta_tutor

# NUEVO: Importamos la base de datos y nuestros modelos
from database import db
from models import Conversacion, ConversacionDetalle

ia_bp = Blueprint('ia_bp', __name__)

@ia_bp.route('/chat', methods=['POST'])
def chat_con_ia():
    datos = request.get_json()
    
    # Ahora React nos enviará quién es, en qué chat está, y qué acaba de escribir
    id_usuario = datos.get('id_usuario')
    id_conversacion = datos.get('id_conversacion') # Puede venir vacío si es un chat nuevo
    nuevo_mensaje = datos.get('mensaje')

    if not id_usuario or not nuevo_mensaje:
        return jsonify({"error": "Faltan datos (id_usuario o mensaje)"}), 400

    try:
        # 1. ¿ES UN CHAT NUEVO? Creamos el "Maestro"
        if not id_conversacion:
            # Usamos los primeros 30 caracteres del mensaje como título del chat
            titulo_chat = nuevo_mensaje[:30] + "..." if len(nuevo_mensaje) > 30 else nuevo_mensaje
            
            nueva_conv = Conversacion(id_usuario=id_usuario, titulo=titulo_chat)
            db.session.add(nueva_conv)
            db.session.commit()
            
            # Recuperamos el ID que PostgreSQL le acaba de asignar
            id_conversacion = nueva_conv.id_conversacion

        # 2. GUARDAMOS LA PREGUNTA: Insertamos el "Detalle" del estudiante
        detalle_user = ConversacionDetalle(id_conversacion=id_conversacion, rol='user', contenido=nuevo_mensaje)
        db.session.add(detalle_user)
        db.session.commit()

        # 3. RECOPILAMOS LA MEMORIA: Sacamos todo el historial de este chat desde PostgreSQL
        mensajes_db = ConversacionDetalle.query.filter_by(id_conversacion=id_conversacion).order_by(ConversacionDetalle.fecha_creacion.asc()).all()
        
        # Lo traducimos al formato de lista que nuestro servicio de OpenAI ya sabe leer
        historial_para_ia = []
        for msg in mensajes_db:
            historial_para_ia.append({"rol": msg.rol, "texto": msg.contenido})

        # 4. EL CEREBRO PIENSA: Le mandamos el historial completo a la IA
        respuesta_ia = generar_respuesta_tutor(historial_para_ia)

        # 5. GUARDAMOS LA RESPUESTA: Insertamos el "Detalle" de la IA
        detalle_ia = ConversacionDetalle(id_conversacion=id_conversacion, rol='ia', contenido=respuesta_ia)
        db.session.add(detalle_ia)
        db.session.commit()

        # 6. RESPONDEMOS A REACT: Le mandamos el texto de la IA y el ID del chat
        return jsonify({
            "respuesta": respuesta_ia,
            "id_conversacion": id_conversacion
        }), 200

    except Exception as e:
        db.session.rollback() # Si algo explota, cancelamos las inserciones para no corromper la DB
        return jsonify({"error": f"Error en la base de datos: {str(e)}"}), 500