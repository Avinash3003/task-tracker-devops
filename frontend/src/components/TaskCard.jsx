export default function TaskCard({ task, onClick, onDelete }) {
  const formatCreatedDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineInfo = (d) => {
    if (!d) return { text: 'No deadline', days: null };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(d);
    deadline.setHours(0, 0, 0, 0);
    const diffMs = deadline - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, days: diffDays };
    if (diffDays === 0) return { text: 'Due today', days: 0 };
    if (diffDays === 1) return { text: '1 day left', days: 1 };
    return { text: `${diffDays} days left`, days: diffDays };
  };

  const getDeadlineColor = (days) => {
    if (days === null) return 'var(--text-muted)';
    if (days < 0) return '#ef4444';
    if (days === 0) return '#f97316';
    if (days <= 2) return '#f59e0b';
    if (days <= 7) return '#eab308';
    if (days <= 14) return '#84cc16';
    return '#10b981';
  };

  const deadline = getDeadlineInfo(task.deadline_date);
  const deadlineColor = getDeadlineColor(deadline.days);

  return (
    <div className="task-card" onClick={() => onClick(task)}>
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <button
          className="task-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
      <p className="task-card-desc">
        {task.description || 'No description'}
      </p>
      <div className="task-card-footer">
        <span className="task-created-text">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {formatCreatedDate(task.created_at)}
        </span>
        <span
          className="task-deadline-badge"
          style={{
            color: deadlineColor,
            borderColor: deadlineColor,
            boxShadow: deadline.days !== null && deadline.days <= 2
              ? `0 0 8px ${deadlineColor}40`
              : 'none',
          }}
        >
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {deadline.text}
        </span>
      </div>
    </div>
  );
}
