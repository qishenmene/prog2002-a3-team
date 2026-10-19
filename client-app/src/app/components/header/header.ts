import { Component } from '@angular/core';

/**
 * Header component displaying the charity organization branding
 * Reusable component shown at the top of every page
 */
@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header-content">
        <h1>Students Helper</h1>
        <p class="tagline">Support students in need through charity events</p>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      color: var(--brand);
      padding: 18px 20px;
      text-align: center;
    }
    .header-content h1 {
      margin: 0;
      font-family: Georgia, serif;
      color: var(--brand);
      font-size: clamp(1.6rem, 4vw, 2rem);
      font-weight: bold;
    }
    .tagline {
      margin: 10px 0 0 0;
      font-size: .95rem;
      opacity: 0.9;
    }
  `]
})
export class Header {}
