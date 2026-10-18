import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Event } from '../../services/api.service';

/**
 * Registration page component allowing visitors to register for an event.
 * Submits the form to POST /api/registrations after client-side validation.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <!-- Loading state -->
      <div *ngIf="loading" class="loading">
        <p>Loading event information...</p>
      </div>

      <!-- Error loading event -->
      <div *ngIf="!loading && loadError" class="error-message">
        <h3>{{ loadError }}</h3>
        <a routerLink="/" class="btn-back">Back to Home</a>
      </div>

      <!-- Main content -->
      <div *ngIf="!loading && !loadError && event" class="register-layout">
        <!-- Event summary card -->
        <div class="event-summary">
          <h3>Event Summary</h3>
          <div class="summary-badge">
            <span class="day">{{ getDay(event.event_date) }}</span>
            <span class="month">{{ getMonth(event.event_date) }}</span>
          </div>
          <h4>{{ event.event_name }}</h4>
          <p class="summary-row">📅 {{ formatDate(event.event_date) }}</p>
          <p class="summary-row">🕐 {{ formatTime(event.event_time) }}</p>
          <p class="summary-row">📍 {{ event.event_address }}</p>
          <p class="summary-row price" *ngIf="event.event_ticket_price > 0">
            🎫 \${{ event.event_ticket_price }} per ticket
          </p>
          <p class="summary-row price free" *ngIf="event.event_ticket_price === 0">
            🎫 FREE entry
          </p>
        </div>

        <!-- Registration form -->
        <div class="form-card" *ngIf="!submitted">
          <h3>Register for This Event</h3>
          <p class="helper-text">We will send confirmation to your email.</p>

          <!-- Server error message -->
          <div *ngIf="submitError" class="server-error">
            {{ submitError }}
          </div>

          <form (ngSubmit)="submit()" #regForm="ngForm">
            <div class="form-field">
              <label for="user_name">Full Name <span class="required">*</span></label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                [(ngModel)]="form.user_name"
                required
                #nameInput="ngModel"
                [class.invalid]="nameInput.invalid && nameInput.touched"
              />
              <span class="validation-error" *ngIf="nameInput.invalid && nameInput.touched">
                Please enter your full name.
              </span>
            </div>

            <div class="form-field">
              <label for="user_email">Email <span class="required">*</span></label>
              <input
                type="email"
                id="user_email"
                name="user_email"
                [(ngModel)]="form.user_email"
                required
                email
                #emailInput="ngModel"
                [class.invalid]="emailInput.invalid && emailInput.touched"
              />
              <span class="validation-error" *ngIf="emailInput.invalid && emailInput.touched">
                Please enter a valid email address.
              </span>
            </div>

            <div class="form-field">
              <label for="user_phone">Phone (optional)</label>
              <input
                type="tel"
                id="user_phone"
                name="user_phone"
                [(ngModel)]="form.user_phone"
                placeholder="e.g. 0412 345 678"
              />
            </div>

            <div class="form-field">
              <label for="num_tickets">Number of Tickets <span class="required">*</span></label>
              <input
                type="number"
                id="num_tickets"
                name="num_tickets"
                [(ngModel)]="form.num_tickets"
                required
                min="1"
                #ticketsInput="ngModel"
                [class.invalid]="ticketsInput.invalid && ticketsInput.touched"
              />
              <span class="validation-error" *ngIf="ticketsInput.invalid && ticketsInput.touched">
                Please select at least 1 ticket.
              </span>
            </div>

            <button
              type="submit"
              class="btn-submit"
              [disabled]="regForm.invalid || submitting"
            >
              {{ submitting ? 'Submitting...' : 'Submit Registration' }}
            </button>
          </form>
        </div>

        <!-- Success confirmation panel -->
        <div class="form-card success-panel" *ngIf="submitted">
          <div class="success-icon">✓</div>
          <h3>Registration Confirmed!</h3>
          <p>
            Thank you, <strong>{{ form.user_name }}</strong>! Your registration for
            <strong>{{ event.event_name }}</strong> is confirmed.
          </p>
          <p>A confirmation will be sent to <strong>{{ form.user_email }}</strong>.</p>
          <div class="success-actions">
            <a [routerLink]="['/event', event.event_id]" class="btn-secondary">Back to Event</a>
            <a routerLink="/" class="btn-secondary">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
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
    .btn-back {
      display: inline-block;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      padding: 10px 25px;
      border-radius: 5px;
      margin-top: 15px;
    }
    .register-layout {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 25px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .register-layout {
        grid-template-columns: 1fr;
      }
    }
    .event-summary, .form-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 25px;
    }
    .event-summary h3, .form-card h3 {
      color: #2c3e50;
      margin-top: 0;
    }
    .summary-badge {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      width: 70px;
      padding: 12px 0;
      text-align: center;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
    }
    .summary-badge .day {
      font-size: 1.6em;
      font-weight: bold;
      line-height: 1;
    }
    .summary-badge .month {
      font-size: 0.8em;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .event-summary h4 {
      color: #2c3e50;
      margin: 0 0 15px;
      font-size: 1.2em;
    }
    .summary-row {
      color: #7f8c8d;
      font-size: 0.95em;
      margin: 8px 0;
    }
    .summary-row.price {
      color: #27ae60;
      font-weight: bold;
    }
    .summary-row.price.free {
      color: #e74c3c;
    }
    .helper-text {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: -5px;
    }
    .server-error {
      background-color: #fdf0ef;
      border: 1px solid #e74c3c;
      color: #c0392b;
      padding: 12px;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    .form-field {
      margin-bottom: 18px;
    }
    .form-field label {
      display: block;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 6px;
    }
    .required {
      color: #e74c3c;
    }
    .form-field input {
      width: 100%;
      padding: 10px;
      border: 1px solid #bdc3c7;
      border-radius: 5px;
      font-size: 1em;
      box-sizing: border-box;
    }
    .form-field input:focus {
      outline: none;
      border-color: #3498db;
    }
    .form-field input.invalid {
      border-color: #e74c3c;
    }
    .validation-error {
      color: #e74c3c;
      font-size: 0.85em;
      margin-top: 5px;
      display: block;
    }
    .btn-submit {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 14px 30px;
      border-radius: 5px;
      font-size: 1.05em;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      transition: background-color 0.3s;
    }
    .btn-submit:hover:not(:disabled) {
      background-color: #c0392b;
    }
    .btn-submit:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }
    .success-panel {
      text-align: center;
    }
    .success-icon {
      width: 70px;
      height: 70px;
      background-color: #27ae60;
      color: white;
      font-size: 2.5em;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .success-panel p {
      color: #555;
      line-height: 1.6;
    }
    .success-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 25px;
    }
    .btn-secondary {
      background-color: #3498db;
      color: white;
      text-decoration: none;
      padding: 10px 25px;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    .btn-secondary:hover {
      background-color: #2980b9;
    }
  `]
})
export class Register implements OnInit {
  event: Event | null = null;
  form = {
    user_name: '',
    user_email: '',
    user_phone: '',
    num_tickets: 1
  };
  loading = true;
  loadError: string | null = null;
  submitting = false;
  submitted = false;
  submitError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Load the event summary using the :id route parameter
   */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loadError = 'Invalid event ID.';
      this.loading = false;
      return;
    }

    this.apiService.getEvent(id).subscribe({
      next: (data) => {
        this.event = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadError = err.status === 404
          ? 'Event not found.'
          : 'Failed to load event information. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading event:', err);
      }
    });
  }

  /**
   * Submit the registration to the API.
   * Displays the server error message (e.g. duplicate email) on failure.
   */
  submit(): void {
    if (!this.event) return;

    this.submitting = true;
    this.submitError = null;

    this.apiService.submitRegistration({
      event_id: this.event.event_id,
      user_name: this.form.user_name,
      user_email: this.form.user_email,
      user_phone: this.form.user_phone,
      num_tickets: this.form.num_tickets
    }).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitError = err.error?.message || 'Failed to submit registration. Please try again later.';
        this.submitting = false;
        this.cdr.detectChanges();
        console.error('Error submitting registration:', err);
      }
    });
  }

  /**
   * Extract day number from date string
   */
  getDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  /**
   * Extract month abbreviation from date string
   */
  getMonth(dateString: string): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[new Date(dateString).getMonth()];
  }

  /**
   * Format a date string as "18 Oct 2026"
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getDate()} ${this.getMonth(dateString)} ${d.getFullYear()}`;
  }

  /**
   * Format time string for display
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
