
import sqlite3
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from langchain_core.messages import HumanMessage, AIMessage

from app.graph.workflow import graph


router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)

# Store conversation titles separately from LangGraph checkpoints.
BASE_DIR = Path(__file__).resolve().parents[2]
METADATA_DB = BASE_DIR / "conversation_metadata.db"


# -----------------------------
# Metadata database
# -----------------------------

def get_metadata_connection():
    connection = sqlite3.connect(
        METADATA_DB,
        timeout=10,
    )
    connection.row_factory = sqlite3.Row
    return connection


def initialize_metadata_db():
    with get_metadata_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS conversation_metadata (
                thread_id TEXT PRIMARY KEY,
                custom_title TEXT,
                updated_at TEXT NOT NULL
                    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )
            """
        )


initialize_metadata_db()


def get_custom_title(thread_id: str):
    with get_metadata_connection() as connection:
        row = connection.execute(
            """
            SELECT custom_title
            FROM conversation_metadata
            WHERE thread_id = ?
            """,
            (thread_id,),
        ).fetchone()

    return row["custom_title"] if row else None


def get_custom_titles(thread_ids: list[str]):
    if not thread_ids:
        return {}

    placeholders = ",".join("?" for _ in thread_ids)

    with get_metadata_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT thread_id, custom_title
            FROM conversation_metadata
            WHERE thread_id IN ({placeholders})
            """,
            thread_ids,
        ).fetchall()

    return {
        row["thread_id"]: row["custom_title"]
        for row in rows
    }


def get_snapshot(thread_id: str):
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    return graph.get_state(config)


# -----------------------------
# Request validation
# -----------------------------

class RenameConversationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str):
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Title cannot be empty.")

        return cleaned


# -----------------------------
# GET /api/conversations
# -----------------------------

@router.get("")
def list_conversations():
    """
    List recent conversations saved by LangGraph.

    Development-only:
    Authentication is required before production deployment.
    """

    try:
        thread_ids = []
        seen_threads = set()

        # Collect IDs first to avoid nested checkpointer access.
        for checkpoint in graph.checkpointer.list(
            None,
            limit=200,
        ):
            thread_id = checkpoint.config[
                "configurable"
            ]["thread_id"]

            if thread_id not in seen_threads:
                seen_threads.add(thread_id)
                thread_ids.append(thread_id)

        # Metadata lookup happens after checkpoint iteration.
        custom_titles = get_custom_titles(thread_ids)

        conversations = []

        for thread_id in thread_ids:
            snapshot = get_snapshot(thread_id)

            messages = snapshot.values.get("messages", [])

            first_user_message = next(
                (
                    message.content
                    for message in messages
                    if isinstance(message, HumanMessage)
                    and isinstance(message.content, str)
                    and message.content.strip()
                ),
                None,
            )

            if not first_user_message:
                continue

            title = (
                custom_titles.get(thread_id)
                or first_user_message[:60]
            )

            conversations.append({
                "thread_id": thread_id,
                "title": title,
                "status": (
                    "interrupted"
                    if snapshot.next
                    else "completed"
                ),
            })

        return {
            "conversations": conversations
        }

    except Exception as error:
        print(
            f"Conversation listing error: {error}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to list conversations.",
        ) from error


# -----------------------------
# GET /api/conversations/{thread_id}
# -----------------------------

@router.get("/{thread_id}")
def get_conversation(thread_id: str):
    """
    Retrieve saved user and assistant messages.
    """

    try:
        snapshot = get_snapshot(thread_id)

        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        messages = []

        for message in snapshot.values.get("messages", []):

            if isinstance(message, HumanMessage):
                if not isinstance(message.content, str):
                    continue

                messages.append({
                    "role": "user",
                    "content": message.content,
                })

            elif isinstance(message, AIMessage):

                # Do not display internal tool calls.
                if message.tool_calls:
                    continue

                if (
                    not isinstance(message.content, str)
                    or not message.content.strip()
                ):
                    continue

                messages.append({
                    "role": "assistant",
                    "content": message.content,
                })

        return {
            "thread_id": thread_id,
            "title": get_custom_title(thread_id),
            "messages": messages,
            "status": (
                "interrupted"
                if snapshot.next
                else "completed"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Conversation retrieval error: {error}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversation.",
        ) from error


# -----------------------------
# PATCH /api/conversations/{thread_id}
# -----------------------------

@router.patch("/{thread_id}")
def rename_conversation(
    thread_id: str,
    request: RenameConversationRequest,
):
    """
    Rename a conversation without modifying LangGraph memory.
    """

    try:
        snapshot = get_snapshot(thread_id)

        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        with get_metadata_connection() as connection:
            connection.execute(
                """
                INSERT INTO conversation_metadata (
                    thread_id,
                    custom_title,
                    updated_at
                )
                VALUES (
                    ?,
                    ?,
                    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                )

                ON CONFLICT(thread_id)
                DO UPDATE SET
                    custom_title = excluded.custom_title,
                    updated_at = excluded.updated_at
                """,
                (
                    thread_id,
                    request.title,
                ),
            )

        return {
            "thread_id": thread_id,
            "title": request.title,
            "message": "Conversation renamed successfully",
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Conversation rename error: {error}",
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to rename conversation.",
        ) from error


# ---------------------------------------
# DELETE /api/conversations/{thread_id}
# ---------------------------------------

@router.delete("/{thread_id}")
def delete_conversation(thread_id: str):
    """
    Permanently delete a conversation.

    Deletes:
    1. LangGraph checkpoints and writes
    2. Custom title metadata
    """

    try:
        # Step 1: Verify conversation exists
        snapshot = get_snapshot(thread_id)

        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        # Step 2: Delete LangGraph memory
        graph.checkpointer.delete_thread(thread_id)

        # Step 3: Delete conversation metadata
        with get_metadata_connection() as connection:
            connection.execute(
                """
                DELETE FROM conversation_metadata
                WHERE thread_id = ?
                """,
                (thread_id,)
            )

        return {
            "thread_id": thread_id,
            "message": "Conversation deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Conversation deletion error: {error}",
            flush=True
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation."
        ) from error
