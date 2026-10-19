import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { dayOfMonth, monthAbbr, formatDateShort, formatDateTime, formatTime, formatMoney, isPastDate } from '../../shared/format';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { errorMessage } from '../../shared/http-error';
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
      <h2>Event Registration</h2>
      <!-- Loading state -->
      <div *ngIf="loading" class="loading" role="status">
        <p>Loading event information...</p>
      </div>

      <!-- Error loading event -->
      <div *ngIf="!loading && loadError" class="error-message" role="alert">
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
          <p class="summary-row">{{ formatDate(event.event_date) }}</p>
          <p class="summary-row">{{ formatTime(event.event_time) }}</p>
          <p class="summary-row">{{ event.event_address }}</p>
          <p class="summary-row price" *ngIf="event.event_ticket_price > 0">
            {{ event.event_ticket_price | currency:'AUD':'symbol':'1.2-2' }} per ticket
          </p>
          <p class="summary-row price free" *ngIf="event.event_ticket_price === 0">
            FREE entry
          </p>
        </div>

        <!-- Registration form -->
        <div class="form-card" *ngIf="!submitted">
          <h3>Register for This Event</h3>
          <p class="helper-text">Enter your details to complete your registration.</p>

          <!-- Server error message -->
          <div *ngIf="submitError" class="server-error" role="alert">
            {{ submitError }}
          </div>

          <form (ngSubmit)="submit(regForm)" #regForm="ngForm" [attr.aria-busy]="submitting">
            <fieldset [disabled]="submitting" class="registration-fields">
            <div class="form-field">
              <label for="user_name">Full Name <span class="required">*</span></label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                [(ngModel)]="form.user_name"
                required maxlength="100" pattern=".*\\S.*" autocomplete="name"
                #nameInput="ngModel"
                [class.invalid]="nameInput.invalid && nameInput.touched"
                [attr.aria-invalid]="nameInput.invalid && nameInput.touched"
                [attr.aria-describedby]="nameInput.invalid && nameInput.touched ? 'name-error' : null"
              />
              <span id="name-error" class="validation-error" *ngIf="nameInput.invalid && nameInput.touched">
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
                email maxlength="100" autocomplete="email"
                #emailInput="ngModel"
                [class.invalid]="emailInput.invalid && emailInput.touched"
                [attr.aria-invalid]="emailInput.invalid && emailInput.touched"
                [attr.aria-describedby]="emailInput.invalid && emailInput.touched ? 'email-error' : null"
              />
              <span id="email-error" class="validation-error" *ngIf="emailInput.invalid && emailInput.touched">
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
                maxlength="20" autocomplete="tel"
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
                min="1" max="2147483647" step="1" pattern="[0-9]+"
                #ticketsInput="ngModel"
                [class.invalid]="ticketsInput.invalid && ticketsInput.touched"
                [attr.aria-invalid]="ticketsInput.invalid && ticketsInput.touched"
                [attr.aria-describedby]="ticketsInput.invalid && ticketsInput.touched ? 'tickets-error' : null"
              />
              <span id="tickets-error" class="validation-error" *ngIf="ticketsInput.invalid && ticketsInput.touched">
                Enter a whole number of tickets, starting at 1.
              </span>
            </div>

            <p class="order-total">Total: <strong>{{ totalCost() | currency:'AUD':'symbol':'1.2-2' }}</strong></p>
            <p class="helper-text">{{ form.num_tickets || 0 }} ticket(s). Your details will be used for this event registration.</p>
            <button
              type="submit"
              class="btn-submit"
              [disabled]="regForm.invalid || submitting"
            >
              {{ submitting ? 'Submitting...' : 'Submit Registration' }}
            </button>
            </fieldset>
          </form>
        </div>

        <!-- Success confirmation panel -->
        <div class="form-card success-panel" *ngIf="submitted" #confirmation tabindex="-1" role="status">
          <div class="success-icon">✓</div>
          <h3>Registration Confirmed!</h3>
          <p>Registration reference: <strong>{{ registrationId }}</strong></p>
          <p>{{ form.num_tickets }} ticket(s) · Total {{ totalCost() | currency:'AUD':'symbol':'1.2-2' }}</p>
          <p>
            Thank you, <strong>{{ form.user_name }}</strong>! Your registration for
            <strong>{{ event.event_name }}</strong> is confirmed.
          </p>
          <p>Registered email: <strong>{{ form.user_email }}</strong>.</p>
          <div class="success-actions">
            <a [routerLink]="['/event', event.event_id]" class="btn-secondary">Back to Event</a>
            <a routerLink="/" class="btn-secondary">Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registration-fields { border: 0; padding: 0; margin: 0; min-width: 0; }
    .register-container {
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
    .btn-back {
      display: inline-block;
      background-color: var(--brand);
      color: white;
      text-decoration: none;
      padding: 10px 25px;
      border-radius: 5px;
      margin-top: 15px;
    }
    .register-layout {
      display: grid;
      grid-template-columns: minmax(240px, .85fr) minmax(0, 1.4fr);
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
      color: var(--dark);
      margin-top: 0;
    }
    .summary-badge {
      background: linear-gradient(135deg, var(--brand), var(--brand-dark));
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
      color: var(--dark);
      margin: 0 0 15px;
      font-size: 1.2em;
    }
    .summary-row {
      color: var(--muted);
      overflow-wrap: anywhere;
      font-size: 0.95em;
      margin: 8px 0;
    }
    .summary-row.price {
      color: var(--success);
      font-weight: bold;
    }
    .summary-row.price.free {
      color: var(--brand);
    }
    .helper-text {
      color: var(--muted);
      font-size: 0.9em;
      margin-top: -5px;
    }
    .server-error {
      background-color: #fdf0ef;
      border: 1px solid var(--danger);
      color: var(--brand-dark);
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
      color: var(--dark);
      margin-bottom: 6px;
    }
    .required {
      color: var(--brand);
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
      outline: 2px solid var(--brand);
      border-color: var(--brand);
    }
    .form-field input.invalid {
      border-color: var(--danger);
    }
    .validation-error {
      color: var(--danger);
      font-size: 0.85em;
      margin-top: 5px;
      display: block;
    }
    .btn-submit {
      background-color: var(--brand);
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
      background-color: var(--brand-dark);
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
      background-color: var(--success);
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
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      margin-top: 25px;
    }
    .btn-secondary {
      background-color: var(--brand);
      color: white;
      text-decoration: none;
      padding: 10px 25px;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    .btn-secondary:hover {
      background-color: var(--brand-dark);
    }
  `]
})
export class Register implements OnInit {
  @ViewChild('confirmation') confirmation?: ElementRef<HTMLElement>;
  registrationId: number | null = null;
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

  constructor(private destroyRef: DestroyRef, 
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Load the event summary using the route's event ID.
   * @returns void
   */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.loadError = 'Invalid event ID.';
      this.loading = false;
      return;
    }

    this.apiService.getEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.event = data;
        if (isPastDate(data.event_date)) this.loadError = 'Registration is closed because this event has already taken place.';
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
   * Displays confirmation after saving, or the server error on failure.
   * @param regForm - The form whose controls are validated before submitting.
   * @returns void
   */
  submit(regForm: NgForm): void {
    if (!this.event || this.submitting || this.submitted) return;
    regForm.control.markAllAsTouched();
    if (regForm.invalid || !this.form.user_name.trim() || !Number.isInteger(this.form.num_tickets)) return;
    this.form.user_name = this.form.user_name.trim();
    this.form.user_email = this.form.user_email.trim();
    this.form.user_phone = this.form.user_phone.trim();

    this.submitting = true;
    this.submitError = null;

    this.apiService.submitRegistration({
      event_id: this.event.event_id,
      user_name: this.form.user_name,
      user_email: this.form.user_email,
      user_phone: this.form.user_phone,
      num_tickets: this.form.num_tickets
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.registrationId = response.registration_id;
        this.submitted = true;
        this.submitting = false;
        this.cdr.detectChanges();
        this.confirmation?.nativeElement.focus();
      },
      error: (err) => {
        this.submitError = errorMessage(err, 'Failed to submit registration. Please try again.');
        this.submitting = false;
        this.cdr.detectChanges();
        console.error('Error submitting registration:', err);
      }
    });
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
   * @param dateString - The event date returned by the API.
   * @returns The formatted date, or an empty string when no date is supplied.
   */
  formatDate(dateString: string): string {
    return formatDateShort(dateString);
  }

  /**
   * Format a database time for display in the registration summary.
   * @param timeString - A time in HH:MM or HH:MM:SS format.
   * @returns A twelve-hour time with AM or PM, or an empty string for no time.
   */
  formatTime(timeString: string): string {
    return formatTime(timeString);
  }
  /**
   * Calculate the ticket total for the summary and confirmation.
   * @returns The amount in Australian dollars, rounded to cents.
   */
  totalCost(): number {
    return this.event && Number.isInteger(this.form.num_tickets) && this.form.num_tickets > 0
      ? Math.round(this.event.event_ticket_price * this.form.num_tickets * 100) / 100 : 0;
  }
}
