# Guía de Instalación para Windows (Entorno Local)

Este documento te guiará paso a paso para ejecutar **AlphaSeeker** en tu ordenador Windows. No necesitas conocimientos avanzados, solo sigue las instrucciones.

---

## 🚀 Requisitos Previos

Antes de empezar, necesitas instalar 3 programas básicos.

### 1. Git (Control de Versiones)
-   **Descargar**: [https://git-scm.com/download/win](https://git-scm.com/download/win)
-   **Instalación**: Dale a "Siguiente" en todo (opciones por defecto).

### 2. Docker Desktop (Contenedores)
-   **Descargar**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
-   **Instalación**: Instala y reinicia el ordenador si te lo pide.
-   **Importante**: Abre "Docker Desktop" una vez instalado y espera a que el icono de la ballena se ponga verde (Running).

### 3. Ollama (Tu IA Local)
-   **Descargar**: [https://ollama.com/download/windows](https://ollama.com/download/windows)
-   **Instalación**: Instala como cualquier programa.
-   **Configuración Rápida**:
    1.  Abre una terminal (Pulsa `Tecla Windows`, escribe `cmd` y dale a Enter).
    2.  Escribe el siguiente comando y pulsa Enter para descargar el modelo de inteligencia artificial:
        ```bash
        ollama pull llama3
        ```
    3.  Espera a que termine la descarga (son unos GBs).

---

## 🛠️ Puesta en Marcha

### Paso 1: Descargar el Proyecto
1.  Abre una terminal (`cmd` o `PowerShell`).
2.  Clona el repositorio (copia y pega):
    ```bash
    git clone -b develop-local https://github.com/SergioMartinAlvaro/AlphaSeeker.git
    cd AlphaSeeker
    ```

### Paso 2: Ejecutar la Aplicación
En la misma terminal, dentro de la carpeta `AlphaSeeker`, ejecuta:

```bash
docker-compose -f docker-compose.local.yml up --build -d
```
*   *Nota: La primera vez tardará unos minutos en descargar y construir todo.*

---

## ✅ ¿Cómo lo uso?

Una vez termine el paso anterior, abre tu navegador (Chrome/Edge):

1.  **n8n (Tu Panel de Control)**: [http://localhost:5678](http://localhost:5678)
    -   Crea tu usuario y contraseña.
    -   Importa tu flujo de trabajo (te pasaré el archivo `.json` aparte o búscalo en la carpeta `n8n-workflows`).
2.  **API IA (Estado)**: [http://localhost:8080/health](http://localhost:8080/health)
3.  **Scraper (Estado)**: [http://localhost:8000/health](http://localhost:8000/health)

---

## ❓ Preguntas Frecuentes

**¿La generación de imágenes no funciona?**
Correcto. En modo local está desactivada para no complicar la instalación con claves de Google Cloud.

**¿Ollama va lento?**
Depende de tu tarjeta gráfica. `llama3` es potente. Si va muy lento, prueba `ollama pull tinyllama` y cambia la configuración en el archivo `docker-compose.local.yml`.

**¿Cómo paro todo?**
En la terminal, dentro de la carpeta:
```bash
docker-compose -f docker-compose.local.yml down
```
