"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useHomeSearch } from "@/contexts/home-search-context";

export default function WireframeHomeHeader() {
  const { searchPhrase, setSearchPhrase } = useHomeSearch();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="wf-header">
      <div className="wf-header-inner">
        <div className="wf-search-wrap">
          <span className="wf-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="wf-search-input"
            placeholder="Search for your style"
            value={searchPhrase}
            onChange={(e) => setSearchPhrase(e.target.value)}
            aria-label="Search albums"
          />
        </div>

        <nav className="wf-nav-pills" aria-label="Primary">
          <Link className="wf-pill wf-pill--home" href="/">
            HOME
          </Link>
          <Link className="wf-pill wf-pill--playlists" href="/library">
            PLAYLISTS
          </Link>
          <Link
            className="wf-pill wf-pill--profile"
            href={status === "authenticated" ? "/profile" : "/auth/signin"}
          >
            PROFILE
          </Link>
          {isAdmin ? (
            <Link className="wf-pill wf-pill--admin" href="/admin">
              ADMIN
            </Link>
          ) : null}
          {status === "authenticated" ? (
            <button
              type="button"
              className="wf-pill wf-pill--auth"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              LOG OUT
            </button>
          ) : (
            <Link className="wf-pill wf-pill--auth" href="/auth/signin">
              SIGN IN
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
