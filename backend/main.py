from contextlib import asynccontextmanager
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "tasks.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High')),
                assigned_employee TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending'
                    CHECK(status IN ('Pending', 'In Progress', 'Completed')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Employee Task Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    priority: str
    assigned_employee: str = Field(min_length=1, max_length=100)


class TaskStatusUpdate(BaseModel):
    status: str


def row_to_dict(row):
    return dict(row)


@app.get("/")
def root():
    return {"message": "Employee Task Tracker API is running", "docs": "/docs"}


@app.get("/api/tasks")
def get_tasks():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return [row_to_dict(row) for row in rows]


@app.get("/api/tasks/{task_id}")
def get_task(task_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return row_to_dict(row)


@app.post("/api/tasks", status_code=201)
def create_task(task: TaskCreate):
    title = task.title.strip()
    employee = task.assigned_employee.strip()
    if not title or not employee:
        raise HTTPException(status_code=422, detail="Title and assigned employee are required")
    if task.priority not in {"Low", "Medium", "High"}:
        raise HTTPException(status_code=422, detail="Priority must be Low, Medium, or High")

    with get_connection() as conn:
        cursor = conn.execute(
            """INSERT INTO tasks (title, description, priority, assigned_employee)
               VALUES (?, ?, ?, ?)""",
            (title, task.description.strip(), task.priority, employee),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return row_to_dict(row)


@app.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: int, payload: TaskStatusUpdate):
    if payload.status not in {"Pending", "In Progress", "Completed"}:
        raise HTTPException(
            status_code=422,
            detail="Status must be Pending, In Progress, or Completed",
        )
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE tasks SET status = ? WHERE id = ?", (payload.status, task_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return Response(status_code=204)
