#!/bin/bash

# Asegurarse de estar en el directorio correcto
cd "$(dirname "$0")"

echo "--- Iniciando AlphaSeeker LLM API (Modo Local MLX) ---"

# Verificar si existe el entorno virtual, si no, sugerir crearlo
if [ -z "$VIRTUAL_ENV" ]; then
    echo "ADVERTENCIA: No estás en un entorno virtual."
    echo "Se recomienda activar uno con: source venv/bin/activate"
    # No forzamos salida, el usuario puede tener deps globales
fi

# Instalar dependencias si es necesario (opcional, descomentar si se desea)
# pip install -r requirements.txt

# Ejecutar la API
python api_alphaseeker.py
