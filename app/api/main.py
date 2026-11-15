
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.agent import run_agent


app = FastAPI(
    title="VoyageAI API",
    description="AI-powered travel planning assistant",
    version="1.0.0"
)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VoyageAI API"
    }


@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        thread_id = str(uuid4())

        result = run_agent(
            query=request.query,
            thread_id=thread_id
        )

        return result

    except Exception as error:
        print(f"Chat API error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process travel request."
        ) from error



class ApprovalRequest(BaseModel):
    thread_id: str = Field(min_length=1)
    decision: str = Field(pattern="^(approve|reject)$")


@app.post("/api/approval")
def submit_approval(request: ApprovalRequest):
    try:
        result = run_agent(
            query="",
            thread_id=request.thread_id,
            approval=request.decision
        )

        return result

    except Exception as error:
        print(f"Approval API error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process approval request."
        ) from error
