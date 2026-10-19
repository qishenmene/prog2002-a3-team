import { Component } from '@angular/core';

/**
 * Footer component displaying contact information and copyright
 * Reusable component shown at the bottom of every page
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <p><strong>Students Helper</strong> - Gold Coast Charity Organization</p>
        <p>Contact: media@studentshelper.org | Phone: 07 2486 3179</p>
        <p>&copy; 2026 Students Helper. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: var(--dark);
      color: white;
      text-align: center;
      padding: 20px;
      margin-top: 40px;
    }
    .footer-content p {
      margin: 5px 0;
      font-size: 0.9em;
    }
  `]
})
export class Footer {}
