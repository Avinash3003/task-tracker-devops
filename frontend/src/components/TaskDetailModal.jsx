import { useState } from 'react';
import { taskAPI } from '../api';
import UserSelect from './UserSelect';

export default function TaskDetailModal({ task, onClose, onDelete, onTaskUpdate }) {

  const handleAssign = async (newUserId) => {
     try {
         await taskAPI.assign(task.id, newUserId || null);
         onTaskUpdate();
     } catch (err) {}
  };

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
      <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px', width: '90%'}}>
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
                {task.status !== 'Done' && (
                    <div className="date-badge">
                      <span className="date-label">Deadline</span>
                      <span className="date-value">{formatDate(task.deadline_date)}</span>
                    </div>
                )}
                {task.completed_at && (
                    <div className="date-badge" style={{borderColor: 'var(--success)'}}>
                      <span className="date-label" style={{color: 'var(--success)'}}>Completed</span>
                      <span className="date-value">{formatDate(task.completed_at)}</span>
                    </div>
                )}
              </div>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                    <label>Created By</label>
                    <div style={{padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.95rem', border: '1px solid var(--border-glow)'}}>
                        {task.owner?.username || 'Unknown'}
                    </div>
                </div>
                <div className="form-group" style={{flex: 1}}>
                    <label>Assignee</label>
                    <UserSelect value={task.assigned_user_id || ""} onChange={handleAssign} />
                </div>
              </div>
              <div className="task-detail-description" style={{marginTop: '1.5rem', marginBottom: '1.5rem'}}>
                <h3>Description</h3>
                <div className="description-scroll">
                  {task.description || 'No description provided.'}
                </div>
              </div>
        </div>
        <div className="modal-footer" style={{display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-glow)'}}>
          <button
            className="btn btn-danger"
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
