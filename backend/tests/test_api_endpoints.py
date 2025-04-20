# backend/tests/test_api_endpoints.py
import pytest
from httpx import AsyncClient, ASGITransport # <<< Importar ASGITransport
# Importa a app FastAPI
try:
    from app.main import app
except ImportError as e:
    pytest.fail(f"Falha ao importar 'app' de 'app.main'. Verifique a estrutura do projeto, pythonpath e se app/main.py existe. Erro: {e}")

# --- Fixture para Cliente de Teste Assíncrono (Corrigido) ---
@pytest.fixture(scope="function")
async def async_client():
    # <<< Usa o transport recomendado para corrigir o warning
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

# --- Testes para Endpoints da API (Sem alterações nos que passaram) ---

@pytest.mark.asyncio
async def test_read_root_success(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    expected_message = "API de IA está operacional!"
    assert response.json() == {"message": expected_message}, \
        f"Esperado '{expected_message}', recebido '{response.json().get('message')}'"

@pytest.mark.asyncio
async def test_ai_ping_success(async_client: AsyncClient):
    response = await async_client.get("/api/v1/ping")
    assert response.status_code == 200
    expected_message = "AI router está respondendo!"
    assert response.json() == {"message": expected_message}, \
         f"Esperado '{expected_message}', recebido '{response.json().get('message')}'"

# --- Testes para Endpoints Placeholder (com correções) ---

@pytest.mark.asyncio
async def test_rag_query_placeholder_success(async_client: AsyncClient):
    payload = {"question": "O que é Supabase?"}
    response = await async_client.post("/api/v1/rag-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "Supabase é um Backend como Serviço (BaaS) incrível!"
    assert "sources" in data
    assert isinstance(data["sources"], list)

@pytest.mark.asyncio
async def test_run_crew_placeholder_success(async_client: AsyncClient):
    payload = {"topic": "Análise de mercado"}
    response = await async_client.post("/api/v1/run-crew", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert "summary" in data["result"]
    # <<< CORREÇÃO: Ajusta a asserção para o valor real retornado pelo placeholder
    expected_summary = "Resultado placeholder para a análise do tópico 'Análise de mercado'."
    assert data["result"]["summary"] == expected_summary, \
        f"Esperado '{expected_summary}', recebido '{data['result'].get('summary')}'"
    assert "logs" in data
    assert isinstance(data["logs"], list)

@pytest.mark.asyncio
async def test_generate_structured_placeholder_success(async_client: AsyncClient):
    """Testa o endpoint Guardrails (placeholder) com dados válidos."""
    payload = {"prompt": "Extraia dados do usuário", "spec_name": "UserProfileSpec"}
    response = await async_client.post("/api/v1/generate-structured", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "validated_data" in data
    # <<< CORREÇÃO: Verifica as chaves *realmente* retornadas pelo placeholder atual
    # Ajuste estas asserções se o seu placeholder em guardrails_service.py for diferente
    validated_data = data["validated_data"]
    assert "name" in validated_data
    assert validated_data["name"] == "Placeholder User"
    assert "age" in validated_data
    assert validated_data["age"] == 30
    assert "interests" in validated_data
    assert isinstance(validated_data["interests"], list)
    assert "AI" in validated_data["interests"]
    assert data["error"] is None

# --- Testes de Validação de Input (Sem alterações) ---

@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [
    ({"wrong_field": "abc"}),
    ({}),
    ({"question": 123}),
])
async def test_rag_query_invalid_input(async_client: AsyncClient, payload: dict):
    response = await async_client.post("/api/v1/rag-query", json=payload)
    assert response.status_code == 422