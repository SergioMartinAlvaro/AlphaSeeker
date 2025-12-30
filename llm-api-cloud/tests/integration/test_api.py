from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analyze_batch_endpoint(client: TestClient):
    payload = {
        "noticias": [
            {"text": "Apple stocks rise", "metadata": {"url": "http://apple.com"}}
        ],
        "callback_url": "http://localhost:5678/webhook"
    }
    response = client.post("/analyze-batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing_started"
    assert "job_id" in data

def test_image_batch_endpoint(client: TestClient):
    payload = {
        "items": [
            {"image_prompt": "Future city"}
        ],
        "callback_url": "http://localhost:5678/webhook"
    }
    response = client.post("/generate-images-batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
