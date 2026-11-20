
from uuid import uuid4
from app.agent import run_agent

thread_id = str(uuid4())

query = (
    "Find hotels in Goa for 2 guests "
    "from 2026-12-10 to 2026-12-15."
)

print("\n=== STEP 1: INITIAL REQUEST ===")

result = run_agent(
    query=query,
    thread_id=thread_id
)

print(result)

if result["status"] == "interrupted":

    print("\n=== STEP 2: APPROVE ALTERNATIVE DATES ===")

    result = run_agent(
        query="",
        thread_id=thread_id,
        approval="reject"
    )

    print("\n=== FINAL RESULT ===")
    print(result)

else:
    print("\nExpected an interrupt, but none occurred.")
