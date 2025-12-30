# Guía de Instalación para Windows (Entorno Local)

Este documento te guiará paso a paso para ejecutar **AlphaSeeker** en tu ordenador Windows. 

⚠️ **Esta versión es 100% automática.** Se descarga y configura todo solo.

---

## 🚀 Requisitos Previos

Solo necesitas 2 cosas:

### 1. Git
-   **Descargar**: [https://git-scm.com/download/win](https://git-scm.com/download/win)
-   Dale a "Siguiente" todo el rato.

### 2. Docker Desktop
-   **Descargar**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
-   Instálalo y ábrelo. Espera a que la barrita de abajo a la izquierda esté en **VERDE**.

---

### 3. Comprobación Rápida
Antes de seguir, abre la terminal (`cmd`) y escribe:
```bash
docker-compose --version
```
-   **Si sale algo como** `Docker Compose version v2...`: ✅ Todo Perfecto.
-   **Si dice "no se reconoce..."**: ❌ Docker Desktop no se ha instalado bien o necesitas reiniciar el ordenador.

---

## 🛠️ Puesta en Marcha

### Paso Único: Ejecutar
1.  Abre una terminal (`cmd` o PowerShell).
2.  Copia y pega estos comandos:

    ```bash
    git clone -b develop-local https://github.com/SergioMartinAlvaro/AlphaSeeker.git
    cd AlphaSeeker
    docker-compose -f docker-compose.local.yml up --build -d
    ```
    *Nota: Si `docker-compose` te da error, prueba escribiéndolo con espacio: `docker compose ...`*

**¡Y YA ESTÁ!** 🎉

El sistema empezará a descargar:
1.  La base de datos.
2.  El servidor web.
3.  **La Inteligencia Artificial (Llama 3)** <- *Esto tardará un rato (son 4GB), ten paciencia.*

---

## ✅ ¿Cómo sé si ya terminó?

Espera unos minutos después de ejecutar la aplicación.

## Cómo lo uso

1.  **n8n (Tu Panel de Control)**: [http://localhost:5678](http://localhost:5678)
    -   Crea tu usuario y contraseña.
    -   Importa tu flujo de trabajo (te pasaré el archivo `.json` aparte o búscalo en la carpeta `n8n-workflows`).
2.  **AlphaSeeker Web (Frontend)**: [http://localhost:8085](http://localhost:8085)
3.  **AlphaSeeker API (Backend)**: [http://localhost:3000](http://localhost:3000)
4.  **API IA (Estado)**: [http://localhost:8080/health](http://localhost:8080/health)
5.  **Scraper (Estado)**: [http://localhost:8000/health](http://localhost:8000/health)

---

## ❓ Preguntas Frecuentes

**¿Tengo que instalar Ollama yo mismo?**
NO. Docker lo instala por ti dentro de la "caja" de la aplicación.

**¿Cómo paro la aplicación?**
En la terminal, escribe:
```bash
docker-compose -f docker-compose.local.yml down
```
