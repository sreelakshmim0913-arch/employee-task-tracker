import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, ClipboardList, Plus, RefreshCw, Search, Trash2, Users, X } from "lucide-react";

const API = "http://127.0.0.1:8000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", priority: "Medium", assigned_employee: ""
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load tasks. Check that the backend is running.");
      setTasks(await response.json());
    } catch (e) {
      setError(e.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "Pending").length,
    progress: tasks.filter(t => t.status === "In Progress").length,
    completed: tasks.filter(t => t.status === "Completed").length,
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const q = search.toLowerCase();
    const matchesSearch = [task.title, task.assigned_employee, task.description]
      .some(value => (value || "").toLowerCase().includes(q));
    return matchesSearch && (statusFilter === "All" || task.status === statusFilter);
  }), [tasks, search, statusFilter]);

  async function createTask(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not create task.");
      setTasks(current => [data, ...current]);
      setForm({ title: "", description: "", priority: "Medium", assigned_employee: "" });
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Could not create task.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task, status) {
    setError("");
    try {
      const response = await fetch(`${API}/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.detail || "Could not update status.");
      setTasks(current => current.map(t => t.id === task.id ? data : t));
    } catch (e) {
      setError(e.message || "Could not update status.");
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch(`${API}/${task.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Could not delete task.");
      }
      setTasks(current => current.filter(t => t.id !== task.id));
    } catch (e) {
      setError(e.message || "Could not delete task.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><ClipboardList size={23} /></div><div><strong>TaskFlow</strong><span>WORKSPACE</span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><ClipboardList size={18} /> Task Dashboard</div>
        <div className="sidebar-note"><div className="note-icon"><Activity size={18} /></div><strong>Keep work moving.</strong><p>One clear view of your team's tasks and progress.</p></div>
        <div className="sidebar-footer"><span className="online-dot"></span> Local workspace <span className="version">v1.0</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <b>Task Dashboard</b></div>
          <div className="topbar-right"><span className="live-dot"></span><span>Workspace active</span><div className="avatar">TF</div></div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">TEAM OVERVIEW</div><h1>Task Dashboard</h1><p>Manage assignments, track progress, and keep your team aligned.</p></div>
            <button className="primary-btn" onClick={() => { setError(""); setShowForm(true); }}><Plus size={18} /> Create task</button>
          </div>

          {error && <div className="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}

          <div className="stats-grid">
            <Stat icon={<ClipboardList size={19}/>} label="Total tasks" value={stats.total} tone="violet" hint="All assignments" />
            <Stat icon={<Activity size={19}/>} label="In progress" value={stats.progress} tone="blue" hint="Currently active" />
            <Stat icon={<CheckCircle2 size={19}/>} label="Completed" value={stats.completed} tone="green" hint="Finished tasks" />
            <Stat icon={<Users size={19}/>} label="Pending" value={stats.pending} tone="amber" hint="Awaiting action" />
          </div>

          <section className="panel">
            <div className="panel-heading"><div><h2>All tasks</h2><p>A complete list of your team's assignments.</p></div><button className="icon-btn" onClick={loadTasks} title="Refresh tasks"><RefreshCw size={17}/></button></div>
            <div className="table-toolbar">
              <div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or employees..." /></div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                <option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>TASK</th><th>ASSIGNED TO</th><th>PRIORITY</th><th>STATUS</th><th className="actions-head">ACTIONS</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="5" className="empty-state">Loading tasks...</td></tr> :
                   visibleTasks.length === 0 ? <tr><td colSpan="5" className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><strong>{tasks.length ? "No matching tasks" : "No tasks yet"}</strong><span>{tasks.length ? "Try another search or status filter." : "Create your first task to get started."}</span>{!tasks.length && <button className="text-btn" onClick={() => setShowForm(true)}>+ Create a task</button>}</td></tr> :
                   visibleTasks.map(task => <tr key={task.id}>
                    <td><div className="task-title">{task.title}</div><div className="task-description">{task.description || "No description provided"}</div></td>
                    <td><div className="employee"><span className="employee-avatar">{task.assigned_employee.trim().split(/\s+/).map(n => n[0]).join("").slice(0,2).toUpperCase()}</span><span>{task.assigned_employee}</span></div></td>
                    <td><span className={`priority priority-${task.priority.toLowerCase()}`}><i></i>{task.priority}</span></td>
                    <td><select className={`status-select status-${task.status.toLowerCase().replace(" ", "-")}`} value={task.status} onChange={e => changeStatus(task, e.target.value)} aria-label={`Status for ${task.title}`}><option>Pending</option><option>In Progress</option><option>Completed</option></select></td>
                    <td className="actions-cell"><button className="delete-btn" onClick={() => deleteTask(task)} title="Delete task" aria-label={`Delete ${task.title}`}><Trash2 size={17}/></button></td>
                   </tr>)}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <b>{visibleTasks.length}</b> of <b>{tasks.length}</b> tasks</span><span>Changes are saved automatically</span></div>
          </section>
          <footer className="page-footer">TaskFlow <span>·</span> Employee Task Tracker <span>·</span> Powered by FastAPI & SQLite</footer>
        </section>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="modal" onSubmit={createTask}>
          <div className="modal-heading"><div><div className="eyebrow">NEW ASSIGNMENT</div><h2>Create a task</h2><p>Add the details and assign an employee.</p></div><button type="button" className="icon-btn" onClick={() => setShowForm(false)} aria-label="Close"><X size={19}/></button></div>
          <label>Task title <span>*</span><input required maxLength="120" placeholder="e.g. Review API integration" value={form.title} onChange={e => setForm({...form, title:e.target.value})}/></label>
          <label>Description<textarea maxLength="1000" rows="3" placeholder="Add a short description..." value={form.description} onChange={e => setForm({...form, description:e.target.value})}/></label>
          <div className="form-row"><label>Priority<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Assigned employee <span>*</span><input required maxLength="100" placeholder="Employee name" value={form.assigned_employee} onChange={e => setForm({...form, assigned_employee:e.target.value})}/></label></div>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? "Creating..." : <><Plus size={17}/> Create task</>}</button></div>
        </form>
      </div>}
    </div>
  );
}

function Stat({ icon, label, value, tone, hint }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}

export default App;
