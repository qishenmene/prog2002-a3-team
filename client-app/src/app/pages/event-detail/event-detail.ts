import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { dayOfMonth, monthAbbr, formatDateShort, formatDateTime, formatTime, formatMoney, isPastDate } from '../../shared/format';
import { WeatherPanel } from '../../components/weather-panel/weather-panel';
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
  imports: [CommonModule, RouterLink, WeatherPanel],
  template: `
    <div class="detail-container">
      <!-- Loading state -->
      <div *ngIf="loading" class="loading" role="status">
        <p>Loading event details...</p>
      </div>

      <!-- Not found / error state -->
      <div *ngIf="!loading && error" class="error-message" role="alert">
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
              <span class="info-label">Date</span>
              <span>{{ formatDate(event.event_date) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time</span>
              <span>{{ formatTime(event.event_time) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Location</span>
              <span>{{ event.event_address }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ticket Price</span>
              <span *ngIf="event.event_ticket_price > 0">{{ event.event_ticket_price | currency:'AUD':'symbol':'1.2-2' }}</span>
              <span *ngIf="event.event_ticket_price === 0" class="free-text">FREE</span>
            </div>

            <div class="description-section">
              <h3>About This Event</h3>
              <p>{{ event.event_description }}</p>
            </div>

            <app-weather-panel [eventId]="event.event_id"></app-weather-panel>

            <!-- Fundraising progress -->
            <div class="progress-section">
              <h3>Fundraising Progress</h3>
              <div class="progress-bar" role="progressbar" aria-label="Fundraising progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="getProgressPercent()">
                <div class="progress-fill" [style.width.%]="getProgressPercent()"></div>
              </div>
              <p class="progress-text">
                {{ event.event_goal_raised_amount | currency:'AUD':'symbol':'1.2-2' }} raised of {{ event.event_goal_amount | currency:'AUD':'symbol':'1.2-2' }} goal
                ({{ getProgressPercent() }}%)
              </p>
            </div>

            <a *ngIf="!registrationClosed()" [routerLink]="['/register', event.event_id]" class="btn-register">Register Now</a>
            <p *ngIf="registrationClosed()" class="alert alert-info">Registration is closed because this event has already taken place.</p>
          </div>
        </div>

        <!-- Registrations list -->
        <div class="registrations-section">
          <h3>Recent Registrations ({{ registrations.length }})</h3>
          <p *ngIf="registrations.length === 0" class="no-registrations">
            No registrations yet. Be the first to register!
          </p>
          <div class="table-scroll" tabindex="0" role="region" aria-label="Event registrations"><table *ngIf="registrations.length > 0" class="registrations-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Tickets</th>
                <th scope="col">Registered On</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reg of registrations">
                <td>{{ reg.user_name }}</td>
                <td>{{ reg.num_tickets }}</td>
                <td>{{ formatRegistrationDate(reg.registration_date || '') }}</td>
              </tr>
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-scroll { overflow-x: auto; }
    @media (max-width: 600px) { .info-row { flex-direction: column; gap: 4px; } .detail-header { align-items: flex-start; } }
    .detail-container {
      padding: 20px 0;
    }
    .loading, .error-message {
      text-align: center;
      padding: 40px;
      color: var(--muted);
    }
    .error-message {
      color: var(--brand);
    }
    .link-back {
      color: var(--brand);
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
      background: linear-gradient(135deg, var(--brand), var(--brand-dark));
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
      background-color: var(--brand-soft);
      color: var(--muted);
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8em;
      text-transform: uppercase;
    }
    .detail-title h2 {
      margin: 8px 0 5px;
      color: var(--dark);
    }
    .event-purpose {
      color: var(--muted);
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
      color: var(--dark);
      min-width: 140px;
    }
    .free-text {
      color: var(--brand);
      font-weight: bold;
    }
    .description-section {
      margin: 20px 0;
    }
    .description-section h3, .progress-section h3 {
      color: var(--dark);
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
      background-color: var(--brand-soft);
      border-radius: 10px;
      height: 20px;
      overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(90deg, var(--success), var(--dark-soft));
      height: 100%;
      transition: width 0.5s ease;
    }
    .progress-text {
      color: var(--muted);
      font-size: 0.95em;
      margin-top: 8px;
    }
    .btn-register {
      display: inline-block;
      background-color: var(--brand);
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
      background-color: var(--brand-dark);
    }
    .btn-back {
      display: inline-block;
      background-color: var(--brand);
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
      color: var(--dark);
      margin-top: 0;
    }
    .no-registrations {
      color: var(--muted);
    }
    .registrations-table {
      width: 100%;
      border-collapse: collapse;
    }
    .registrations-table th {
      text-align: left;
      padding: 10px;
      background-color: #f8f9fa;
      color: var(--dark);
      border-bottom: 2px solid var(--brand-soft);
    }
    .registrations-table td {
      padding: 10px;
      border-bottom: 1px solid var(--brand-soft);
      color: #555;
    }
  `]
})
export class EventDetail implements OnInit {
  event: Event | null = null;
  registrations: Registration[] = [];
  loading = true;
  error: string | null = null;

  constructor(private destroyRef: DestroyRef,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Load the event and its registrations together using the route's event ID.
   * @returns void
   */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.error = 'Invalid event ID.';
      this.loading = false;
      return;
    }

    this.apiService.getEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    return Math.max(0, Math.min(Math.round(percent), 100));
  }

  /**
   * Extract the day number from an event date.
   * @param dateString - The date value returned by the API.
   * @returns The local day of the month as a string.
   */
  getDay(dateString: string): string {
    return dayOfMonth(dateString);
  }

  /**
   * Extract the month abbreviation from an event date.
   * @param dateString - The date value returned by the API.
   * @returns The uppercase three-letter month abbreviation.
   */
  getMonth(dateString: string): string {
    return monthAbbr(dateString);
  }

  /**
   * Format a date string as "18 OCT 2026".
   * @param dateString - The event or registration date returned by the API.
   * @returns The formatted date, or an empty string when no date is supplied.
   */
  formatDate(dateString: string): string {
    return formatDateShort(dateString);
  }

  /**
   * Format a database time for display in the page.
   * @param timeString - A time in HH:MM or HH:MM:SS format.
   * @returns A twelve-hour time with AM or PM, or an empty string for no time.
   */
  formatTime(timeString: string): string {
    return formatTime(timeString);
  }
  /**
   * Display the registration time as well as its date.
   * @param value - The timestamp returned by the API.
   * @returns A readable date and time, or an empty string.
   */
  formatRegistrationDate(value: string): string { return formatDateTime(value); }

  /**
   * Prevent a past event from advertising an open registration form.
   * @returns Whether the loaded event is in the past.
   */
  registrationClosed(): boolean { return !!this.event && isPastDate(this.event.event_date); }
}
