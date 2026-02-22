import requests, time

res = requests.post("http://localhost:8000/api/evaluate/start")
eval_id = res.json()["eval_id"]
print(f"Started {eval_id}")

while True:
    st = requests.get(f"http://localhost:8000/api/evaluate/{eval_id}/status").json()["status"]
    if st == "awaiting_review": break
    if st == "error":
        print("Error!")
        break
    time.sleep(2)

print("Re-evaluating...")
res = requests.post(
    f"http://localhost:8000/api/evaluate/{eval_id}/review",
    json={"action": "feedback", "feedback": "Needs to be cheaper"}
)
print("Re-eval requested", res.status_code)

while True:
    st = requests.get(f"http://localhost:8000/api/evaluate/{eval_id}/status").json()["status"]
    if st == "awaiting_review": 
        print("Back to review!")
        break
    if st == "error":
        print("Error again!")
        break
    time.sleep(2)
