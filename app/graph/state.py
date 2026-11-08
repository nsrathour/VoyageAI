
from typing import TypedDict, Annotated, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    user_query: str

    messages: Annotated[
        list[BaseMessage],
        add_messages
    ]

    final_response: str

    # Original hotel dates requested by the user
    original_check_in: Optional[str]
    original_check_out: Optional[str]

    # Alternative dates suggested by VoyageAI
    alternative_check_in: Optional[str]
    alternative_check_out: Optional[str]

    # Human approval status
    approval_status: Optional[str]
