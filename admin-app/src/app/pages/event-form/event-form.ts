import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, Category, Registration } from '../../services/api.service';

/** Editable fields; numeric controls are empty until staff enter a value. */
export interface EventFormModel {
  latitude: number | null; longitude: number | null;
  event_name: string; event_date: string; event_time: string; event_address: string;
  event_purpose: string; event_description: string; event_ticket_price: number | null;
  event_goal_amount: number | null; event_category_id: number | null; event_availability: string;
}

/**
 * Admin event form page, shared by the create and edit routes.
 * In edit mode (route contains an :id param) the form is pre-filled
 * with the existing event and an availability selector is shown.
 * The edit page also lists the event's registrations without changing them.
 */
@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-page">
      <a routerLink="/" class="back-link">&larr; Back to List</a>
      <h1>{{ isEditMode ? 'Edit Event' : 'Create New Event' }}</h1>

      <!-- Success banner -->
      <div *ngIf="successMessage" class="alert alert-success" role="status">
        {{ successMessage }}
      </div>

      <!-- Error banner -->
      <div *ngIf="errorMessage" class="alert alert-error" role="alert">
        {{ errorMessage }}
      </div>

      <!-- Loading state while fetching the event in edit mode -->
      <div *ngIf="loadingEvent" class="loading">
        <p>Loading event...</p>
      </div>

      <div *ngIf="!loadingEvent && (!isEditMode || eventLoaded)" class="form-card">
        <form #eventForm="ngForm" (ngSubmit)="onSubmit(eventForm)">
          <div class="field">
            <label for="event_name">Event Name *</label>
            <input id="event_name" name="event_name" class="input" type="text"
                   [(ngModel)]="form.event_name" required maxlength="100" pattern=".*\\S.*" />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="event_date">Date *</label>
              <input id="event_date" name="event_date" class="input" type="date"
                     [(ngModel)]="form.event_date" required />
            </div>
            <div class="field">
              <label for="event_time">Time *</label>
              <input id="event_time" name="event_time" class="input" type="time"
                     [(ngModel)]="form.event_time" required />
            </div>
          </div>

          <div class="field">
            <label for="event_address">Location / Address *</label>
            <input id="event_address" name="event_address" class="input" type="text"
                   [(ngModel)]="form.event_address" required maxlength="150" pattern=".*\\S.*" />
          </div>

          <div class="field">
            <label for="event_purpose">Purpose *</label>
            <input id="event_purpose" name="event_purpose" class="input" type="text"
                   [(ngModel)]="form.event_purpose" required maxlength="150" pattern=".*\\S.*" />
          </div>

          <div class="field">
            <label for="event_description">Description *</label>
            <textarea id="event_description" name="event_description" class="textarea"
                      [(ngModel)]="form.event_description" required maxlength="500" pattern="[\\s\\S]*\\S[\\s\\S]*"></textarea>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="event_ticket_price">Ticket Price ($) *</label>
              <input id="event_ticket_price" name="event_ticket_price" class="input"
                     type="number" step="0.01" min="0" max="99999999.99" pattern="[0-9]+(\\.[0-9]{1,2})?"
                     [(ngModel)]="form.event_ticket_price" required />
            </div>
            <div class="field">
              <label for="event_goal_amount">Goal Amount ($) *</label>
              <input id="event_goal_amount" name="event_goal_amount" class="input"
                     type="number" step="0.01" min="0" max="99999999.99" pattern="[0-9]+(\\.[0-9]{1,2})?"
                     [(ngModel)]="form.event_goal_amount" required />
            </div>
          </div>

          <div class="field">
            <label for="event_category_id">Category *</label>
            <select id="event_category_id" name="event_category_id" class="select"
                    [(ngModel)]="form.event_category_id" required>
              <option [ngValue]="null" disabled>Select a category</option>
              <option *ngFor="let category of categories" [ngValue]="category.category_id">
                {{ category.category_name }}
              </option>
            </select>
          </div>

          <fieldset class="weather-location">
            <legend>Weather location (optional)</legend>
            <p>Enter both coordinates to show a forecast for the event location.</p>
            <div class="field-row">
              <div class="field"><label for="latitude">Latitude</label>
                <input class="input" id="latitude" name="latitude" type="number" min="-90" max="90" step="0.000001" [(ngModel)]="form.latitude" /></div>
              <div class="field"><label for="longitude">Longitude</label>
                <input class="input" id="longitude" name="longitude" type="number" min="-180" max="180" step="0.000001" [(ngModel)]="form.longitude" /></div>
            </div>
            <p *ngIf="!coordinatesValid()" class="error-text" role="alert">Enter both coordinates, or leave both blank.</p>
          </fieldset>

          <!-- Availability can only be changed on an existing event -->
          <div class="field" *ngIf="isEditMode">
            <label for="event_availability">Availability *</label>
            <select id="event_availability" name="event_availability" class="select"
                    [(ngModel)]="form.event_availability" required>
              <option value="Available">Available</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <p *ngIf="eventForm.invalid && eventForm.touched" class="error-text" role="alert">Complete the required fields. Amounts must be non-negative and use at most two decimal places.</p>
          <div class="form-actions">
            <button type="submit" class="btn-submit"
                    [disabled]="eventForm.invalid || !coordinatesValid() || saving || !!successMessage">
              {{ saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Event') }}
            </button>
            <a routerLink="/" class="btn-cancel">Cancel</a>
          </div>
        </form>
      </div>

      <section *ngIf="isEditMode && eventLoaded" class="registration-card"
               aria-labelledby="registrations-heading">
        <h2 id="registrations-heading">Event Registrations</h2>
        <div aria-live="polite">
          <p *ngIf="loadingRegistrations">Loading registrations...</p>
          <div *ngIf="!loadingRegistrations && registrationError" class="alert alert-error"
               role="alert">
            <p>{{ registrationError }}</p>
            <button type="button" class="btn-retry" (click)="loadRegistrations(eventId!)">
              Try Again
            </button>
          </div>
          <p *ngIf="!loadingRegistrations && !registrationError && registrations.length === 0">
            No registrations for this event yet.
          </p>
        </div>

        <ng-container *ngIf="!loadingRegistrations && !registrationError && registrations.length > 0">
          <p>Total registrations: {{ registrations.length }}. Newest first.</p>
          <div class="registrations-table-wrapper" tabindex="0" role="region"
               aria-label="Event registration records">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Tickets</th>
                  <th scope="col">Registered</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let registration of registrations">
                  <td>{{ registration.user_name }}</td>
                  <td>{{ registration.user_email }}</td>
                  <td>{{ registration.user_phone || 'Not provided' }}</td>
                  <td>{{ registration.num_tickets }}</td>
                  <td>{{ registration.registration_date | date:'medium' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </section>
    </div>
  `,
  styles: [`
    .form-page {
      max-width: 720px;
      margin: 0 auto;
    }
    .back-link {
      color: var(--brand);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    h1 {
      color: var(--dark);
      font-size: 1.6rem;
      margin: 12px 0 20px;
    }
    .alert {
      padding: 14px 18px;
      border-radius: 8px;
      border-left: 5px solid;
      margin-bottom: 20px;
    }
    .alert-error {
      background-color: #fdecea;
      border-color: var(--brand-dark);
      color: #8b2a21;
    }
    .alert-success {
      background-color: #eafaf1;
      border-color: var(--success);
      color: #1d7a45;
    }
    .loading {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    .form-card, .registration-card {
      background: var(--surface);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      padding: 28px;
    }
    .registration-card {
      margin-top: 24px;
    }
    .registration-card h2 {
      margin: 0 0 16px;
      color: var(--dark);
      font-size: 1.25rem;
    }
    .registrations-table-wrapper {
      overflow-x: auto;
    }
    .registrations-table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .registrations-table th, .registrations-table td {
      padding: 12px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e9ed;
    }
    .registrations-table th {
      background-color: #f5f7f9;
      color: var(--dark);
    }
    .btn-retry {
      background-color: var(--brand);
      color: #ffffff;
      border: none;
      border-radius: 5px;
      padding: 8px 18px;
      font: inherit;
      cursor: pointer;
    }
    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 18px;
      flex: 1;
    }
    .field-row {
      display: flex;
      gap: 18px;
    }
    .field label {
      margin-bottom: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--dark);
    }
    .input, .select, .textarea {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #cfd6dc;
      border-radius: 6px;
      background-color: var(--surface);
      color: #333333;
      font: inherit;
      box-sizing: border-box;
    }
    .input:focus, .select:focus, .textarea:focus {
      outline: 2px solid rgba(52, 152, 219, 0.35);
      border-color: var(--brand);
    }
    .textarea {
      min-height: 110px;
      resize: vertical;
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 8px;
    }
    .btn-submit {
      background-color: var(--success);
      color: #ffffff;
      border: none;
      padding: 11px 26px;
      border-radius: 6px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      background-color: var(--brand-dark);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-cancel {
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
    }
    .btn-cancel:hover {
      color: var(--dark);
    }
  `]
})
export class EventForm implements OnInit {
  /** Whether the form is editing an existing event (route has an id). */
  isEditMode = false;
  /** ID of the event being edited (edit mode only). */
  eventId: number | null = null;
  /** Category options for the dropdown. */
  categories: Category[] = [];
  /** True while the existing event is being fetched (edit mode). */
  loadingEvent = false;
  /** True after the event details have loaded successfully. */
  eventLoaded = false;
  /** Registrations associated with the loaded event, newest first. */
  registrations: Registration[] = [];
  /** True while the registration list is being retrieved. */
  loadingRegistrations = false;
  /** Registration failures are kept separate from event form errors. */
  registrationError: string | null = null;
  /** True while a create/update request is in flight. */
  saving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  /** Form model bound with ngModel. */
  form: EventFormModel = {
    latitude: null, longitude: null,
    event_name: '',
    event_date: '',
    event_time: '',
    event_address: '',
    event_purpose: '',
    event_description: '',
    event_ticket_price: null,
    event_goal_amount: null,
    event_category_id: null,
    event_availability: 'Available'
  };

  constructor(private destroyRef: DestroyRef, 
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Load categories and, for an edit route, the selected event.
   * @returns void
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.loadCategories();

    if (idParam) {
      this.isEditMode = true;
      this.eventId = Number(idParam);
      this.loadEvent(this.eventId);
    }
  }

  /**
   * Load the category options for the dropdown.
   * @returns void
   */
  loadCategories(): void {
    this.apiService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories. Please refresh and try again.';
        this.cdr.detectChanges();
        console.error('Error loading categories:', err);
      }
    });
  }

  /**
   * Fetch the existing event and pre-fill the form (edit mode only).
   * The API returns the date as an ISO string and the time as HH:MM:SS,
   * so both are trimmed to fit the date/time inputs.
   * Registrations are requested only after the event has been found.
   * @param id - The event ID.
   * @returns void
   */
  loadEvent(id: number): void {
    this.loadingEvent = true;
    this.eventLoaded = false;

    this.apiService.getEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (event) => {
        this.form = {
          latitude: event.latitude ?? null, longitude: event.longitude ?? null,
          event_name: event.event_name,
          event_date: event.event_date ? event.event_date.split('T')[0] : '',
          event_time: event.event_time ? event.event_time.substring(0, 5) : '',
          event_address: event.event_address,
          event_purpose: event.event_purpose,
          event_description: event.event_description,
          event_ticket_price: event.event_ticket_price,
          event_goal_amount: event.event_goal_amount,
          event_category_id: event.event_category_id,
          event_availability: event.event_availability
        };
        this.loadingEvent = false;
        this.eventLoaded = true;
        this.loadRegistrations(id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load event. Please try again later.';
        this.loadingEvent = false;
        this.cdr.detectChanges();
        console.error('Error loading event:', err);
      }
    });
  }

  /**
   * Load an event's registrations independently of the editable event fields.
   * A failed request leaves the event editable and can be retried in the page.
   * @param eventId - The event whose registration records should be displayed.
   * @returns void
   */
  loadRegistrations(eventId: number): void {
    this.loadingRegistrations = true;
    this.registrationError = null;
    this.registrations = [];

    this.apiService.getEventRegistrations(eventId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (registrations) => {
        this.registrations = registrations;
        this.loadingRegistrations = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.registrationError = 'Failed to load registrations. Please try again.';
        this.loadingRegistrations = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Submit the form: create a new event or update the existing one.
   * On success a green banner is shown and the user is sent back to
   * the list after one second.
   * @param eventForm - The template form to validate before saving.
   * @returns void
   */
  onSubmit(eventForm: NgForm): void {
    eventForm.control.markAllAsTouched();
    if (eventForm.invalid || !this.coordinatesValid() || this.saving || this.successMessage) {
      return;
    }
    this.saving = true;
    this.successMessage = null;
    this.errorMessage = null;

    if (this.isEditMode && this.eventId !== null) {
      const payload = { ...this.form, event_ticket_price: Number(this.form.event_ticket_price),
        event_goal_amount: Number(this.form.event_goal_amount), event_category_id: Number(this.form.event_category_id) };
      this.apiService.updateEvent(this.eventId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.handleSuccess('Event updated successfully.'),
        error: (err) => this.handleError(err)
      });
    } else {
      // The backend defaults availability to 'Available' on creation.
      const { event_availability, ...payload } = this.form;
      this.apiService.createEvent({ ...payload, event_ticket_price: Number(payload.event_ticket_price),
        event_goal_amount: Number(payload.event_goal_amount), event_category_id: Number(payload.event_category_id) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.handleSuccess('Event created successfully.'),
        error: (err) => this.handleError(err)
      });
    }
  }

  /**
   * Show the success banner, then navigate back to the event list.
   * @param message - The success message to display.
   * @returns void
   */
  private handleSuccess(message: string): void {
    this.saving = false;
    this.successMessage = message;
    this.cdr.detectChanges();
    const redirectTimer = setTimeout(() => {
      this.router.navigate(['/']);
    }, 1000);
    this.destroyRef.onDestroy(() => clearTimeout(redirectTimer));
  }

  /**
   * Display the API error message verbatim when available.
   * @param err - The HTTP error response.
   * @returns void
   */
  private handleError(err: HttpErrorResponse): void {
    this.saving = false;
    this.errorMessage = err.error?.message || 'Failed to save event. Please try again later.';
    this.cdr.detectChanges();
    console.error('Error saving event:', err);
  }
  /**
   * Check that an optional location contains both coordinates.
   * @returns Whether both values are present or both are empty.
   */
  coordinatesValid(): boolean { return (this.form.latitude == null) === (this.form.longitude == null); }
}
