"""
My Classroom Economy Backend - FastAPI server
Classroom economy app with Google Auth (teachers) and PIN auth (students).
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form, Header, Query
from fastapi.responses import Response as FastAPIResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid, logging, requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
import os
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.getenv("MONGO_URL")

if not mongo_url:
    raise Exception("MONGO_URL is missing")

client = AsyncIOMotorClient(mongo_url)

db_name = os.getenv("DB_NAME", "test")
db = client[db_name]
APP_NAME = os.environ.get('APP_NAME', 'classbank')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============ Models ============
class Teacher(BaseModel):
    user_id: str
    email: str
    name: str
    password: Optional[str] = None
    picture: Optional[str] = ""
    classroom_username: Optional[str] = None
    classroom_name: Optional[str] = "My Classroom"
    currency_symbol: str = "$"

class TeacherSignup(BaseModel):
    email: str
    password: str
    name: str


class TeacherLogin(BaseModel):
    email: str
    password: str

class ClassroomUpdate(BaseModel):
    classroom_username: Optional[str] = None
    classroom_name: Optional[str] = None
    currency_symbol: Optional[str] = None

class StudentCreate(BaseModel):
    name: str
    pin: str
    starting_balance: float = 0

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    pin: Optional[str] = None
    job_id: Optional[str] = None

class StudentLogin(BaseModel):
    classroom_username: str
    student_id: str
    pin: str

class JobCreate(BaseModel):
    title: str
    description: str = ""
    salary: float
    icon: str = "Briefcase"
    color: str = "#FDE047"
    slots: int = 1
    application_id: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[float] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    slots: Optional[int] = None
    application_id: Optional[str] = None

class AssignJob(BaseModel):
    student_id: str
    job_id: Optional[str] = None  # None to unassign

class StoreItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    stock: int = -1  # -1 = unlimited
    image_path: Optional[str] = None

class StoreItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_path: Optional[str] = None

class PurchaseRequest(BaseModel):
    item_id: str

class BillCreate(BaseModel):
    name: str
    amount: float
    description: str = ""

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None

class ChargeBillRequest(BaseModel):
    bill_id: str
    student_ids: List[str]

class PayAllRequest(BaseModel):
    category: str  # e.g. "Homework Complete", "Bonus", "Fine"
    amount: float
    student_ids: List[str]
    is_fine: bool = False
    note: str = ""

class ApplicationCreate(BaseModel):
    title: str
    questions: List[str]
    job_id: Optional[str] = None

class ApplicationSubmit(BaseModel):
    application_id: str
    answers: List[str]

class TransferRequest(BaseModel):
    student_id: str
    amount: float
    note: str = ""

# ============ Auth helpers ============
async def get_session_token(request: Request) -> Optional[str]:
    token = request.cookies.get("session_token")
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None

async def get_current_teacher(request: Request) -> dict:
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session or session.get("user_type") != "teacher":
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    teacher = await db.teachers.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=401, detail="Teacher not found")
    return teacher

async def get_current_student(request: Request) -> dict:
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session or session.get("user_type") != "student":
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    student = await db.students.find_one({"student_id": session["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=401, detail="Student not found")
    return student

# ============ App ============
app = FastAPI()

@app.get("/")
def home():
    return {"status": "backend is working"}

api_router = APIRouter(prefix="/api")

@app.on_event("startup")
async def startup():
    pass
    # ensure indexes
    await db.teachers.create_index("user_id", unique=True)
    await db.teachers.create_index("classroom_username", unique=True, sparse=True)
    await db.students.create_index("student_id", unique=True)
    await db.sessions.create_index("session_token", unique=True)

@api_router.get("/")
async def root():
    return {"app": "My Classroom Economy", "version": "1.0"}

# ---- Auth ----
@api_router.get("/test")
async def test():
    return {"ok": True}
@api_router.post("/auth/teacher/signup")
async def teacher_signup(body: TeacherSignup, response: Response):

    existing = await db.teachers.find_one(
        {"email": body.email},
        {"_id": 0}
    )

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = f"user_{uuid.uuid4().hex[:12]}"

    teacher = {
        "user_id": user_id,
        "email": body.email.lower(),
        "password": body.password,
        "name": body.name,
        "picture": "",
        "classroom_username": user_id,
        "classroom_name": "My Classroom",
        "currency_symbol": "$",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.teachers.insert_one(teacher)

    session_token = f"sess_{uuid.uuid4().hex}"

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    await db.sessions.insert_one({
        "session_token": session_token,
        "user_id": teacher["user_id"],
        "user_type": "teacher",
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
    key="session_token",
    value=session_token,
    httponly=True,
    secure=True,
    samesite="none",
    path="/",
    max_age=30 * 24 * 60 * 60,
)



    teacher.pop("password", None)

    return {
        "user": teacher,
        "session_token": session_token
    }
@api_router.post("/auth/teacher/login")
async def teacher_login(body: TeacherLogin, response: Response):

    teacher = await db.teachers.find_one(
        {"email": body.email.lower()},
        {"_id": 0}
    )

    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if teacher.get("password") != body.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session_token = f"sess_{uuid.uuid4().hex}"

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    await db.sessions.insert_one({
        "session_token": session_token,
        "user_id": teacher["user_id"],
        "user_type": "teacher",
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
    key="session_token",
    value=session_token,
    httponly=True,
    secure=True,
    samesite="none",
    path="/",
    max_age=30 * 24 * 60 * 60,
)



    teacher.pop("password", None)

    return {
        "user": teacher,
        "session_token": session_token
    }
@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")

    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    # TEMP FAKE AUTH (no external service)
    email = f"{session_id}@example.com"

    teacher = await db.teachers.find_one({"email": email}, {"_id": 0})

    if not teacher:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        teacher = {
            "user_id": user_id,
            "email": email,
            "name": "Teacher",
            "picture": "",
            "classroom_username": None,
            "classroom_name": "My Classroom",
            "currency_symbol": "$",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.teachers.insert_one(teacher)

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "session_token": session_token,
            "user_id": teacher["user_id"],
            "user_type": "teacher",
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60,
    )

    return {"user": teacher}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    if session["user_type"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": session["user_id"]}, {"_id": 0})
        return {"role": "teacher", "user": teacher}
    student = await db.students.find_one({"student_id": session["user_id"]}, {"_id": 0})
    return {"role": "student", "user": student}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = await get_session_token(request)
    if token:
        await db.sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"ok": True}

@api_router.get("/auth/students-by-classroom/{classroom_username}")
async def list_students_by_classroom(classroom_username: str):
    teacher = await db.teachers.find_one({"classroom_username": classroom_username}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Classroom not found")
    students = await db.students.find({"teacher_id": teacher["user_id"]}, {"_id": 0, "pin": 0}).to_list(500)
    return {"classroom_name": teacher.get("classroom_name", ""), "students": students}

@api_router.post("/auth/student/login")
async def student_login(body: StudentLogin, response: Response):
    teacher = await db.teachers.find_one({"classroom_username": body.classroom_username}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Classroom not found")
    student = await db.students.find_one({"student_id": body.student_id, "teacher_id": teacher["user_id"]}, {"_id": 0})
    if not student or student["pin"] != body.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    session_token = f"stu_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    await db.sessions.insert_one({
        "session_token": session_token,
        "user_id": student["student_id"],
        "user_type": "student",
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=30*24*60*60)
    student.pop("pin", None)
    return {"user": student, "session_token": session_token}

# ---- Teacher classroom settings ----
@api_router.get("/classroom")
async def get_classroom(teacher: dict = Depends(get_current_teacher)):
    return teacher

@api_router.put("/classroom")
async def update_classroom(body: ClassroomUpdate, teacher: dict = Depends(get_current_teacher)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "classroom_username" in update:
        existing = await db.teachers.find_one({"classroom_username": update["classroom_username"], "user_id": {"$ne": teacher["user_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    if update:
        await db.teachers.update_one({"user_id": teacher["user_id"]}, {"$set": update})
    return await db.teachers.find_one({"user_id": teacher["user_id"]}, {"_id": 0})

# ---- Students CRUD ----
@api_router.get("/students")
async def list_students(teacher: dict = Depends(get_current_teacher)):
    students = await db.students.find({"teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(500)
    return students

@api_router.post("/students")
async def create_student(body: StudentCreate, teacher: dict = Depends(get_current_teacher)):
    if len(body.pin) != 4 or not body.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    student_id = f"stu_{uuid.uuid4().hex[:10]}"
    doc = {
        "student_id": student_id,
        "teacher_id": teacher["user_id"],
        "name": body.name,
        "pin": body.pin,
        "balance": float(body.starting_balance),
        "job_id": None,
        "job_history": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.students.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/students/{student_id}")
async def get_student(student_id: str, teacher: dict = Depends(get_current_teacher)):
    student = await db.students.find_one({"student_id": student_id, "teacher_id": teacher["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Not found")
    return student

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, body: StudentUpdate, teacher: dict = Depends(get_current_teacher)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "pin" in update and (len(update["pin"]) != 4 or not update["pin"].isdigit()):
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    if update:
        await db.students.update_one({"student_id": student_id, "teacher_id": teacher["user_id"]}, {"$set": update})
    return await db.students.find_one({"student_id": student_id}, {"_id": 0})

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, teacher: dict = Depends(get_current_teacher)):
    await db.students.delete_one({"student_id": student_id, "teacher_id": teacher["user_id"]})
    return {"ok": True}

# ---- Jobs ----
@api_router.get("/jobs")
async def list_jobs(teacher: dict = Depends(get_current_teacher)):
    jobs = await db.jobs.find({"teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(500)
    return jobs

@api_router.post("/jobs")
async def create_job(body: JobCreate, teacher: dict = Depends(get_current_teacher)):
    job_id = f"job_{uuid.uuid4().hex[:10]}"
    doc = {
        "job_id": job_id,
        "teacher_id": teacher["user_id"],
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.jobs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/jobs/{job_id}")
async def update_job(job_id: str, body: JobUpdate, teacher: dict = Depends(get_current_teacher)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.jobs.update_one({"job_id": job_id, "teacher_id": teacher["user_id"]}, {"$set": update})
    return await db.jobs.find_one({"job_id": job_id}, {"_id": 0})

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, teacher: dict = Depends(get_current_teacher)):
    await db.jobs.delete_one({"job_id": job_id, "teacher_id": teacher["user_id"]})
    await db.students.update_many({"teacher_id": teacher["user_id"], "job_id": job_id}, {"$set": {"job_id": None}})
    return {"ok": True}

@api_router.post("/jobs/assign")
async def assign_job(body: AssignJob, teacher: dict = Depends(get_current_teacher)):
    student = await db.students.find_one({"student_id": body.student_id, "teacher_id": teacher["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    update_set = {"job_id": body.job_id}
    push = {}
    if body.job_id:
        job = await db.jobs.find_one({"job_id": body.job_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        push = {"job_history": {"job_id": body.job_id, "title": job["title"], "salary": job["salary"], "started_at": datetime.now(timezone.utc).isoformat()}}
    op: dict = {"$set": update_set}
    if push:
        op["$push"] = push
    await db.students.update_one({"student_id": body.student_id}, op)
    return {"ok": True}

from pymongo import UpdateOne

@api_router.post("/jobs/pay-salaries")
async def pay_salaries(teacher: dict = Depends(get_current_teacher)):
    students = await db.students.find({"teacher_id": teacher["user_id"], "job_id": {"$ne": None}}, {"_id": 0}).to_list(500)
    job_ids = list({s["job_id"] for s in students if s.get("job_id")})
    jobs_list = await db.jobs.find({"job_id": {"$in": job_ids}}, {"_id": 0}).to_list(500)
    jobs_dict = {j["job_id"]: j for j in jobs_list}
    now_iso = datetime.now(timezone.utc).isoformat()
    balance_ops = []
    txn_docs = []
    paid = []
    for s in students:
        job = jobs_dict.get(s["job_id"])
        if not job:
            continue
        amount = float(job["salary"])
        balance_ops.append(UpdateOne({"student_id": s["student_id"]}, {"$inc": {"balance": amount}}))
        txn_docs.append({
            "txn_id": f"txn_{uuid.uuid4().hex[:10]}",
            "teacher_id": teacher["user_id"],
            "student_id": s["student_id"],
            "type": "salary",
            "amount": amount,
            "category": f"Salary: {job['title']}",
            "note": "Weekly salary",
            "created_at": now_iso,
        })
        paid.append({"student_id": s["student_id"], "name": s["name"], "amount": amount})
    if balance_ops:
        await db.students.bulk_write(balance_ops)
        await db.transactions.insert_many(txn_docs)
    return {"paid": paid, "count": len(paid)}

# ---- Pay All (mass reward / fine) ----
@api_router.post("/pay-all")
async def pay_all(body: PayAllRequest, teacher: dict = Depends(get_current_teacher)):
    multiplier = -1 if body.is_fine else 1
    delta = multiplier * float(body.amount)
    txn_type = "fine" if body.is_fine else "bonus"
    valid_students = await db.students.find(
        {"student_id": {"$in": body.student_ids}, "teacher_id": teacher["user_id"]},
        {"_id": 0, "student_id": 1},
    ).to_list(500)
    valid_ids = [s["student_id"] for s in valid_students]
    if valid_ids:
        await db.students.update_many({"student_id": {"$in": valid_ids}}, {"$inc": {"balance": delta}})
        now_iso = datetime.now(timezone.utc).isoformat()
        await db.transactions.insert_many([{
            "txn_id": f"txn_{uuid.uuid4().hex[:10]}",
            "teacher_id": teacher["user_id"],
            "student_id": sid,
            "type": txn_type,
            "amount": delta,
            "category": body.category,
            "note": body.note,
            "created_at": now_iso,
        } for sid in valid_ids])
    return {"results": [{"student_id": sid, "amount": delta} for sid in valid_ids], "count": len(valid_ids)}

@api_router.post("/transfer")
async def transfer(body: TransferRequest, teacher: dict = Depends(get_current_teacher)):
    s = await db.students.find_one({"student_id": body.student_id, "teacher_id": teacher["user_id"]}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    await db.students.update_one({"student_id": body.student_id}, {"$inc": {"balance": float(body.amount)}})
    txn_type = "deposit" if body.amount >= 0 else "withdrawal"
    await db.transactions.insert_one({
        "txn_id": f"txn_{uuid.uuid4().hex[:10]}",
        "teacher_id": teacher["user_id"],
        "student_id": body.student_id,
        "type": txn_type,
        "amount": float(body.amount),
        "category": "Manual Adjustment",
        "note": body.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}

# ---- Store ----
@api_router.get("/store/items")
async def list_store_items(request: Request):
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    if session["user_type"] == "teacher":
        teacher_id = session["user_id"]
    else:
        student = await db.students.find_one({"student_id": session["user_id"]}, {"_id": 0})
        teacher_id = student["teacher_id"]
    items = await db.store_items.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(500)
    return items

@api_router.post("/store/items")
async def create_store_item(body: StoreItemCreate, teacher: dict = Depends(get_current_teacher)):
    item_id = f"itm_{uuid.uuid4().hex[:10]}"
    doc = {
        "item_id": item_id,
        "teacher_id": teacher["user_id"],
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.store_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/store/items/{item_id}")
async def update_store_item(item_id: str, body: StoreItemUpdate, teacher: dict = Depends(get_current_teacher)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.store_items.update_one({"item_id": item_id, "teacher_id": teacher["user_id"]}, {"$set": update})
    return await db.store_items.find_one({"item_id": item_id}, {"_id": 0})

@api_router.delete("/store/items/{item_id}")
async def delete_store_item(item_id: str, teacher: dict = Depends(get_current_teacher)):
    await db.store_items.delete_one({"item_id": item_id, "teacher_id": teacher["user_id"]})
    return {"ok": True}

@api_router.post("/store/purchase")
async def purchase(body: PurchaseRequest, student: dict = Depends(get_current_student)):
    item = await db.store_items.find_one({"item_id": body.item_id, "teacher_id": student["teacher_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.get("stock", -1) == 0:
        raise HTTPException(status_code=400, detail="Out of stock")
    if student["balance"] < item["price"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    await db.students.update_one({"student_id": student["student_id"]}, {"$inc": {"balance": -float(item["price"])}})
    if item.get("stock", -1) > 0:
        await db.store_items.update_one({"item_id": body.item_id}, {"$inc": {"stock": -1}})
    await db.transactions.insert_one({
        "txn_id": f"txn_{uuid.uuid4().hex[:10]}",
        "teacher_id": student["teacher_id"],
        "student_id": student["student_id"],
        "type": "purchase",
        "amount": -float(item["price"]),
        "category": f"Store: {item['name']}",
        "note": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}

# ---- Bills ----
@api_router.get("/bills")
async def list_bills(teacher: dict = Depends(get_current_teacher)):
    bills = await db.bills.find({"teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(500)
    return bills

@api_router.post("/bills")
async def create_bill(body: BillCreate, teacher: dict = Depends(get_current_teacher)):
    bill_id = f"bill_{uuid.uuid4().hex[:10]}"
    doc = {
        "bill_id": bill_id,
        "teacher_id": teacher["user_id"],
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bills.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/bills/{bill_id}")
async def update_bill(bill_id: str, body: BillUpdate, teacher: dict = Depends(get_current_teacher)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.bills.update_one({"bill_id": bill_id, "teacher_id": teacher["user_id"]}, {"$set": update})
    return await db.bills.find_one({"bill_id": bill_id}, {"_id": 0})

@api_router.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, teacher: dict = Depends(get_current_teacher)):
    await db.bills.delete_one({"bill_id": bill_id, "teacher_id": teacher["user_id"]})
    return {"ok": True}

@api_router.post("/bills/charge")
async def charge_bill(body: ChargeBillRequest, teacher: dict = Depends(get_current_teacher)):
    bill = await db.bills.find_one({"bill_id": body.bill_id, "teacher_id": teacher["user_id"]}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    amount = -float(bill["amount"])
    now_iso = datetime.now(timezone.utc).isoformat()
    if body.student_ids:
        await db.students.update_many(
            {"student_id": {"$in": body.student_ids}, "teacher_id": teacher["user_id"]},
            {"$inc": {"balance": amount}},
        )
        await db.transactions.insert_many([{
            "txn_id": f"txn_{uuid.uuid4().hex[:10]}",
            "teacher_id": teacher["user_id"],
            "student_id": sid,
            "type": "bill",
            "amount": amount,
            "category": f"Bill: {bill['name']}",
            "note": "",
            "created_at": now_iso,
        } for sid in body.student_ids])
    return {"ok": True, "count": len(body.student_ids)}

# ---- Applications ----
@api_router.get("/applications")
async def list_applications(teacher: dict = Depends(get_current_teacher)):
    apps = await db.applications.find({"teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(200)
    return apps

@api_router.post("/applications")
async def create_application(body: ApplicationCreate, teacher: dict = Depends(get_current_teacher)):
    app_id = f"app_{uuid.uuid4().hex[:10]}"
    doc = {
        "application_id": app_id,
        "teacher_id": teacher["user_id"],
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.applications.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/applications/{application_id}")
async def delete_application(application_id: str, teacher: dict = Depends(get_current_teacher)):
    await db.applications.delete_one({"application_id": application_id, "teacher_id": teacher["user_id"]})
    return {"ok": True}

@api_router.get("/applications/{application_id}")
async def get_application(application_id: str, request: Request):
    app_doc = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Not found")
    return app_doc

@api_router.post("/applications/submit")
async def submit_application(body: ApplicationSubmit, student: dict = Depends(get_current_student)):
    app_doc = await db.applications.find_one({"application_id": body.application_id, "teacher_id": student["teacher_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    response_id = f"resp_{uuid.uuid4().hex[:10]}"
    doc = {
        "response_id": response_id,
        "teacher_id": student["teacher_id"],
        "application_id": body.application_id,
        "student_id": student["student_id"],
        "student_name": student["name"],
        "answers": body.answers,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.application_responses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/applications/{application_id}/responses")
async def list_responses(application_id: str, teacher: dict = Depends(get_current_teacher)):
    responses = await db.application_responses.find({"application_id": application_id, "teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(500)
    return responses

@api_router.get("/applications/responses/all")
async def list_all_responses(teacher: dict = Depends(get_current_teacher)):
    responses = await db.application_responses.find({"teacher_id": teacher["user_id"]}, {"_id": 0}).to_list(500)
    return responses

# ---- Transactions ----
@api_router.get("/transactions")
async def list_transactions(request: Request, student_id: Optional[str] = None):
    token = await get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    if session["user_type"] == "teacher":
        q: dict = {"teacher_id": session["user_id"]}
        if student_id:
            q["student_id"] = student_id
    else:
        q = {"student_id": session["user_id"]}
    txns = await db.transactions.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return txns

# ---- Student-facing ----
@api_router.get("/me/student")
async def my_student(student: dict = Depends(get_current_student)):
    student.pop("pin", None)
    job = None
    if student.get("job_id"):
        job = await db.jobs.find_one({"job_id": student["job_id"]}, {"_id": 0})
    return {"student": student, "job": job}

@api_router.get("/me/jobs-available")
async def jobs_available(student: dict = Depends(get_current_student)):
    jobs = await db.jobs.find({"teacher_id": student["teacher_id"]}, {"_id": 0}).to_list(200)
    return jobs

@api_router.get("/me/bills-due")
async def bills_due(student: dict = Depends(get_current_student)):
    bills = await db.bills.find({"teacher_id": student["teacher_id"]}, {"_id": 0}).to_list(200)
    return bills

# ---- File upload / download ----
@api_router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    teacher: dict = Depends(get_current_teacher)
):
    import base64

    ext = (
        file.filename.split(".")[-1]
        if file.filename and "." in file.filename
        else "bin"
    ).lower()

    file_id = uuid.uuid4().hex

    path = f"{APP_NAME}/uploads/{teacher['user_id']}/{file_id}.{ext}"

    data = await file.read()

    base64_data = base64.b64encode(data).decode("utf-8")

    result = {
        "path": path,
        "size": len(data),
        "base64": base64_data,
    }

    await db.files.insert_one({
        "file_id": file_id,
        "storage_path": result["path"],
        "base64": result["base64"],
        "original_filename": file.filename or "",
        "content_type": file.content_type or "",
        "size": result.get("size", 0),
        "owner_id": teacher["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "path": result["path"],
        "file_id": file_id
    }


@api_router.get("/files")
async def files_serve(path: str):
    import base64

    record = await db.files.find_one(
        {
            "storage_path": path,
            "is_deleted": False
        },
        {"_id": 0}
    )

    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    data = base64.b64decode(record["base64"])

    content_type = (
        record.get("content_type")
        or "application/octet-stream"
    )

    return FastAPIResponse(
    content=bytes(data),
    media_type=content_type,
    headers={
        "Cache-Control": "no-cache"
    }
)

# ============ Wire up ============
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
