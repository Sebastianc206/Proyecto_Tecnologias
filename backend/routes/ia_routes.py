# backend/routes/ia_routes.py
from flask import Blueprint, request, jsonify, send_file
from services.ia_service import generar_respuesta_tutor
from services.ia_service import (
    generar_respuesta_tutor, 
    transcribir_audio, 
    generar_audio_respuesta
)
import os

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
    
    # --- NUEVA RUTA PARA CHAT POR VOZ ---
@ia_bp.route('/chat-voz', methods=['POST'])
def chat_voz_con_ia():
    # 1. Recibir datos del FormData (React mandará audio, id_usuario e id_conversacion opcional)
    if 'audio' not in request.files:
        return jsonify({"error": "No se recibió archivo de audio"}), 400
    
    audio_file = request.files['audio']
    id_usuario = request.form.get('id_usuario')
    id_conversacion = request.form.get('id_conversacion')

    if not id_usuario:
        return jsonify({"error": "Falta id_usuario"}), 400

    # Guardar audio temporalmente para procesarlo
    ruta_input = "temp_entrada.webm"
    audio_file.save(ruta_input)

    try:
        # 2. TRANSCRIPCIÓN (Voz a Texto)
        nuevo_mensaje = transcribir_audio(ruta_input)
        if not nuevo_mensaje:
            return jsonify({"error": "No se pudo entender el audio"}), 400

        # 3. LÓGICA DE BASE DE DATOS (Igual que en /chat)
        if not id_conversacion or id_conversacion == "null":
            titulo_chat = nuevo_mensaje[:30] + "..." if len(nuevo_mensaje) > 30 else nuevo_mensaje
            nueva_conv = Conversacion(id_usuario=id_usuario, titulo=titulo_chat)
            db.session.add(nueva_conv)
            db.session.commit()
            id_conversacion = nueva_conv.id_conversacion

        # Guardar pregunta del usuario
        detalle_user = ConversacionDetalle(id_conversacion=id_conversacion, rol='user', contenido=nuevo_mensaje)
        db.session.add(detalle_user)
        db.session.commit()

        # 4. MEMORIA E IA: Obtener historial y generar respuesta
        mensajes_db = ConversacionDetalle.query.filter_by(id_conversacion=id_conversacion).order_by(ConversacionDetalle.fecha_creacion.asc()).all()
        historial_para_ia = [{"rol": msg.rol, "texto": msg.contenido} for msg in mensajes_db]
        
        respuesta_ia_texto = generar_respuesta_tutor(historial_para_ia)

        # Guardar respuesta de la IA en DB
        detalle_ia = ConversacionDetalle(id_conversacion=id_conversacion, rol='ia', contenido=respuesta_ia_texto)
        db.session.add(detalle_ia)
        db.session.commit()

        # 5. GENERAR AUDIO DE RESPUESTA (Texto a Voz)
        ruta_output = generar_audio_respuesta(respuesta_ia_texto)

        # 6. ENVIAR RESPUESTA COMPLETA
        # Nota: Como queremos enviar el audio Y los datos (id_conversacion), 
        # lo ideal es enviar el audio y meter los datos en los Headers de la respuesta
        # para que React los lea.
        
       # --- EN TU RUTA /chat-voz DENTRO DE ia_routes.py ---

        response = send_file(ruta_output, mimetype="audio/mpeg")
        response.headers["X-ID-Conversacion"] = str(id_conversacion)

        # LIMPPIEZA CRÍTICA: Reemplazamos los saltos de línea (\n) por espacios 
        # o por un marcador especial para que el Header sea una sola línea continua.
        texto_limpio_user = nuevo_mensaje.replace("\n", " ").strip()
        texto_limpio_ia = respuesta_ia_texto.replace("\n", " ").strip()

        # Ahora sí, enviamos sin riesgo de error de "newline characters"
        response.headers["X-Texto-Transcrito"] = texto_limpio_user.encode('utf-8').decode('latin-1')
        response.headers["X-Respuesta-IA"] = texto_limpio_ia.encode('utf-8').decode('latin-1')

        
        return response

    except Exception as e:
        db.session.rollback()
        print(f"Error en chat-voz: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Limpieza de archivos temporales
        if os.path.exists(ruta_input):
            os.remove(ruta_input)