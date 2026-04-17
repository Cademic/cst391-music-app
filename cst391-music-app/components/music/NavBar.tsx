"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark wf-main-nav">
      <Link href="/" className="navbar-brand">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo in public */}
        <img src="/pulse-player-logo.png" alt="PulsePlayer" className="wf-navbar-logo" />
      </Link>
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
        <div className="navbar-nav me-auto">
          <span className="nav-item nav-link">
            <Link href="/" className="wf-nav-link">
              Main
            </Link>
          </span>
          <span className="nav-item nav-link">
            <Link href="/new" className="wf-nav-link">
              New
            </Link>
          </span>
          <span className="nav-item nav-link">
            <Link href="/library" className="wf-nav-link">
              Playlists
            </Link>
          </span>
          {isAdmin ? (
            <span className="nav-item nav-link">
              <Link href="/admin" className="wf-nav-link">
                Admin
              </Link>
            </span>
          ) : null}
        </div>
        <div className="navbar-nav ms-auto align-items-lg-center gap-2">
          {status === "authenticated" ? (
            <>
              <span className="navbar-text small text-white-50 d-none d-md-inline">
                {session?.user?.name ?? session?.user?.email}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light wf-nav-cta"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link className="btn btn-sm btn-primary wf-nav-cta" href="/auth/signin">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
