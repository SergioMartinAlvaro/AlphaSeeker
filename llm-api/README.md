# AlphaSeeker LLM API

## Descripción
Este servicio proporciona una API de inferencia para el modelo de lenguaje **AlphaSeeker-8B-v1**. Utiliza la librería **MLX** (optimizada para Apple Silicon) para cargar y ejecutar el modelo localmente. Su función principal es recibir noticias financieras, analizarlas y extraer información estructurada en formato JSON (como el sentimiento, relevancia, tickers, etc.).

**Características Principales:**
- **Inferencia Local:** Ejecuta el modelo LLM directamente en el hardware local sin depender de APIs externas.
- **Procesamiento por Lotes (Batch):** Acepta listas de noticias y las procesa secuencialmente para optimizar el flujo y evitar errores de memoria.
- **Extracción de JSON:** Incluye lógica para limpiar la salida del LLM y asegurar que se devuelva un JSON válido.

## Requisitos Previos

- **Modelo:** Debes tener la carpeta del modelo `AlphaSeeker-8B-v1` (y opcionalmente `adapters`) dentro del directorio `llm-api`.
- **Entorno:** Python 3.9+ con las dependencias instaladas (ver `requirements.txt`).

## Instalación y Despliegue (Modo Local MLX)

Debido a que el modelo está cuantizado con **MLX** (Apple Silicon), **NO puede ejecutarse dentro de Docker** (que usa Linux). Debe ejecutarse nativamente en tu Mac.

1.  **Preparar el entorno:**
    Asegúrate de tener un entorno virtual con las librerías necesarias:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Ejecutar la API:**
    Usa el script facilitado:
    ```bash
    ./run_local.sh
    ```
    O manualmente:
    ```bash
    python api_alphaseeker.py
    ```

El servicio escuchará en el puerto `8000` de tu máquina local.

## Conexión desde Docker (n8n)

Para que **n8n** (que corre en Docker) pueda ver esta API (que corre en tu Mac), debes usar la dirección especial:

`http://host.docker.internal:8000/analyze-batch`

**NO** uses `localhost` ni `alphaseeker_api` dentro de n8n.

## Uso de la API

### Endpoint: Analizar Lote (`POST /analyze-batch`)

Recibe una lista de textos (noticias) y devuelve el análisis generado por el LLM para cada una.

- **URL:** `http://alphaseeker_api:8000/analyze-batch`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  [
    { "text": "Prompt completo para la noticia 1..." },
    { "text": "Prompt completo para la noticia 2..." }
  ]
  ```

- **Respuesta:**
  Devuelve un objeto con una lista de resultados JSON parseados.
  ```json
  {
    "results": [
      {
        "ticker": "AAPL",
        "sentiment": "positive",
        "summary": "..."
      },
      {
        "ticker": "TSLA",
        "sentiment": "neutral",
        "summary": "..."
      }
    ]
  }
  ```

### Ejemplo CURL (desde dentro de la red Docker)
```bash
curl -X POST http://alphaseeker_api:8000/analyze-batch \
  -H "Content-Type: application/json" \
  -d '[{"text": "Noticia de prueba para analizar..."}]'
```

### Ejemplo CURL (desde tu máquina local / terminal)
```bash
curl -X POST http://localhost:8000/analyze-batch \
  -H "Content-Type: application/json" \
  -d '[{"text": "Noticia de prueba para analizar..."}]'
```

## Notas de Desarrollo
- El modelo se carga una sola vez al iniciar el servicio.
- El procesamiento es secuencial dentro del endpoint `/analyze-batch` para mantener la estabilidad de MLX.
