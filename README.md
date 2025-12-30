# AlphaSeeker - AI Financial Advisor

## 🚀 Objetivo del Proyecto

**AlphaSeeker** es un sistema automatizado de inteligencia financiera diseñado para **analizar el mercado en tiempo real y ofrecer consejos de inversión**. 

El sistema utiliza un flujo orquestado por **n8n** que:
1.  **Extrae noticias financieras** de fuentes clave (como Cointelegraph, Yahoo Finance, etc.) mediante un scraper personalizado.
2.  **Analiza cada noticia** individualmente utilizando un **Modelo de Lenguaje (LLM)** propio entrenado específicamente para finanzas (`AlphaSeeker-8B`).
3.  **Genera un informe consolidado** (Batch Analysis) con una visión global del mercado y recomendaciones de inversión para el día.

---

## 🏗️ Arquitectura del Sistema

El proyecto combina servicios en **Docker** con ejecución **Local (Nativa)** para aprovechar la aceleración de hardware de Apple Silicon (MLX).

| Componente | Tipo | Descripción |
| :--- | :--- | :--- |
| **n8n** | Docker | Orquestador del flujo de trabajo. Gestiona la lógica, llamadas a API y toma de decisiones. |
| **Scraper** | Docker | Servicio Python (FastAPI) que descarga y limpia el contenido de las noticias. Usa `cloudscraper` para evadir protecciones básicas. |
| **LLM API** | **Local (Mac)** | API del modelo `AlphaSeeker-8B`. Se ejecuta nativamente en macOS para usar la librería **MLX** (Apple Silicon) y ofrecer inferencia rápida. |
| **Ollama** | Docker | Servicio auxiliar de LLM (opcional/complementario). |

---

## 🛠️ Instalación y Puesta a Punto

### Prerrequisitos
*   **Docker Desktop** instalado y corriendo.
*   **Mac con Apple Silicon** (M1/M2/M3) para ejecutar el modelo MLX.
*   **Python 3.9+** instalado en el sistema local.

### Paso 1: Configurar la API del Modelo (Local)
Debido a que el modelo usa **MLX**, debe correr fuera de Docker.

1.  Navega a la carpeta del API:
    ```bash
    cd llm-api
    ```
2.  Crea un entorno virtual e instala dependencias:
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Asegúrate de que el modelo `AlphaSeeker-8B-v1` esté en la carpeta `llm-api/`.
4.  Inicia el servidor:
    ```bash
    ./run_local.sh
    ```
    *El servicio quedará escuchando en `http://0.0.0.0:8000`.*

### Paso 2: Desplegar Servicios Docker
El resto del stack (n8n, scraper, base de datos) corre en Docker.

1.  En una nueva terminal, ve a la raíz del proyecto:
    ```bash
    cd /ruta/a/AlphaSeeker
    ```
2.  Levanta los contenedores:
    ```bash
    docker-compose up -d
    ```
3.  Verifica que todo esté corriendo:
    *   **n8n**: `http://localhost:5678`
    *   **Scraper**: `http://localhost:8080/health`

---

## 🔄 Flujo de Trabajo (n8n)

El cerebro del sistema es el workflow `AI FINANCIAL` en n8n.

1.  **Trigger**: Se activa programadamente (ej. cada mañana) o manualmente.
2.  **Scraping**: n8n envía URLs de noticias al servicio **Scraper** (`http://scraper:8080/scrape`).
    *   *Nota:* El scraper devuelve el título, contenido limpio y fecha.
3.  **Análisis Individual**: n8n envía el contenido de cada noticia a la **LLM API**.
    *   **Importante**: Desde Docker (n8n), la API local se accede como `http://host.docker.internal:8000`.
4.  **Análisis de Mercado (Batch)**: El modelo procesa todas las noticias juntas para detectar tendencias cruzadas.
5.  **Resultado**: Se genera un informe final con consejos de compra/venta/mantener.

---

## ⚠️ Notas Importantes

*   **Conectividad Docker -> Local**: El uso de `host.docker.internal` es crucial para que n8n pueda \"ver\" a tu API de Python corriendo en el Mac.
*   **Protección Anti-Bot**: El scraper usa `cloudscraper` para intentar saltar bloqueos (403/401). Sitios muy protegidos (como Reuters o Investing.com) pueden bloquear estas peticiones. En esos casos, se recomienda usar fuentes alternativas (Yahoo Finance, Cointelegraph) o implementar un scraper tipo \"Headless Browser\".
*   **Modelo**: Asegúrate de que el modelo `AlphaSeeker-8B-v1` es compatible con la versión de `mlx` instalada.

---

## 📂 Estructura del Proyecto

```
AlphaSeeker/
├── docker-compose.yml      # Definición de servicios Docker
├── scraper/                # Servicio de Scraping
│   ├── main.py             # API FastAPI
│   ├── scrapper.py         # Lógica de extracción
│   └── Dockerfile          # Imagen Docker del scraper
├── llm-api/                # API del Modelo (Local)
│   ├── api_alphaseeker.py  # Servidor de inferencia MLX
│   ├── run_local.sh        # Script de arranque
│   └── AlphaSeeker-8B-v1/  # Archivos del modelo (No incluidos en git)
└── n8n-workflows/          # Backups de flujos de n8n
```
