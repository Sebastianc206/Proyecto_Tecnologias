# backend/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import db
from models import Usuario
from werkzeug.security import generate_password_hash, check_password_hash

# Creamos el "Blueprint" (un mini-módulo de rutas) para la autenticación
auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/registro', methods=['POST'])
def registrar_usuario():
    datos = request.get_json()
    username = datos.get('username')
    password = datos.get('password')

    # 1. Validación básica
    if not username or not password:
        return jsonify({"error": "Faltan datos. Usuario y contraseña son obligatorios."}), 400

    # 2. Verificamos que el usuario no exista ya en la base de datos
    usuario_existente = Usuario.query.filter_by(username=username).first()
    if usuario_existente:
        return jsonify({"error": "Ese nombre de usuario ya está en uso. Elige otro."}), 409

    # 3. SEGURIDAD: Encriptamos la contraseña (Hashing)
    # generate_password_hash convierte "12345" en algo como "pbkdf2:sha256:250000$xyz..."
    password_encriptada = generate_password_hash(password)

    # 4. Creamos el objeto Usuario y lo guardamos usando el ORM
    nuevo_usuario = Usuario(username=username, password_hash=password_encriptada)
    
    try:
        db.session.add(nuevo_usuario)
        db.session.commit() # Confirmamos el guardado en PostgreSQL
        return jsonify({"mensaje": f"Usuario {username} creado con éxito."}), 201
    except Exception as e:
        db.session.rollback() # Si algo sale mal, cancelamos la operación
        return jsonify({"error": f"Error al guardar en la base de datos: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def iniciar_sesion():
    datos = request.get_json()
    username = datos.get('username')
    password = datos.get('password')

    if not username or not password:
        return jsonify({"error": "Usuario y contraseña son obligatorios."}), 400

    # 1. Buscamos si el usuario existe en la base de datos
    usuario = Usuario.query.filter_by(username=username).first()

    # 2. Si no existe, o si la contraseña no coincide con el hash, rechazamos
    if not usuario or not check_password_hash(usuario.password_hash, password):
        return jsonify({"error": "Usuario o contraseña incorrectos."}), 401

    # 3. Si todo está correcto, le devolvemos a React los datos del usuario
    return jsonify({
        "mensaje": "Login exitoso",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "username": usuario.username
        }
    }), 200