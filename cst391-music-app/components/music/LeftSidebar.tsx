"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "admin";
  const navItems = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/discover", label: "Discover" },
      { href: "/library", label: "Library" },
    ],
    []
  );

  function handleSearchClick() {
    const windowWithRegistry = window as Window & {
      __wfUniversalSearchCount?: number;
    };
    const hasUniversalSearch = (windowWithRegistry.__wfUniversalSearchCount ?? 0) > 0;
    if (hasUniversalSearch) {
      window.dispatchEvent(new Event("wf-open-universal-search"));
      return;
    }
    router.push("/?openUniversalSearch=1");
  }

  return (
    <aside className="wf-left-rail" aria-label="Sidebar navigation">
      <div className="wf-brand">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo in public */}
        <img src="/pulse-player-logo.png" alt="PulsePlayer" className="wf-brand-logo" />
      </div>

      <nav className="wf-left-nav">
        {navItems.slice(0, 1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`wf-left-item text-decoration-none ${
              item.label === "Home" && pathname === "/"
                ? "wf-left-item--active"
                : item.label === "Library" && pathname.startsWith("/library")
                  ? "wf-left-item--active"
                : item.label === "Discover" && pathname.startsWith("/discover")
                  ? "wf-left-item--active"
                  : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button type="button" className="wf-left-item" onClick={handleSearchClick}>
          Search
        </button>
        {navItems.slice(1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`wf-left-item text-decoration-none ${
              item.label === "Home" && pathname === "/"
                ? "wf-left-item--active"
                : item.label === "Library" && pathname.startsWith("/library")
                  ? "wf-left-item--active"
                  : item.label === "Discover" && pathname.startsWith("/discover")
                    ? "wf-left-item--active"
                    : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
        {isAdmin ? (
          <Link
            href="/admin"
            className={`wf-left-item text-decoration-none ${
              pathname.startsWith("/admin") ? "wf-left-item--active" : ""
            }`}
          >
            Admin
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
