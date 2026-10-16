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
        <p>Contact: info@studentshelper.org | Phone: (07) 5555-1234</p>
        <p>&copy; 2026 Students Helper. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #2c3e50;
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
