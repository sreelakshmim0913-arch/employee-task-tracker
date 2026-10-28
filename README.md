# Employee Task Tracker

A simple full-stack task management application built with React, FastAPI, and SQLite.

## Features
- Create tasks with title, description, priority, and assigned employee.
- View/search tasks and filter by status.
- Update task status (Pending, In Progress, Completed).
- Delete tasks with a confirmation prompt.
- Persistent SQLite storage.
- REST API documentation and testing through Swagger UI.
- Basic validation and API error handling.

## Requirements
- Python 3.10+
- Node.js 18+ and npm

## Run the backend
Open a terminal in the project folder:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
- Windows PowerShell: `.venv\Scripts\Activate.ps1`
- Windows CMD: `.venv\Scripts\activate.bat`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies and start FastAPI:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Swagger UI: `http://127.0.0.1:8000/docs`.
The `tasks.db` SQLite database is created automatically in the backend folder on startup.

## Run the frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`).

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/{task_id}` | Get one task |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/{task_id}/status` | Update task status |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

### Example request: create a task

```json
{
  "title": "Review API integration",
  "description": "Check task endpoints and error responses",
  "priority": "High",
  "assigned_employee": "Priya"
}
```

### Example request: update status

```json
{
  "status": "In Progress"
}
```

Allowed priorities: `Low`, `Medium`, `High`. Allowed statuses: `Pending`, `In Progress`, `Completed`.

## CRUD test checklist
1. **Create:** POST `/api/tasks` with the example JSON; expect `201 Created`.
2. **Read:** GET `/api/tasks`; confirm the created task is present.
3. **Update:** PATCH `/api/tasks/{id}/status` with `{"status":"In Progress"}`; expect updated task JSON.
4. **Delete:** DELETE `/api/tasks/{id}`; expect `204 No Content`.
5. **Persistence:** create a task, refresh the React page, and confirm it remains. Stop and restart the backend and check again.
6. **Error handling:** request a nonexistent task ID; expect `404`. Try an invalid status; expect `422`.

## GitHub submission
From the project root:

```bash
git init
git add .
git commit -m "Build Employee Task Tracker with React FastAPI and SQLite"
```

Create an empty repository on GitHub, then follow GitHub's displayed instructions to add the remote and push the project. Do not commit virtual environments, `node_modules`, or the local SQLite database.

## Notes
The SQLite database is generated automatically and is intentionally excluded from Git. This keeps the repository clean; reviewers will create their own database by running the backend.
