
from fastapi import APIRouter, HTTPException

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
)

from app.graph.workflow import graph


router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)



@router.get("")
def list_conversations():
    """
    List recent conversations from LangGraph checkpoints.

    Development-only: requires authentication before
    exposing conversation data in production.
    """

    try:
        # Step 1: Collect thread IDs first.
        # Finish checkpoint iteration before calling get_state().
        thread_ids = []
        seen_threads = set()

        for checkpoint in graph.checkpointer.list(None, limit=200):
            thread_id = checkpoint.config["configurable"]["thread_id"]

            if thread_id not in seen_threads:
                seen_threads.add(thread_id)
                thread_ids.append(thread_id)

        # Step 2: Read conversation snapshots separately.
        conversations = []

        for thread_id in thread_ids:
            config = {
                "configurable": {
                    "thread_id": thread_id
                }
            }

            snapshot = graph.get_state(config)

            messages = snapshot.values.get("messages", [])

            first_user_message = next(
                (
                    message.content
                    for message in messages
                    if isinstance(message, HumanMessage)
                    and isinstance(message.content, str)
                ),
                None,
            )

            if not first_user_message:
                continue

            conversations.append({
                "thread_id": thread_id,
                "title": first_user_message[:60],
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
            flush=True
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to list conversations."
        ) from error


@router.get("/{thread_id}")
def get_conversation(thread_id: str):
    """
    Retrieve messages from a saved LangGraph conversation.
    """

    try:
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }

        snapshot = graph.get_state(config)

        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        messages = []

        for message in snapshot.values.get("messages", []):

            # User messages
            if isinstance(message, HumanMessage):
                messages.append({
                    "role": "user",
                    "content": message.content,
                })

            # Assistant messages
            elif isinstance(message, AIMessage):

                # Skip internal tool-calling messages
                if message.tool_calls:
                    continue

                # Skip empty assistant messages
                if not message.content:
                    continue

                messages.append({
                    "role": "assistant",
                    "content": message.content,
                })

        return {
            "thread_id": thread_id,
            "messages": messages,
            "status": (
                "interrupted"
                if snapshot.next
                else "completed"
            )
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversation."
        )
