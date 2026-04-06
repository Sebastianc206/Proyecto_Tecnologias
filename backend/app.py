# backend/app.py
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# 1. Importamos nuestra base de datos y los modelos que acabamos de crear
from database import db
import models 

load_dotenv(".env")
from routes.ia_routes import ia_bp 
from routes.auth_routes import auth_bp 
from routes.historial_routes import historial_bp

app = Flask(__name__)
# En backend/app.py
CORS(app, expose_headers=["X-ID-Conversacion", "X-Texto-Transcrito", "X-Respuesta-IA"])

# 2. Le pasamos la URL de Docker a la configuración de Flask
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 3. Conectamos la aplicación de Flask con la base de datos
db.init_app(app)

# 4. CREACIÓN AUTOMÁTICA DE TABLAS
# Esto revisa tu PostgreSQL y crea las tablas si aún no existen
with app.app_context():
    db.create_all()
    print("Las tablas han sido verificadas/creadas exitosamente en PostgreSQL.")

app.register_blueprint(ia_bp, url_prefix='/api/ia')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(historial_bp, url_prefix='/api/historial')

@app.route('/')
def estado_servidor():
    return {"estado": "Servidor Flask y Base de Datos funcionando al 100%"}

if __name__ == '__main__':
    app.run(debug=True)