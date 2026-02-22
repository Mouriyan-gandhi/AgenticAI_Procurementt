import requests
import time
import json

print("Starting evaluation...")
res = requests.post("http://localhost:8000/api/evaluate/start")
print("Start response:", res.status_code, res.text)
if res.status_code != 200:
    exit(1)
eval_id = res.json()["eval_id"]

print("Waiting for awaiting_review...")
while True:
    status_res = requests.get(f"http://localhost:8000/api/evaluate/{eval_id}/status")
    if status_res.status_code != 200:
        print(f"Status endpoint returned {status_res.status_code}: {status_res.text}")
        break
    status = status_res.json()["status"]
    print(f"Current status: {status}")
    if status == "awaiting_review":
        break
    if status == "error":
        print("Error!")
        break
    time.sleep(2)

print("Submitting review...")
review_res = requests.post(
    f"http://localhost:8000/api/evaluate/{eval_id}/review",
    json={"action": "approve", "feedback": None}
)
print("Review response:", review_res.status_code, review_res.text)
