import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Event } from '../../services/api.service';

/**
 * Admin event list page.
 * Shows every event (including suspended and past events) in a table,
 * with actions to create, edit and delete events.
 */
@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Events</h1>
      <a routerLink="/create" class="btn-create">+ Create New Event</a>
    </div>

    <!-- Delete / API error banner -->
    <div *ngIf="deleteError" class="alert alert-error" role="alert">
      {{ deleteError }}
    </div>

    <!-- Loading state -->
    <div *ngIf="loading" class="loading" role="status">
      <p>Loading events...</p>
    </div>

    <!-- Load error state -->
    <div *ngIf="!loading && loadError" class="alert alert-error" role="alert">
      <p>{{ loadError }}</p>
      <button (click)="loadEvents()" class="btn-retry">Try Again</button>
    </div>

    <section *ngIf="!loading && !loadError" class="list-tools" aria-label="Filter event list">
      <div><label for="event-query">Find an event</label><input id="event-query" name="query" [(ngModel)]="query" placeholder="Name, location or category" /></div>
      <div><label for="event-status">Status</label><select id="event-status" name="status" [(ngModel)]="statusFilter">
        <option value="">All statuses</option><option>Available</option><option>Past</option><option>Suspended</option>
      </select></div>
      <p role="status">Showing {{ filteredEvents().length }} of {{ events.length }} events</p>
    </section>

    <!-- Events table -->
    <div *ngIf="!loading && !loadError && events.length > 0" class="table-card" tabindex="0" role="region" aria-label="All charity events">
      <table class="events-table">
        <thead>
          <tr>
            <th scope="col">Event Name</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Category</th>
            <th scope="col">Location</th>
            <th scope="col">Price</th>
            <th scope="col">Raised / Goal</th>
            <th scope="col">Status</th>
            <th scope="col">Registrations</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of filteredEvents()">
            <td class="col-name">{{ event.event_name }}</td>
            <td>{{ formatDate(event.event_date) }}</td>
            <td>{{ formatTime(event.event_time) }}</td>
            <td>{{ event.category_name }}</td>
            <td class="col-location">{{ event.event_address }}</td>
            <td>
              <span *ngIf="event.event_ticket_price > 0">\${{ event.event_ticket_price }}</span>
              <span *ngIf="event.event_ticket_price == 0" class="free-tag">FREE</span>
            </td>
            <td>\${{ event.event_goal_raised_amount }} / \${{ event.event_goal_amount }}</td>
            <td>
              <span class="badge" [ngClass]="getStatus(event).cssClass">
                {{ getStatus(event).label }}
              </span>
            </td>
            <td class="col-center">{{ event.registration_count ?? 0 }}</td>
            <td class="col-actions">
              <a [routerLink]="['/edit', event.event_id]" class="btn-edit">Edit</a>
              <button (click)="deleteEvent(event)" class="btn-delete" [disabled]="(event.registration_count || 0) > 0 || deletingId !== null"
                      [attr.aria-label]="'Delete ' + event.event_name">{{ deletingId === event.event_id ? 'Deleting...' : 'Delete' }}</button>
              <span *ngIf="(event.registration_count || 0) > 0" class="protected-note">Protected: has registrations</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p *ngIf="!loading && !loadError && events.length > 0 && filteredEvents().length === 0" role="status">No events match these filters. Try another name or status.</p>
    <!-- Empty state -->
    <div *ngIf="!loading && !loadError && events.length === 0" class="empty-state">
      <p>No events found.</p>
    </div>
  `,
  styles: [`
    .list-tools { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; margin-bottom: 20px; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
    .list-tools label { display: block; font-weight: 600; margin-bottom: 6px; }
    .list-tools input, .list-tools select { padding: 10px; border: 1px solid var(--border); border-radius: 5px; max-width: 100%; }
    .list-tools p { margin: 0 0 8px; color: var(--muted); }
    .protected-note { display: block; font-size: .75rem; color: var(--muted); margin-top: 8px; }
    .table-card { overflow-x: auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .page-header h1 {
      margin: 0;
      color: var(--dark);
      font-size: 1.6rem;
    }
    .btn-create {
      background-color: var(--success);
      color: #ffffff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .btn-create:hover {
      background-color: var(--brand-dark);
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
    .alert-error p {
      margin: 0 0 10px;
    }
    .btn-retry {
      background-color: var(--brand);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 5px;
      cursor: pointer;
    }
    .loading, .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    .table-card {
      background: var(--surface);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      overflow-x: auto;
    }
    .events-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .events-table th {
      background-color: var(--dark-soft);
      color: #ffffff;
      text-align: left;
      padding: 12px 14px;
      white-space: nowrap;
    }
    .events-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--brand-soft);
      vertical-align: middle;
    }
    .events-table tbody tr:hover {
      background-color: #f7f8fa;
    }
    .col-name {
      font-weight: 600;
      color: var(--dark);
      min-width: 180px;
    }
    .col-location {
      max-width: 220px;
    }
    .col-center {
      text-align: center;
    }
    .free-tag {
      color: var(--brand);
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-available {
      background-color: #eafaf1;
      color: var(--brand-dark);
    }
    .badge-suspended {
      background-color: #fdecea;
      color: var(--brand-dark);
    }
    .badge-past {
      background-color: var(--brand-soft);
      color: var(--muted);
    }
    .col-actions {
      white-space: nowrap;
    }
    .btn-edit {
      background-color: var(--brand);
      color: #ffffff;
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 5px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-right: 8px;
      transition: background-color 0.2s;
    }
    .btn-edit:hover {
      background-color: var(--brand-dark);
    }
    .btn-delete {
      background-color: #dc3545;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 5px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-delete:hover {
      background-color: #b02a37;
    }
  `]
})
export class EventList implements OnInit {
  query = '';
  statusFilter = '';
  deletingId: number | null = null;
  events: Event[] = [];
  loading = true;
  loadError: string | null = null;
  deleteError: string | null = null;

  constructor(private destroyRef: DestroyRef, private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  /**
   * Load the administrative event list.
   * @returns void
   */
  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Load every event (any date, any availability) from the admin endpoint.
   * @returns void
   */
  loadEvents(): void {
    this.loading = true;
    this.loadError = null;

    this.apiService.getAllEvents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadError = 'Failed to load events. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading events:', err);
      }
    });
  }

  /**
   * Ask for confirmation, then delete the given event.
   * The backend rejects deletion when registrations exist; its message
   * is displayed verbatim in the error banner above the table.
   * @param event - The event to delete.
   * @returns void
   */
  deleteEvent(event: Event): void {
    if (this.deletingId !== null || (event.registration_count || 0) > 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.event_name}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    this.deleteError = null;
    this.deletingId = event.event_id;
    this.apiService.deleteEvent(event.event_id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadEvents();
      },
      error: (err) => {
        this.deletingId = null;
        this.deleteError = err.error?.message || 'Failed to delete event. Please try again later.';
        this.cdr.detectChanges();
        console.error('Error deleting event:', err);
      }
    });
  }

  /**
   * Determine availability using the Queensland calendar date.
   * Suspended events keep their status regardless of the event date.
   * @param event The event to inspect
   * @returns An object with the badge label and CSS class
   */
  getStatus(event: Event): { label: string; cssClass: string } {
    if (event.event_availability === 'Suspended') {
      return { label: 'Suspended', cssClass: 'badge-suspended' };
    }
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = (type: string) => parts.find(item => item.type === type)!.value;
    const today = part('year') + '-' + part('month') + '-' + part('day');
    if (event.event_date.slice(0, 10) < today) {
      return { label: 'Past', cssClass: 'badge-past' };
    }
    return { label: 'Available', cssClass: 'badge-available' };
  }

  /**
   * Format an ISO date string as a readable date (e.g. 18 Dec 2026).
   * @param dateString The event date string from the API
   * @returns The formatted date
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(dateString.slice(0, 10) + 'T00:00:00');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Format a HH:MM:SS time string as 12-hour time (e.g. 6:00 PM).
   * @param timeString The event time string from the API
   * @returns The formatted time
   */
  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  /**
   * Filter the loaded list without discarding events from the original data.
   * @returns Events matching the selected text and status.
   */
  filteredEvents(): Event[] {
    const term = this.query.trim().toLowerCase();
    return this.events.filter(event => (!this.statusFilter || this.getStatus(event).label === this.statusFilter) &&
      [event.event_name, event.event_address, event.category_name || ''].join(' ').toLowerCase().includes(term));
  }
}
