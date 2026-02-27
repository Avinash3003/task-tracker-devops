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
              <span className="date-label">Created</span>
              <span className="date-value">{formatDate(task.created_at)}</span>
            </div>
            <div className="date-badge">
              <span className="date-label">Deadline</span>
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
            &#128465; Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
