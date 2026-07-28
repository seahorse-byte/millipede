import { Link } from "@tanstack/solid-router";
import type { ParentProps } from "solid-js";

export function RootLayout(props: ParentProps) {
  return (
    <div class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Millipede Team Radar</p>
          <h1>Manager dashboard</h1>
        </div>
        <nav class="app-nav">
          <Link to="/" activeProps={{ class: "active" }}>
            Overview
          </Link>
          <Link to="/1on1" activeProps={{ class: "active" }}>
            1:1 Portal
          </Link>
        </nav>
      </header>
      <main class="app-main">{props.children}</main>
    </div>
  );
}
