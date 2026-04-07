# backend/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
from models import Usuario, BitacoraConexion
from datetime import datetime, timedelta

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/registro', methods=['POST'])
def registrar_usuario():
    datos = request.get_json()
    username = datos.get('username')
    password = datos.get('password')
    fecha_nacimiento = datos.get('fecha_nacimiento')
    sexo = datos.get('sexo')

    if not username or not password:
        return jsonify({"error": "Usuario y contraseña son obligatorios."}), 400

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"error": "Ese nombre de usuario ya está en uso. Elige otro."}), 409

    password_encriptada = generate_password_hash(password)
    
    nuevo_usuario = Usuario(
        username=username, 
        password_hash=password_encriptada,
        fecha_nacimiento=fecha_nacimiento,
        sexo=sexo
    )
    
    try:
        db.session.add(nuevo_usuario)
        db.session.commit()
        return jsonify({"mensaje": f"Usuario {username} creado con éxito."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al guardar en la base de datos: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def iniciar_sesion():
    datos = request.get_json()
    username = datos.get('username')
    password = datos.get('password')

    if not username or not password:
        return jsonify({"error": "Usuario y contraseña son obligatorios."}), 400

    usuario = Usuario.query.filter_by(username=username).first()

    if not usuario or not check_password_hash(usuario.password_hash, password):
        return jsonify({"error": "Usuario o contraseña incorrectos."}), 401

    # Iniciar la bitácora
    nueva_conexion = BitacoraConexion(id_usuario=usuario.id_usuario)
    db.session.add(nueva_conexion)
    db.session.commit()

    return jsonify({
        "mensaje": "Login exitoso",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "username": usuario.username
        },
        "id_bitacora": nueva_conexion.id_bitacora
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def cerrar_sesion():
    datos = request.get_json()
    id_bitacora = datos.get('id_bitacora')
    
    if id_bitacora:
        conexion = BitacoraConexion.query.get(id_bitacora)
        if conexion and not conexion.fecha_salida:
            # Calculamos la hora ingenua (naive) restando 6 horas
            hora_guate = datetime.utcnow() - timedelta(hours=6)
            conexion.fecha_salida = hora_guate
            db.session.commit()
            
    return jsonify({"mensaje": "Sesión finalizada."}), 200