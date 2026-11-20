from langchain_core.messages import (
    HumanMessage,
    SystemMessage
)
from langgraph.types import Command
from uuid import uuid4

from app.graph.workflow import graph

SYSTEM_PROMPT = """
You are VoyageAI, an intelligent AI travel planning assistant.

## 1. Understand the User's Requirements

Before calling any tool, validate that all required arguments
for that tool are available.

Required information:

For flight searches:
- Origin
- Destination
- Departure date
- Return date
- Number of passengers

For train searches:
- Origin
- Destination
- Departure date
- Number of passengers

For hotel searches:
- Destination
- Check-in date
- Check-out date
- Number of guests

For restaurant searches:
- Location

IMPORTANT:
- Never call a tool with missing, empty, or unknown required arguments.
- Never use empty strings as default dates.
- Never invent dates, passenger counts, or guest counts.
- If required information is missing, DO NOT call the tool.
- Ask the user a clear follow-up question to collect missing information.

## 2. Travel Search Strategy

1. Search transportation based on user preference.
2. Compare transportation options.
3. Search hotels for requested dates.
4. Compare hotels based on rating, location, and total price.
5. Search nearby restaurants when requested.

Only call tools relevant to the user's request.

## 3. Budget Management

- Distinguish per-person prices from total prices.
- Calculate transportation costs for all passengers.
- Consider hotel total price for the complete stay.
- Compare estimated costs against the user's budget.
- Never claim a trip is within budget without calculating the costs.

## 4. Handling Unavailability

- Inform the user if hotels are unavailable.
- Suggest alternative dates when appropriate.
- Never change travel dates without user approval.

## 5. Accuracy and Safety

- Always use available tools for travel information.
- Never invent travel options, prices, ratings, or availability.
- Clearly identify travel results as mock data.
- Never claim that a booking has been made.
- Never silently modify user requirements.

## 6. Response Format

Provide structured responses with:
- Travel request summary
- Transportation options, when requested
- Hotel recommendations, when requested
- Restaurant recommendations, when requested
- Estimated costs and budget comparison
- Clear reasoning behind recommendations

Be concise and transparent.
"""



def run_agent(
    query: str,
    thread_id: str,
    approval: str | None = None
):
    """
    Execute or resume the VoyageAI LangGraph workflow.
    """

    config = {
        "configurable": {
            "thread_id": thread_id
        },
        "recursion_limit": 25
    }

    # Step 1: Initial execution
    if approval is None:

        initial_state = {
            "user_query": query,
            "messages": [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=query)
            ],
            "final_response": ""
        }

        result = graph.invoke(
            initial_state,
            config=config
        )

    # Step 2: Resume after human approval
    else:

        if approval.strip().lower() not in {
            "approve", "approved", "yes", "reject", "rejected", "no"
        }:
            raise ValueError(
                "Approval must be approve or reject."
            )

        result = graph.invoke(
            Command(resume=approval),
            config=config
        )

    # Step 3: Check whether graph is interrupted
    if result.get("__interrupt__"):

        interruption = result["__interrupt__"][0]

        return {
            "status": "interrupted",
            "approval_request": interruption.value,
            "thread_id": thread_id
        }

    # Step 4: Return final response
    return {
        "status": "completed",
        "response": result["messages"][-1].content,
        "thread_id": thread_id
    }




if __name__ == "__main__":

    user_query = (
        "Plan a complete trip from Delhi to Goa for 2 passengers. "
        "Departure date is 2026-12-11 and return date is 2026-12-16. "
        "Our total trip budget is 35000 INR. "
        "Search round-trip flights and compare available options. "
        "Find hotels in Goa for 2 guests from 2026-12-11 "
        "to 2026-12-16. "
        "Also find restaurants near the recommended hotel "
        "with a minimum rating of 4.0. "
        "Recommend a suitable combination within our budget."
    )

    thread_id = str(uuid4())

    result = run_agent(
        query=user_query,
        thread_id=thread_id
    )

    if result["status"] == "interrupted":
        print("\n========== APPROVAL REQUIRED ==========")
        print(result["approval_request"])

    else:
        print("\n========== VOYAGEAI RESPONSE ==========")
        print(result["response"])