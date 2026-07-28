import { Link, Outlet, useRouterState } from "@tanstack/solid-router";
import { createSignal, onCleanup, onMount } from "solid-js";

function useClock() {
  const [now, setNow] = createSignal(new Date());
  onMount(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    onCleanup(() => clearInterval(id));
  });
  return now;
}

function NavIcon(props: { d: string }) {
  return (
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={props.d}
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

export function RootLayout() {
  const clock = useClock();
  const route = useRouterState({ select: (s) => s.location.pathname });
  const pageTitle = () => (route() === "/1on1" ? "1:1 Portal" : "Dashboard");

  return (
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <span class="brand-hex" />
            <span class="brand-core">MR</span>
          </div>
          <div>
            <p class="brand-kicker">Millipede Academy</p>
            <h1 class="brand-title">Team Radar</h1>
          </div>
        </div>

        <nav class="sidebar-nav" aria-label="Primary">
          <p class="nav-section">Platform</p>
          <Link to="/" activeProps={{ class: "active" }}>
            <NavIcon d="M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z" />
            Dashboard
          </Link>
          <Link to="/1on1" activeProps={{ class: "active" }}>
            <NavIcon d="M12 3l8 4v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z" />
            1:1 Portal
          </Link>
        </nav>

        <div class="sidebar-foot">
          <div class="rank-card">
            <span class="rank-label">Operator</span>
            <strong>Manager</strong>
            <span class="rank-meta">Stage 4 · local dev</span>
          </div>
        </div>
      </aside>

      <div class="main-column">
        <header class="topbar">
          <div>
            <p class="breadcrumb">Team Radar / {pageTitle()}</p>
            <h2 class="page-title">{pageTitle()}</h2>
          </div>
          <div class="topbar-meta">
            <span class="live-chip">
              <span class="pulse" /> LIVE
            </span>
            <span class="mono">{clock().toISOString().slice(11, 19)} UTC</span>
          </div>
        </header>

        <main class="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
