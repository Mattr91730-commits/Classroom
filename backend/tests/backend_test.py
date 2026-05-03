"""ClassBank backend tests - uses seeded session test_session_classbank."""
import os, requests, pytest

BASE = os.environ.get('REACT_APP_BACKEND_URL', 'https://student-bank-hub.preview.emergentagent.com').rstrip('/')
TEACHER_TOKEN = 'test_session_classbank'
H = {"Authorization": f"Bearer {TEACHER_TOKEN}", "Content-Type": "application/json"}

# module-level state for cross-test sharing
state = {}

def api(method, path, **kw):
    return requests.request(method, f"{BASE}/api{path}", timeout=30, **kw)

def test_root():
    r = api("GET", "/")
    assert r.status_code == 200
    assert r.json().get("app") == "ClassBank"

def test_auth_me_teacher():
    r = api("GET", "/auth/me", headers=H)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["role"] == "teacher"
    assert data["user"]["classroom_username"] == "mrsmith"

def test_auth_me_unauth():
    r = api("GET", "/auth/me")
    assert r.status_code == 401

def test_update_classroom():
    r = api("PUT", "/classroom", headers=H, json={"classroom_name": "Mrs. Smith Class", "currency_symbol": "$"})
    assert r.status_code == 200
    assert r.json()["classroom_name"] == "Mrs. Smith Class"

def test_student_pin_validation():
    r = api("POST", "/students", headers=H, json={"name": "BadPin", "pin": "12"})
    assert r.status_code == 400

def test_create_student_and_get():
    r = api("POST", "/students", headers=H, json={"name": "Alice Johnson", "pin": "1234", "starting_balance": 50})
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["name"] == "Alice Johnson" and s["balance"] == 50.0
    state["student_id"] = s["student_id"]
    # verify list
    r2 = api("GET", "/students", headers=H)
    assert r2.status_code == 200
    assert any(x["student_id"] == s["student_id"] for x in r2.json())

def test_update_student():
    sid = state["student_id"]
    r = api("PUT", f"/students/{sid}", headers=H, json={"name": "Alice J"})
    assert r.status_code == 200
    assert r.json()["name"] == "Alice J"

def test_students_by_classroom():
    r = api("GET", "/auth/students-by-classroom/mrsmith")
    assert r.status_code == 200
    data = r.json()
    assert "students" in data and len(data["students"]) >= 1
    assert "pin" not in data["students"][0]

def test_student_login():
    sid = state["student_id"]
    r = api("POST", "/auth/student/login", json={"classroom_username": "mrsmith", "student_id": sid, "pin": "1234"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "session_token" in j
    state["student_token"] = j["session_token"]

def test_student_login_wrong_pin():
    sid = state["student_id"]
    r = api("POST", "/auth/student/login", json={"classroom_username": "mrsmith", "student_id": sid, "pin": "9999"})
    assert r.status_code == 401

def test_jobs_crud_and_assign():
    r = api("POST", "/jobs", headers=H, json={"title": "Janitor", "salary": 10, "slots": 2})
    assert r.status_code == 200
    jid = r.json()["job_id"]
    state["job_id"] = jid
    r = api("GET", "/jobs", headers=H); assert r.status_code == 200 and len(r.json()) >= 1
    r = api("PUT", f"/jobs/{jid}", headers=H, json={"salary": 15})
    assert r.status_code == 200 and r.json()["salary"] == 15
    r = api("POST", "/jobs/assign", headers=H, json={"student_id": state["student_id"], "job_id": jid})
    assert r.status_code == 200

def test_pay_salaries():
    r = api("POST", "/jobs/pay-salaries", headers=H)
    assert r.status_code == 200
    assert r.json()["count"] >= 1

def test_pay_all_bonus_and_fine():
    r = api("POST", "/pay-all", headers=H, json={"category": "Homework", "amount": 5, "student_ids": [state["student_id"]], "is_fine": False, "note": "good"})
    assert r.status_code == 200 and r.json()["count"] == 1
    r = api("POST", "/pay-all", headers=H, json={"category": "Late", "amount": 2, "student_ids": [state["student_id"]], "is_fine": True})
    assert r.status_code == 200

def test_bills_crud_and_charge():
    r = api("POST", "/bills", headers=H, json={"name": "Rent", "amount": 3})
    assert r.status_code == 200
    bid = r.json()["bill_id"]
    r = api("PUT", f"/bills/{bid}", headers=H, json={"amount": 4})
    assert r.status_code == 200 and r.json()["amount"] == 4
    r = api("POST", "/bills/charge", headers=H, json={"bill_id": bid, "student_ids": [state["student_id"]]})
    assert r.status_code == 200 and r.json()["count"] == 1

def test_store_crud_and_purchase():
    r = api("POST", "/store/items", headers=H, json={"name": "Pencil", "price": 1, "stock": 5})
    assert r.status_code == 200
    iid = r.json()["item_id"]
    r = api("GET", "/store/items", headers=H); assert r.status_code == 200
    # purchase as student
    sh = {"Authorization": f"Bearer {state['student_token']}", "Content-Type": "application/json"}
    r = api("POST", "/store/purchase", headers=sh, json={"item_id": iid})
    assert r.status_code == 200, r.text

def test_applications_flow():
    r = api("POST", "/applications", headers=H, json={"title": "Why Janitor?", "questions": ["Why?"]})
    assert r.status_code == 200
    aid = r.json()["application_id"]
    sh = {"Authorization": f"Bearer {state['student_token']}", "Content-Type": "application/json"}
    r = api("POST", "/applications/submit", headers=sh, json={"application_id": aid, "answers": ["I like it"]})
    assert r.status_code == 200
    r = api("GET", "/applications/responses/all", headers=H)
    assert r.status_code == 200 and len(r.json()) >= 1

def test_transactions_teacher_and_student():
    r = api("GET", "/transactions", headers=H)
    assert r.status_code == 200 and len(r.json()) >= 1
    sh = {"Authorization": f"Bearer {state['student_token']}"}
    r = api("GET", "/transactions", headers=sh)
    assert r.status_code == 200

def test_delete_student():
    sid = state["student_id"]
    r = api("DELETE", f"/students/{sid}", headers=H)
    assert r.status_code == 200
