# AlphaSeeker News Scraper

## Descripción
Este servicio es un scraper de noticias profesional diseñado para ser utilizado dentro del ecosistema AlphaSeeker. Está construido en Python utilizando **FastAPI** y **BeautifulSoup**, y tiene como objetivo extraer contenido de artículos de noticias financieras (Reuters, foros, blogs) de manera estructurada para su posterior procesamiento en n8n.

**Características Principales:**
- **Legalidad y Ética:** Verifica automáticamente el archivo `robots.txt` del sitio objetivo antes de realizar cualquier petición, asegurando que el scraping esté permitido.
- **API REST:** Expone una interfaz HTTP sencilla para recibir URLs y devolver el contenido extraído.
- **Dockerizado:** Listo para desplegarse como un microservicio en la red de Docker.

## Instalación y Despliegue

Este servicio está configurado para ejecutarse mediante Docker Compose.

```bash
# Desde la raíz del proyecto AlphaSeeker
docker-compose up -d --build scraper
```

El servicio estará disponible en el puerto `8080` (o el que se haya configurado en `docker-compose.yml`).

## Uso de la API

### 1. Health Check
Verifica que el servicio esté funcionando.

- **Endpoint:** `GET /health`
- **Respuesta:** `{"status": "ok"}`

### 2. Scrape URL
Extrae el contenido de una noticia.

- **Endpoint:** `POST /scrape`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "url": "https://www.reuters.com/markets/us/wall-street-ends-lower-yields-rise-2023-10-20/"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "title": "Wall Street ends lower as yields rise...",
    "content": "Texto completo del artículo...",
    "date": "2023-10-20T...",
    "url": "https://www.reuters.com/...",
    "status": "success"
  }
  ```
- **Respuesta de Error (403 Forbidden):**
  Si el `robots.txt` bloquea el acceso.
  ```json
  {
    "error": "Scraping not allowed by robots.txt",
    "url": "...",
    "status": "failed"
  }
  ```

## Integración con n8n

Para usar este servicio desde n8n:
1. Añade un nodo **HTTP Request**.
2. Configura el método como `POST`.
3. URL: `http://python_scraper:8080/scrape` (usando el nombre del contenedor en la red Docker).
4. En el cuerpo, envía el JSON con la URL que deseas procesar.

### Ejemplo CURL (desde dentro de la red Docker)
```bash
curl -X POST http://python_scraper:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.reuters.com/markets/us/wall-street-ends-lower-yields-rise-2023-10-20/"}'
```

### Ejemplo CURL (desde tu máquina local / terminal)
```bash
curl -X POST http://localhost:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://cointelegraph.com/news/what-happened-in-crypto-today?utm_source=rss_feed&utm_medium=rss%3Fvfff%3D1763940853%26_refresh%3Dek78dm%26_rnd%3Dek78dm%26ttt%3D1763940853376&utm_campaign=rss_partner_inbound"}'
```
