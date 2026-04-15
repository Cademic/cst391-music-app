"use client";

import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <span className="navbar-brand">My Music</span>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div className="navbar-nav">
          <span className="nav-item nav-link">
            <Link href="/">Main</Link>
          </span>
          <span className="nav-item nav-link">
            <Link href="/new">New</Link>
          </span>
        </div>
      </div>
    </nav>
  );
}
