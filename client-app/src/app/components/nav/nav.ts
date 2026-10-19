import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Navigation component providing site-wide navigation
 * Reusable component shown on every page with active state highlighting
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="nav" aria-label="Main navigation">
      <ul class="nav-list">
        <li><a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{exact: true}">Home</a></li>
        <li><a routerLink="/search" routerLinkActive="active" ariaCurrentWhenActive="page">Search Events</a></li>
      </ul>
    </nav>
  `,
  styles: [`
    .nav {
      background-color: #2c3e50;
      padding: 0;
    }
    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
    }
    .nav-list li {
      margin: 0;
    }
    .nav-list a {
      display: block;
      color: white;
      text-decoration: none;
      padding: 15px 30px;
      transition: background-color 0.3s;
    }
    .nav-list a:hover {
      background-color: #34495e;
    }
    .nav-list a.active {
      background-color: #e74c3c;
    }
  `]
})
export class Nav {}
