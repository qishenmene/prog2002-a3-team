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
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header-content h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: bold;
    }
    .tagline {
      margin: 10px 0 0 0;
      font-size: 1.1em;
      opacity: 0.9;
    }
  `]
})
export class Header {}
