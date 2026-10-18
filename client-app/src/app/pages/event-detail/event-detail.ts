import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Event, Registration } from '../../services/api.service';

/**
 * Event detail page component showing full information for one event,
 * its fundraising progress and recent registrations (latest first).
 */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-container">
      <!-- Loading state -->
      <div *ngIf="loading" class="loading">
        <p>Loading event details...</p>
      </div>

      <!-- Not found / error state -->
      <div *ngIf="!loading && error" class="error-message">
        <h3>{{ error }}</h3>
        <a routerLink="/" class="btn-back">Back to Home</a>
      </div>

      <!-- Event detail -->
      <div *ngIf="!loading && !error && event" class="event-detail">
        <a routerLink="/" class="link-back">&larr; Back to events</a>

        <div class="detail-card">
          <div class="detail-header">
            <div class="event-date-badge">
              <span class="day">{{ getDay(event.event_date) }}</span>
              <span class="month">{{ getMonth(event.event_date) }}</span>
            </div>
            <div class="detail-title">
              <span class="category-tag">{{ event.category_name || 'General' }}</span>
              <h2>{{ event.event_name }}</h2>
              <p class="event-purpose">{{ event.event_purpose }}</p>
            </div>
          </div>

          <div class="detail-body">
            <div class="info-row">
              <span class="info-label">📅 Date</span>
              <span>{{ formatDate(event.event_date) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🕐 Time</span>
              <span>{{ formatTime(event.event_time) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📍 Location</span>
              <span>{{ event.event_address }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🎫 Ticket Price</span>
              <span *ngIf="event.event_ticket_price > 0">\${{ event.event_ticket_price }}</span>
              <span *ngIf="event.event_ticket_price === 0" class="free-text">FREE</span>
            </div>

            <div class="description-section">
              <h3>About This Event</h3>
              <p>{{ event.event_description }}</p>
            </div>

            <!-- Fundraising progress -->
            <div class="progress-section">
              <h3>Fundraising Progress</h3>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgressPercent()"></div>
              </div>
              <p class="progress-text">
                \${{ event.event_goal_raised_amount }} raised of \${{ event.event_goal_amount }} goal
                ({{ getProgressPercent() }}%)
              </p>
            </div>

            <a [routerLink]="['/register', event.event_id]" class="btn-register">Register Now</a>
          </div>
        </div>

        <!-- Registrations list -->
        <div class="registrations-section">
          <h3>Recent Registrations ({{ registrations.length }})</h3>
          <p *ngIf="registrations.length === 0" class="no-registrations">
            No registrations yet. Be the first to register!
          </p>
          <table *ngIf="registrations.length > 0" class="registrations-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tickets</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reg of registrations">
                <td>{{ reg.user_name }}</td>
                <td>{{ reg.num_tickets }}</td>
                <td>{{ formatDate(reg.registration_date || '') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 20px 0;
    }
    .loading, .error-message {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }
    .error-message {
      color: #e74c3c;
    }
    .link-back {
      color: #3498db;
      text-decoration: none;
      font-size: 0.95em;
      display: inline-block;
      margin-bottom: 15px;
    }
    .link-back:hover {
      text-decoration: underline;
    }
    .detail-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 30px;
    }
    .detail-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 25px;
      background: linear-gradient(135deg, #fdf2f0, #fde8e6);
      border-bottom: 1px solid #f5d5d0;
    }
    .event-date-badge {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      padding: 20px 18px;
      text-align: center;
      min-width: 90px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .event-date-badge .day {
      font-size: 2.2em;
      font-weight: bold;
      line-height: 1;
    }
    .event-date-badge .month {
      font-size: 0.95em;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .category-tag {
      background-color: #ecf0f1;
      color: #7f8c8d;
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8em;
      text-transform: uppercase;
    }
    .detail-title h2 {
      margin: 8px 0 5px;
      color: #2c3e50;
    }
    .event-purpose {
      color: #7f8c8d;
      margin: 0;
    }
    .detail-body {
      padding: 25px;
    }
    .info-row {
      display: flex;
      gap: 15px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label {
      font-weight: bold;
      color: #2c3e50;
      min-width: 140px;
    }
    .free-text {
      color: #e74c3c;
      font-weight: bold;
    }
    .description-section {
      margin: 20px 0;
    }
    .description-section h3, .progress-section h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .description-section p {
      color: #555;
      line-height: 1.6;
    }
    .progress-section {
      margin: 20px 0;
    }
    .progress-bar {
      background-color: #ecf0f1;
      border-radius: 10px;
      height: 20px;
      overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(90deg, #27ae60, #2ecc71);
      height: 100%;
      transition: width 0.5s ease;
    }
    .progress-text {
      color: #7f8c8d;
      font-size: 0.95em;
      margin-top: 8px;
    }
    .btn-register {
      display: inline-block;
      background-color: #e74c3c;
      color: white;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 5px;
      font-size: 1.1em;
      font-weight: bold;
      margin-top: 10px;
      transition: background-color 0.3s;
    }
    .btn-register:hover {
      background-color: #c0392b;
    }
    .btn-back {
      display: inline-block;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      padding: 10px 25px;
      border-radius: 5px;
      margin-top: 15px;
    }
    .registrations-section {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 25px;
    }
    .registrations-section h3 {
      color: #2c3e50;
      margin-top: 0;
    }
    .no-registrations {
      color: #7f8c8d;
    }
    .registrations-table {
      width: 100%;
      border-collapse: collapse;
    }
    .registrations-table th {
      text-align: left;
      padding: 10px;
      background-color: #f8f9fa;
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
    }
    .registrations-table td {
      padding: 10px;
      border-bottom: 1px solid #ecf0f1;
      color: #555;
    }
  `]
})
export class EventDetail implements OnInit {
  event: Event | null = null;
  registrations: Registration[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Load the event and its registrations together using the route's event ID.
   * @returns Nothing; the subscription updates the page or its error state.
   */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.error = 'Invalid event ID.';
      this.loading = false;
      return;
    }

    this.apiService.getEvent(id).subscribe({
      next: (data) => {
        this.event = data;
        this.registrations = data.registrations;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.status === 404
          ? 'Event not found.'
          : 'Failed to load event details. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading event:', err);
      }
    });
  }

  /**
   * Calculate fundraising progress percentage, capped at 100.
   * @returns The rounded percentage, or zero when the goal is unavailable.
   */
  getProgressPercent(): number {
    if (!this.event || this.event.event_goal_amount <= 0) return 0;
    const percent = (this.event.event_goal_raised_amount / this.event.event_goal_amount) * 100;
    return Math.min(Math.round(percent), 100);
  }

  /**
   * Extract the day number from an event date.
   * @param dateString - The date value returned by the API.
   * @returns The local day of the month as a string.
   */
  getDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  /**
   * Extract the month abbreviation from an event date.
   * @param dateString - The date value returned by the API.
   * @returns The uppercase three-letter month abbreviation.
   */
  getMonth(dateString: string): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[new Date(dateString).getMonth()];
  }

  /**
   * Format a date string as "18 OCT 2026".
   * @param dateString - The event or registration date returned by the API.
   * @returns The formatted date, or an empty string when no date is supplied.
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getDate()} ${this.getMonth(dateString)} ${d.getFullYear()}`;
  }

  /**
   * Format a database time for display in the page.
   * @param timeString - A time in HH:MM or HH:MM:SS format.
   * @returns A twelve-hour time with AM or PM, or an empty string for no time.
   */
  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
}
