import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Events</h1>
      <a routerLink="/create" class="btn-create">+ Create New Event</a>
    </div>

    <!-- Delete / API error banner -->
    <div *ngIf="deleteError" class="alert alert-error">
      {{ deleteError }}
    </div>

    <!-- Loading state -->
    <div *ngIf="loading" class="loading">
      <p>Loading events...</p>
    </div>

    <!-- Load error state -->
    <div *ngIf="!loading && loadError" class="alert alert-error">
      <p>{{ loadError }}</p>
      <button (click)="loadEvents()" class="btn-retry">Try Again</button>
    </div>

    <!-- Events table -->
    <div *ngIf="!loading && !loadError && events.length > 0" class="table-card">
      <table class="events-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Category</th>
            <th>Location</th>
            <th>Price</th>
            <th>Raised / Goal</th>
            <th>Status</th>
            <th>Registrations</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of events">
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
              <button (click)="deleteEvent(event)" class="btn-delete">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div *ngIf="!loading && !loadError && events.length === 0" class="empty-state">
      <p>No events found.</p>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .page-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.6rem;
    }
    .btn-create {
      background-color: #27ae60;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .btn-create:hover {
      background-color: #1e8449;
    }
    .alert {
      padding: 14px 18px;
      border-radius: 8px;
      border-left: 5px solid;
      margin-bottom: 20px;
    }
    .alert-error {
      background-color: #fdecea;
      border-color: #c0392b;
      color: #8b2a21;
    }
    .alert-error p {
      margin: 0 0 10px;
    }
    .btn-retry {
      background-color: #3498db;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 5px;
      cursor: pointer;
    }
    .loading, .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #7f8c8d;
    }
    .table-card {
      background: #ffffff;
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
      background-color: #34495e;
      color: #ffffff;
      text-align: left;
      padding: 12px 14px;
      white-space: nowrap;
    }
    .events-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #ecf0f1;
      vertical-align: middle;
    }
    .events-table tbody tr:hover {
      background-color: #f7f8fa;
    }
    .col-name {
      font-weight: 600;
      color: #2c3e50;
      min-width: 180px;
    }
    .col-location {
      max-width: 220px;
    }
    .col-center {
      text-align: center;
    }
    .free-tag {
      color: #e74c3c;
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
      color: #1e8449;
    }
    .badge-suspended {
      background-color: #fdecea;
      color: #c0392b;
    }
    .badge-past {
      background-color: #ecf0f1;
      color: #7f8c8d;
    }
    .col-actions {
      white-space: nowrap;
    }
    .btn-edit {
      background-color: #3498db;
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
      background-color: #2980b9;
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
  events: Event[] = [];
  loading = true;
  loadError: string | null = null;
  deleteError: string | null = null;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Load every event (any date, any availability) from the admin endpoint.
   */
  loadEvents(): void {
    this.loading = true;
    this.loadError = null;

    this.apiService.getAllEvents().subscribe({
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
   * @param event The event to delete
   */
  deleteEvent(event: Event): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.event_name}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    this.deleteError = null;
    this.apiService.deleteEvent(event.event_id).subscribe({
      next: () => {
        this.loadEvents();
      },
      error: (err) => {
        this.deleteError = err.error?.message || 'Failed to delete event. Please try again later.';
        this.cdr.detectChanges();
        console.error('Error deleting event:', err);
      }
    });
  }

  /**
   * Work out the display status of an event:
   * 'Suspended' (red) when suspended, 'Past' (grey) when the event date
   * has already passed, otherwise 'Available' (green).
   * @param event The event to inspect
   * @returns An object with the badge label and CSS class
   */
  getStatus(event: Event): { label: string; cssClass: string } {
    if (event.event_availability === 'Suspended') {
      return { label: 'Suspended', cssClass: 'badge-suspended' };
    }
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
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
    const d = new Date(dateString);
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
}
