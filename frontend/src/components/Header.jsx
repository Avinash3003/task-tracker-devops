import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

export default function Header() {
  const { username, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    logout();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">&#9889;</span>
          Task Tracker
        </h1>
      </div>
      <div className="header-right" ref={dropdownRef}>
        <button
          className="user-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="user-avatar">{username?.[0]?.toUpperCase()}</span>
          <span className="user-name">{username}</span>
          <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>&#9660;</span>
        </button>
        <div className={`dropdown-panel ${dropdownOpen ? 'show' : ''}`}>
          <div className="dropdown-user-info">
            <div className="dropdown-avatar">{username?.[0]?.toUpperCase()}</div>
            <div className="dropdown-username">{username}</div>
          </div>
          <div className="dropdown-divider" />
          <button className="dropdown-logout" onClick={handleLogout}>
            <span>&#9211;</span> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
