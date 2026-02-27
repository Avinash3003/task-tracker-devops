import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import UndoToast from '../components/UndoToast';
import { taskAPI } from '../api';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [undoTask, setUndoTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');

  const today = new Date().toISOString().split('T')[0];

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const isSearching = searchQuery || fromDate || toDate;
      const isSorting = sortBy !== 'created_at' || sortOrder !== 'asc';

      if (isSearching) {
        const params = {};
        if (searchQuery) params.q = searchQuery;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        const res = await taskAPI.search(params);
        let data = res.data;
        if (isSorting) {
          data = sortLocal(data, sortBy, sortOrder);
        }
        setTasks(data);
      } else if (isSorting) {
        const res = await taskAPI.sort({ sort_by: sortBy, order: sortOrder });
        setTasks(res.data);
      } else {
        const res = await taskAPI.getAll();
        setTasks(res.data);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [searchQuery, fromDate, toDate, sortBy, sortOrder]);

  function sortLocal(data, field, order) {
    return [...data].sort((a, b) => {
      let valA, valB;
      if (field === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else {
        valA = a[field] ? new Date(a[field]).getTime() : 0;
        valB = b[field] ? new Date(b[field]).getTime() : 0;
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (taskData) => {
    await taskAPI.create(taskData);
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setUndoTask({ id: taskId });
    } catch {
      // ignore
    }
  };

  const handleUndo = async () => {
    if (!undoTask) return;
    try {
      await taskAPI.restore(undoTask.id);
      setUndoTask(null);
      fetchTasks();
    } catch {
      setUndoTask(null);
    }
  };

  const handleUndoExpire = useCallback(() => {
    setUndoTask(null);
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSortBy('created_at');
    setSortOrder('asc');
  };

  const sortOptions = [
    { value: 'created_at|asc', label: 'Created (Earliest)' },
    { value: 'created_at|desc', label: 'Created (Latest)' },
    { value: 'deadline_date|asc', label: 'Deadline (Nearest)' },
    { value: 'deadline_date|desc', label: 'Deadline (Farthest)' },
    { value: 'title|asc', label: 'Title (A-Z)' },
    { value: 'title|desc', label: 'Title (Z-A)' },
  ];

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('|');
    setSortBy(field);
    setSortOrder(order);
  };

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-main">
        <div className="controls-bar">
          <div className="search-section">
            <div className="search-input-wrapper">
              <span className="search-icon">&#128269;</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="date-filters">
              <div className="date-field">
                <label>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || today}
                />
              </div>
              <div className="date-field">
                <label>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || undefined}
                  max={today}
                />
              </div>
            </div>
          </div>
          <div className="actions-section">
            <select
              className="sort-select"
              value={`${sortBy}|${sortOrder}`}
              onChange={handleSortChange}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {(searchQuery || fromDate || toDate || sortBy !== 'created_at' || sortOrder !== 'asc') && (
              <button className="btn btn-ghost" onClick={clearFilters}>
                Clear
              </button>
            )}
            <button
              className="btn btn-primary btn-glow add-task-btn"
              onClick={() => setShowAddModal(true)}
            >
              &#10010; Add Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">&#128203;</div>
            <h2>No Tasks Found</h2>
            <p>Create your first task to get started!</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={setSelectedTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDelete}
        />
      )}

      {undoTask && (
        <UndoToast
          message="Task Deleted"
          onUndo={handleUndo}
          onExpire={handleUndoExpire}
        />
      )}
    </div>
  );
}
