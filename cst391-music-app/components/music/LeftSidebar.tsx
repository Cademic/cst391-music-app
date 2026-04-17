"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

function isLinkActive(pathname: string, href: string, label: string): boolean {
  if (label === "Home") {
    return pathname === "/";
  }
  if (label === "Library") {
    return pathname.startsWith("/library");
  }
  if (label === "Discover") {
    return pathname.startsWith("/discover");
  }
  if (label === "Admin") {
    return pathname.startsWith("/admin");
  }
  return pathname === href;
}

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "admin";

  const entries = useMemo(
    () =>
      [
        { kind: "link" as const, href: "/", label: "Home" },
        { kind: "search" as const },
        { kind: "link" as const, href: "/discover", label: "Discover" },
        { kind: "link" as const, href: "/library", label: "Library" },
        ...(isAdmin ? [{ kind: "link" as const, href: "/admin", label: "Admin" }] : []),
      ] as const,
    [isAdmin]
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
    <aside className="wf-left-rail d-flex flex-column" aria-label="Sidebar navigation">
      <div className="mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo in public */}
        <img
          src="/pulse-player-logo.png"
          alt="PulsePlayer"
          className="img-fluid rounded-2 d-block"
          style={{ maxWidth: 160 }}
        />
      </div>

      <nav aria-label="Main">
        <ul className="wf-sidebar-nav list-unstyled mb-0">
          {entries.map((entry) => {
            if (entry.kind === "search") {
              return (
                <li key="search">
                  <button
                    type="button"
                    className="wf-sidebar-link"
                    onClick={handleSearchClick}
                  >
                    Search
                  </button>
                </li>
              );
            }
            const active = isLinkActive(pathname, entry.href, entry.label);
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={`wf-sidebar-link ${active ? "wf-sidebar-link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
