export default function TaskCard({ task, onClick, onDelete }) {
  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          &#128465;
        </button>
      </div>
      <p className="task-card-desc">
        {task.description || 'No description'}
      </p>
      <div className="task-card-footer">
        <span className="task-date created">
          <span className="date-icon">&#128197;</span> {formatDate(task.created_at)}
        </span>
        <span className="task-date deadline">
          <span className="date-icon">&#9200;</span> {formatDate(task.deadline_date)}
        </span>
      </div>
    </div>
  );
}
