from unittest.mock import patch, MagicMock
from src.application.services.gemini_service import GeminiService
from src.infrastructure.config.settings import settings

# Force API KEY for tests to pass the initial check
settings.GEMINI_API_KEY = "TEST_KEY"

@patch("google.generativeai.GenerativeModel")
def test_call_gemini_success(mock_model_cls):
    # Mocking the response
    mock_response = MagicMock()
    mock_response.text = '{"market_impact": "Positive", "sentiment": "BULLISH"}'
    
    mock_model_instance = MagicMock()
    mock_model_instance.generate_content.return_value = mock_response
    mock_model_cls.return_value = mock_model_instance
    
    # Execute
    result = GeminiService.call_gemini("Test Prompt")
    
    # Verify
    assert result["sentiment"] == "BULLISH"
    assert result["market_impact"] == "Positive"

@patch("google.generativeai.GenerativeModel")
def test_call_gemini_json_correction(mock_model_cls):
    # Mocking a malformed response first, then a repaired one (or just handling it via regex inside call_gemini)
    mock_response = MagicMock()
    # The service uses a regex fallback effectively, let's test that
    mock_response.text = '```json\n{"sentiment": "NEUTRAL"}\n```'
    
    mock_model_instance = MagicMock()
    mock_model_instance.generate_content.return_value = mock_response
    mock_model_cls.return_value = mock_model_instance

    result = GeminiService.call_gemini("Test Prompt")
    assert result["sentiment"] == "NEUTRAL"
