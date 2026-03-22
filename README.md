# 🤖 TutorIA

TutorIA es una plataforma educativa Full-Stack diseñada para asistir a estudiantes en el aprendizaje de Pensamiento Computacional y Programación. Utiliza Inteligencia Artificial para ofrecer un entorno de chat interactivo, con memoria a largo plazo y un diseño minimalista y profesional.

## 🚀 Características Actuales

* **Autenticación de Usuarios:** Sistema de registro y login seguro con contraseñas encriptadas (Hashing).
* **Interfaz Profesional:** Diseño minimalista inspirado en herramientas como Claude y Gemini, con panel lateral colapsable.
* **Memoria Conversacional (Context Window):** La IA recuerda el hilo de la conversación actual para dar respuestas coherentes.
* **Historial Persistente:** Los chats se guardan automáticamente en la base de datos y se recuperan desde el panel lateral al iniciar sesión.
* **Títulos Automáticos:** Generación de títulos para las conversaciones nuevas basándose en el primer mensaje.

## 🛠️ Stack Tecnológico

* **Frontend:** React, Vite, React Router, Axios.
* **Backend:** Python, Flask, Flask-CORS, Werkzeug (Seguridad).
* **Base de Datos:** PostgreSQL (Dockerizado), Flask-SQLAlchemy (ORM), psycopg2-binary.
* **Inteligencia Artificial:** OpenAI API (Modelo `gpt-4o-mini` o Fine-Tuned).

---

## 🌿 Flujo de Trabajo (GitFlow)

Para mantener la integridad del código y evitar conflictos, este proyecto utiliza un modelo basado en GitFlow. **Está estrictamente prohibido hacer commits directos a la rama `main`.**

* **`main`**: Es la rama de producción. Contiene el código estable y funcional. Solo recibe actualizaciones mediante Pull Requests aprobados desde `develop`.
* **`develop`**: Es la rama base de integración. Aquí se unen todas las nuevas funcionalidades antes de pasar a producción.
* **Ramas de Trabajo**: Todo el desarrollo se hace en ramas separadas que nacen de `develop`. Se usa la siguiente nomenclatura:
  * `feature/nombre-de-la-tarea` (Ej: `feature/base-de-datos`, `feature/reconocimiento-voz`)
  * `bugfix/nombre-del-error` (Para arreglar errores en desarrollo)
  * `docs/nombre-del-documento` (Para actualizar documentación o README)

**Proceso para agregar código:**
1. Crear rama desde develop: `git checkout -b feature/nueva-funcion`
2. Trabajar y hacer commits: `git commit -m "feat: descripcion"`
3. Subir rama: `git push origin feature/nueva-funcion`
4. Crear Pull Request en GitHub **apuntando hacia `develop`**.
5. Revisar y fusionar (Merge).

---

## 📋 Requisitos Previos

Para ejecutar este proyecto en tu computadora local, asegúrate de instalar:
1. [Node.js](https://nodejs.org/) (Para correr el frontend en React).
2. [Python 3.x](https://www.python.org/) (Para el backend de Flask).
3. [Docker Desktop](https://www.docker.com/) (Para levantar el contenedor de la base de datos).
4. Un cliente de bases de datos como [DBeaver](https://dbeaver.io/) o pgAdmin.

---

## ⚙️ Configuración del Entorno Local (Paso a Paso)

### 1. Preparar la Base de Datos (Crucial)
Antes de encender el servidor, PostgreSQL debe estar corriendo y el contenedor vacío debe existir.
1. Levanta tu contenedor de PostgreSQL en Docker.
2. Abre tu gestor de bases de datos (ej. DBeaver) y conéctate al servidor local (`localhost`, puerto `5432`).
3. **Crea una nueva base de datos** llamada exactamente `tutoria_db`. No es necesario crear tablas, el ORM de Python lo hará automáticamente.

### 2. Configuración del Backend (Flask)
Abre una terminal y navega a la carpeta del backend:
```bash
cd backend
Crea y activa el entorno virtual de Python:

Bash
# En Windows (Git Bash):
python -m venv venv
source venv/Scripts/activate

# En Mac/Linux:
python3 -m venv venv
source venv/bin/activate
Instala todas las dependencias del proyecto:

Bash
pip install -r requirements.txt
Crea un archivo llamado .env dentro de la carpeta backend y configura tus variables de entorno (reemplaza los valores con tus credenciales reales):

Fragmento de código
OPENAI_API_KEY=sk-tu-llave-real-aqui
FINE_TUNED_MODEL_ID=gpt-4o-mini
# Formato: postgresql://usuario:contraseña@localhost:5432/tutoria_db
DATABASE_URL=postgresql://postgres:tu_contraseña_docker@localhost:5432/tutoria_db
Inicia el servidor. Al correr este comando por primera vez, SQLAlchemy detectará la base de datos tutoria_db y creará las tablas usuarios, conversaciones y conversacion_detalles de forma automática:

Bash
python app.py
El backend estará escuchando en http://127.0.0.1:5000.

3. Configuración del Frontend (React)
Abre una nueva terminal, manteniendo el backend corriendo en la primera, y navega a la carpeta del frontend:

Bash
cd frontend
Instala los paquetes de Node:

Bash
npm install
Inicia el servidor de desarrollo:

Bash
npm run dev
La aplicación estará disponible en tu navegador en http://localhost:5173.

💡 Uso de la Plataforma
Entra a http://localhost:5173.

Haz clic en Regístrate aquí para crear tu primer usuario de prueba.

Inicia sesión con tus credenciales.

Escribe un mensaje en el chat para iniciar una conversación. Verás cómo el historial se guarda en el panel lateral y persiste aunque recargues la página.