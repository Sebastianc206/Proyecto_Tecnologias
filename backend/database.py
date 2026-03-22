# backend/database.py
from flask_sqlalchemy import SQLAlchemy

# Inicializamos el ORM vacío. Lo conectaremos a Flask más adelante.
db = SQLAlchemy()