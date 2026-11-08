
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.graph.state import AgentState
from app.graph.nodes import (
    agent_node,
    tool_node,
    should_continue,
    route_after_tool,
    prepare_alternative_dates_node,
    human_approval_node,
    route_after_approval
)

# Step 1: Create graph builder
workflow = StateGraph(AgentState)

# Step 2: Register nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node(
    "prepare_alternatives",
    prepare_alternative_dates_node
)
workflow.add_node("human_approval", human_approval_node)

# Step 3: Define starting point
workflow.add_edge(START, "agent")

# Step 4: Agent routing
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

# Step 5: Route after tool execution
workflow.add_conditional_edges(
    "tools",
    route_after_tool,
    {
        "agent": "agent",
        "human_approval": "prepare_alternatives"
    }
)

# Step 6: Prepare alternative dates
workflow.add_edge(
    "prepare_alternatives",
    "human_approval"
)

# Step 7: Route based on human approval
workflow.add_conditional_edges(
    "human_approval",
    route_after_approval,
    {
        "agent": "agent",
        "end": END
    }
)

# Step 8: Configure checkpointing
memory = MemorySaver()

graph = workflow.compile(
    checkpointer=memory
)

print(graph.get_graph().draw_ascii())
