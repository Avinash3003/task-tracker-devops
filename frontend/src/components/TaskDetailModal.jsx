export default function TaskDetailModal({ task, onClose, onDelete }) {
  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="task-detail-body">
          <div className="task-detail-dates">
            <div className="date-badge">
              <span className="date-label">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Created
              </span>
              <span className="date-value">{formatDate(task.created_at)}</span>
            </div>
            <div className="date-badge">
              <span className="date-label">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Deadline
              </span>
              <span className="date-value">{formatDate(task.deadline_date)}</span>
            </div>
          </div>
          <div className="task-detail-description">
            <h3>Description</h3>
            <div className="description-scroll">
              {task.description || 'No description provided.'}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-danger btn-glow"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
          >
            <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
