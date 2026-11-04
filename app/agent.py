from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    ToolMessage
)

from app.llm import llm
from app.tools.langchain_tools import travel_tools

SYSTEM_PROMPT = """
You are VoyageAI, an intelligent AI travel assistant.

Your responsibilities:
1. Help users plan their trips.
2. Search flights, trains, hotels, and restaurants using available tools.
3. Compare available travel options and recommend suitable choices.
4. Consider the user's budget, dates, destination, and preferences.

Important rules:
1. Always use available tools to retrieve travel information.
2. Never invent flight, train, hotel, or restaurant information.
3. Clearly mention that the current travel data is mock data.
4. If hotels are unavailable, suggest alternative dates.
5. Never change the user's travel dates without their approval.
6. Do not claim that any booking has been made.
7. Provide clear and structured responses.
"""


llm_with_tools = llm.bind_tools(travel_tools)

tool_map = {
    tool.name: tool
    for tool in travel_tools
}


def run_agent(query: str):

    # Step 1: Store the user's request
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=query)
    ]

    # Step 2: Ask LLM to decide what to do
    response = llm_with_tools.invoke(messages)

    tool_rounds = 0
    max_tool_rounds = 5

    # Step 3: Continue while LLM requests tool execution
    while response.tool_calls and tool_rounds < max_tool_rounds:

        print("\nLLM requested tool execution:")

        # Preserve the AI message containing tool calls
        messages.append(response)

        for tool_call in response.tool_calls:

            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            print(f"\nExecuting tool: {tool_name}")

            selected_tool = tool_map.get(tool_name)

            if selected_tool is None:
                raise ValueError(f"Unknown tool: {tool_name}")

            # Step 4: Execute the selected tool
            result = selected_tool.invoke(tool_args)

            print("Tool execution completed.")

            # Step 5: Send tool result back as an observation
            messages.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=tool_call["id"],
                    name=tool_name
                )
            )

        # Step 6: Ask LLM to process the observations
        response = llm_with_tools.invoke(messages)

        tool_rounds += 1

    if response.tool_calls:
        raise RuntimeError("Maximum tool execution rounds reached.")

    # Step 7: Return final LLM response
    return response.content


if __name__ == "__main__":

    user_query = (
        "Find flights from Delhi to Goa on 2026-12-11 "
        "and return on 2026-12-16 for 2 passengers. "
        "Compare the available options and recommend one."
    )

    final_response = run_agent(user_query)

    print("\n========== VOYAGEAI RESPONSE ==========")
    print(final_response)
