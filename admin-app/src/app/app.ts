import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Root component of the Students Helper admin application.
 * Provides the dark admin-style header, navigation and footer shell,
 * with routed pages rendered inside the main content area.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="admin-header">
      <div class="header-inner">
        <span class="brand">Students Helper — Admin</span>
        <nav class="admin-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Events</a>
        </nav>
      </div>
    </header>

    <main class="admin-main">
      <router-outlet></router-outlet>
    </main>

    <footer class="admin-footer">
      <p>Students Helper Admin Panel &copy; 2026 — PROG2002 A3</p>
    </footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .admin-header {
      background-color: #2c3e50;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .header-inner {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 20px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .admin-nav a {
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 5px;
      transition: background-color 0.2s, color 0.2s;
    }
    .admin-nav a:hover {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.1);
    }
    .admin-nav a.active {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.15);
    }
    .admin-main {
      flex: 1;
      max-width: 1180px;
      width: 100%;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .admin-footer {
      background-color: #2c3e50;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      padding: 14px 20px;
      font-size: 0.85rem;
    }
    .admin-footer p {
      margin: 0;
    }
  `]
})
export class App {
}
