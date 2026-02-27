export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-name">&#9889; Task Tracker</span>
        <span className="footer-version">v1.0.0</span>
        <span className="footer-copy">&copy; {new Date().getFullYear()} Task Tracker. All rights reserved.</span>
      </div>
    </footer>
  );
}
