
from datetime import date, timedelta
import ast

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.types import interrupt

from app.llm import llm
from app.graph.state import AgentState
from app.tools.langchain_tools import travel_tools


# Bind travel tools with the LLM
llm_with_tools = llm.bind_tools(travel_tools)

# Map tool names to their implementations
tool_map = {tool.name: tool for tool in travel_tools}


def agent_node(state: AgentState):
    """
    Ask the LLM to decide the next action.
    """
    response = llm_with_tools.invoke(state["messages"])

    return {
        "messages": [response]
    }


def tool_node(state: AgentState):
    """
    Execute tools requested by the LLM.
    """
    last_message = state["messages"][-1]
    tool_messages = []

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        selected_tool = tool_map.get(tool_name)

        try:
            if selected_tool is None:
                raise ValueError(f"Unknown tool: {tool_name}")

            result = selected_tool.invoke(tool_args)

            print(f"Tool executed successfully: {tool_name}")

        except Exception as error:
            print(f"Tool execution failed: {tool_name}: {error}")

            result = {
                "status": "error",
                "tool": tool_name,
                "message": str(error)
            }

        tool_messages.append(
            ToolMessage(
                content=str(result),
                tool_call_id=tool_call["id"],
                name=tool_name
            )
        )

    return {
        "messages": tool_messages
    }


def should_continue(state: AgentState):
    """
    Decide whether to execute tools or finish.
    """
    last_message = state["messages"][-1]

    if getattr(last_message, "tool_calls", None):
        return "tools"

    return "end"


def get_unavailable_hotel_result(state: AgentState):
    """
    Find the unavailable hotel result in the latest
    tool-call batch, regardless of result order.
    """
    messages = state["messages"]

    last_ai_index = next(
        (
            i for i in range(len(messages) - 1, -1, -1)
            if getattr(messages[i], "tool_calls", None)
        ),
        None
    )

    if last_ai_index is None:
        return None

    for message in messages[last_ai_index + 1:]:
        if not isinstance(message, ToolMessage):
            continue

        if message.name != "hotel_search_tool":
            continue

        try:
            result = ast.literal_eval(message.content)
        except (ValueError, SyntaxError, TypeError):
            continue

        if (
            isinstance(result, dict)
            and result.get("status") == "unavailable"
            and result.get("requires_alternative_dates") is True
        ):
            return result

    return None


def route_after_tool(state: AgentState):
    """
    Check whether hotel unavailability requires approval.
    """
    hotel_result = get_unavailable_hotel_result(state)

    if hotel_result is not None:
        return "human_approval"

    return "agent"


def prepare_alternative_dates_node(state: AgentState):
    """
    Suggest shifting the hotel stay by one day.
    """
    hotel_result = get_unavailable_hotel_result(state)

    if hotel_result is None:
        raise ValueError("No unavailable hotel result found.")

    original_check_in = date.fromisoformat(
        hotel_result["check_in"]
    )

    original_check_out = date.fromisoformat(
        hotel_result["check_out"]
    )

    alternative_check_in = original_check_in + timedelta(days=1)
    alternative_check_out = original_check_out + timedelta(days=1)

    return {
        "original_check_in": original_check_in.isoformat(),
        "original_check_out": original_check_out.isoformat(),
        "alternative_check_in": alternative_check_in.isoformat(),
        "alternative_check_out": alternative_check_out.isoformat(),
        "approval_status": "pending"
    }


def human_approval_node(state: AgentState):
    """
    Pause execution until the user approves or rejects
    the suggested hotel dates.
    """
    approval = interrupt({
        "message": "Hotels are unavailable for your requested dates.",
        "original_check_in": state["original_check_in"],
        "original_check_out": state["original_check_out"],
        "suggested_check_in": state["alternative_check_in"],
        "suggested_check_out": state["alternative_check_out"],
        "question": (
            "Would you like to search hotels "
            "for these alternative dates?"
        ),
        "options": ["approve", "reject"]
    })

    if isinstance(approval, str):
        is_approved = approval.strip().lower() in {
            "yes", "approve", "approved"
        }
    else:
        is_approved = approval is True

    if is_approved:
        return {
            "approval_status": "approved",
            "messages": [
                HumanMessage(
                    content=(
                        "The user approved the alternative hotel dates. "
                        f"Search hotels from {state['alternative_check_in']} "
                        f"to {state['alternative_check_out']}. "
                        "Keep the same destination and guest count. "
                        "Do not modify the flight or train dates."
                    )
                )
            ]
        }

    return {
        "approval_status": "rejected",
        "final_response": (
            "You rejected the suggested alternative hotel dates. "
            "Your original travel dates have been preserved."
        ),
        "messages": [
            AIMessage(
                content=(
                    "Understood. I will keep your original travel dates "
                    "and will not search hotels using the suggested dates."
                )
            )
        ]
    }


def route_after_approval(state: AgentState):
    """
    Resume the agent if approved, otherwise end.
    """
    if state["approval_status"] == "approved":
        return "agent"

    return "end"
