import os
from dotenv import load_dotenv

# 1. CARGAR VARIABLES DE ENTORNO PRIMERO QUE NADA
load_dotenv()

from flask import Flask
from flask_cors import CORS
from database import db
# 2. AHORA SÍ IMPORTAMOS LAS RUTAS, porque la IA ya tiene su llave
from routes.auth_routes import auth_bp
from routes.ia_routes import ia_bp
from routes.historial_routes import historial_bp

app = Flask(__name__)

# Habilitar CORS para que el frontend en React pueda comunicarse sin bloqueos
CORS(app)

# 3. Configuración principal de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 4. Forzar a SQLAlchemy a usar el schema 'tutoria_db' dentro de Supabase (Opción B)
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "connect_args": {"options": "-csearch_path=tutoria_db"}
}

# 5. Inicializar la base de datos con la app
db.init_app(app)

# Registrar las rutas (Blueprints)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(ia_bp, url_prefix='/api/ia')
app.register_blueprint(historial_bp, url_prefix='/api/historial')

if __name__ == '__main__':
    # Crear las tablas automáticamente en el schema si no existen
    with app.app_context():
        db.create_all()
        print(">> Las tablas han sido verificadas/creadas exitosamente en el schema 'tutoria_db'.")
        
    app.run(debug=True)