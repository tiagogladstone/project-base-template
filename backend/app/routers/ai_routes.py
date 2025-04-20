# Copie e cole para criar/atualizar o arquivo backend/app/routers/ai_routes.py:
from fastapi import APIRouter, HTTPException, Body, status
import logging
# Importe os models Pydantic
from ..models.ai_models import RagQueryInput, RagResponse, CrewInput, CrewResponse, GuardrailsInput, GuardrailsResponse
# Importe os services (a lógica real estará lá)
# Estes imports podem dar erro no editor AGORA, mas devem funcionar quando a API rodar
from ..services import rag_service, crew_service, guardrails_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/rag-query", response_model=RagResponse, summary="Consulta RAG")
async def handle_rag_query(query: RagQueryInput = Body(...)):
    """Recebe uma pergunta e retorna uma resposta via RAG."""
    logger.info(f"Recebida consulta RAG: {query.question}")
    try:
        # Chama o serviço RAG (implementação virá na Fase 7)
        # Await necessário pois as funções de serviço serão async
        answer, sources = await rag_service.query_knowledge_base(query.question)
        return RagResponse(answer=answer, sources=sources)
    except rag_service.VectorStoreNotReadyError as e: # Exemplo de erro específico
         logger.warning(f"Erro RAG (Vector Store não pronto): {e}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        logger.error(f"Erro inesperado na consulta RAG: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao processar consulta RAG.")

@router.post("/run-crew", response_model=CrewResponse, summary="Executa uma Crew AI")
async def handle_run_crew(crew_input: CrewInput = Body(...)):
    """Inicia uma tarefa complexa usando uma equipe de agentes AI."""
    logger.info(f"Recebido pedido para rodar crew sobre: {crew_input.topic}")
    try:
        # Chama o serviço CrewAI (implementação virá na Fase 7)
        result, logs = await crew_service.run_specific_crew(crew_input.topic, crew_input.parameters)
        return CrewResponse(result=result, logs=logs)
    except ValueError as e: # Exemplo: Tópico não suportado
         logger.warning(f"Erro Crew (Input inválido): {e}")
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Erro inesperado ao rodar Crew: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao executar a Crew AI.")

@router.post("/generate-structured", response_model=GuardrailsResponse, summary="Gera dados estruturados com validação")
async def handle_generate_structured(guard_input: GuardrailsInput = Body(...)):
    """Usa Guardrails para gerar e validar dados a partir de um prompt."""
    logger.info(f"Recebido pedido para gerar dados estruturados com spec: {guard_input.spec_name}")
    try:
        # Chama o serviço Guardrails (implementação virá na Fase 7)
        validated_data = await guardrails_service.generate_and_validate(
            guard_input.prompt,
            guard_input.spec_name,
            guard_input.num_reasks
        )
        # Retorna sucesso com os dados validados
        return GuardrailsResponse(validated_data=validated_data, error=None)
    except guardrails_service.GuardrailsValidationError as e: # Exemplo erro específico
        logger.warning(f"Erro Guardrails (Validação falhou): {e}")
        # Retorna sucesso (status 200), mas com erro na resposta
        return GuardrailsResponse(validated_data=None, error=str(e))
    except FileNotFoundError as e: # Exemplo: Spec não encontrada
         logger.error(f"Erro Guardrails (Spec não encontrada): {e}")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Erro inesperado na geração com Guardrails: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro na geração estruturada.")

@router.get("/ping", summary="Verifica atividade do router AI")
async def ping():
    """Endpoint simples para verificar se o router AI está ativo."""
    logger.debug("AI Router Ping recebido")
    return {"message": "AI router está respondendo!"}