import { useState, useEffect } from 'react';

export default function UndoToast({ message, onUndo, duration = 5000, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [duration, onExpire]);

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="undo-toast">
      <div className="undo-toast-content">
        <span>{message}</span>
        <button className="undo-btn" onClick={onUndo}>Undo</button>
      </div>
      <div className="undo-progress-bar">
        <div className="undo-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
