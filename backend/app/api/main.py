
import traceback
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.agent import run_agent
from app.api.conversations import router as conversations_router


# FastAPI Application
app = FastAPI(
    title="VoyageAI API",
    description="AI-powered travel planning assistant",
    version="1.0.0",
)


# CORS Configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS", "DELETE",],
    allow_headers=["*"],
)

app.include_router(conversations_router)
# Request Models
class ChatRequest(BaseModel):
    query: str = Field(min_length=1)
    thread_id: str | None = None


class ApprovalRequest(BaseModel):
    thread_id: str = Field(min_length=1)
    decision: str = Field(pattern="^(approve|reject)$")


# Health Check Endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VoyageAI API",
    }


# Chat Endpoint
@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        thread_id = request.thread_id or str(uuid4())

        print(
            f"[CHAT] Starting agent | Thread ID: {thread_id}",
            flush=True,
        )

        result = run_agent(
            query=request.query,
            thread_id=thread_id,
        )

        print(
            f"[CHAT] Agent completed | Thread ID: {thread_id}",
            flush=True,
        )

        return result

    except Exception as error:
        print(
            f"\n[CHAT ERROR] {type(error).__name__}: {error}",
            flush=True,
        )

        # Print full traceback in backend terminal
        traceback.print_exc()

        # Keep internal error details hidden from frontend
        raise HTTPException(
            status_code=500,
            detail="Failed to process travel request.",
        ) from error


# Human Approval Endpoint
@app.post("/api/approval")
def submit_approval(request: ApprovalRequest):
    try:
        print(
            f"[APPROVAL] Thread ID: {request.thread_id} | "
            f"Decision: {request.decision}",
            flush=True,
        )

        result = run_agent(
            query="",
            thread_id=request.thread_id,
            approval=request.decision,
        )

        print(
            f"[APPROVAL] Processed successfully | "
            f"Thread ID: {request.thread_id}",
            flush=True,
        )

        return result

    except Exception as error:
        print(
            f"\n[APPROVAL ERROR] "
            f"{type(error).__name__}: {error}",
            flush=True,
        )

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail="Failed to process approval request.",
        ) from error
