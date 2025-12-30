# Usa una imagen base con Python 3.11 (o la versión que uses localmente)
FROM python:3.11-slim

# Instalar dependencias esenciales del sistema si son necesarias (ej. para lxml)
# Si no son necesarias, omite la línea RUN apt-get...
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de requerimientos de Python e instalar las dependencias
# Se asume que 'requirements.txt' lista FastAPI, uvicorn, transformers, etc.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la API (api_alphaseeker.py)
COPY api_alphaseeker.py .

# Los modelos (AlphaSeeker-8B-v1) y los adaptadores se mapean
# directamente usando VOLUMES en el docker-compose.yml, 
# pero si quieres copiarlos en el build, hazlo aquí:
# COPY AlphaSeeker-8B-v1 /app/AlphaSeeker-8B-v1
# COPY adapters /app/adapters

# Comando para lanzar la API usando uvicorn (asumiendo FastAPI)
# HOST 0.0.0.0 es necesario para acceder desde otros contenedores (n8n).
CMD ["uvicorn", "api_alphaseeker:app", "--host", "0.0.0.0", "--port", "8000"]