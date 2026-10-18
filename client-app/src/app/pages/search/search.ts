import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Event } from '../../services/api.service';

/**
 * Search page component allowing visitors to filter charity events
 * by date, location and category via GET /api/events/search.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="search-container">
      <section class="hero">
        <h2>Search Events</h2>
        <p>Find charity events by date, location or category</p>
      </section>

      <!-- Search form -->
      <form class="search-form" (ngSubmit)="search()">
        <div class="form-field">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" [(ngModel)]="filters.date" />
        </div>
        <div class="form-field">
          <label for="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            [(ngModel)]="filters.location"
            placeholder="e.g. Lismore"
          />
        </div>
        <div class="form-field">
          <label for="category">Category</label>
          <select id="category" name="category" [(ngModel)]="filters.category">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat.category_id">
              {{ cat.category_name }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-search">Search</button>
          <button type="button" class="btn-clear" (click)="clear()">Clear</button>
        </div>
      </form>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading">
        <p>Searching events...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="error" class="error-message">
        <p>{{ error }}</p>
        <button (click)="search()" class="btn-retry">Try Again</button>
      </div>

      <!-- Results -->
      <div *ngIf="searched && !loading && !error">
        <h3 class="results-heading">{{ events.length }} event(s) found</h3>

        <div *ngIf="events.length > 0" class="events-grid">
          <div *ngFor="let event of events" class="event-card">
            <div class="event-date-badge">
              <span class="day">{{ getDay(event.event_date) }}</span>
              <span class="month">{{ getMonth(event.event_date) }}</span>
            </div>

            <div class="event-content">
              <span class="category-tag">{{ event.category_name || 'General' }}</span>
              <h3>{{ event.event_name }}</h3>
              <p class="event-address">📍 {{ event.event_address }}</p>
              <p class="event-time">🕐 {{ formatTime(event.event_time) }}</p>
              <p class="event-description">{{ truncateDescription(event.event_description) }}</p>

              <div class="event-footer">
                <span class="ticket-price" *ngIf="event.event_ticket_price > 0">
                  \${{ event.event_ticket_price }}
                </span>
                <span class="ticket-price free" *ngIf="event.event_ticket_price === 0">
                  FREE
                </span>
                <a [routerLink]="['/event', event.event_id]" class="btn-view">View Details</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="events.length === 0" class="empty-state">
          <p>No events match your search criteria.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      padding: 20px 0;
    }
    .hero {
      text-align: center;
      margin-bottom: 25px;
    }
    .hero h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .hero p {
      color: #7f8c8d;
      font-size: 1.1em;
    }
    .search-form {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: flex-end;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 25px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 160px;
    }
    .form-field label {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 6px;
      font-size: 0.9em;
    }
    .form-field input,
    .form-field select {
      padding: 10px;
      border: 1px solid #bdc3c7;
      border-radius: 5px;
      font-size: 1em;
    }
    .form-field input:focus,
    .form-field select:focus {
      outline: none;
      border-color: #3498db;
    }
    .form-actions {
      display: flex;
      gap: 10px;
    }
    .btn-search {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 10px 25px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.3s;
    }
    .btn-search:hover {
      background-color: #c0392b;
    }
    .btn-clear {
      background-color: #ecf0f1;
      color: #2c3e50;
      border: none;
      padding: 10px 25px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.3s;
    }
    .btn-clear:hover {
      background-color: #bdc3c7;
    }
    .results-heading {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    .loading, .error-message, .empty-state {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }
    .error-message {
      color: #e74c3c;
    }
    .btn-retry {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 25px;
      padding: 20px 0;
    }
    .event-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      display: flex;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .event-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    .event-date-badge {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      padding: 20px 15px;
      text-align: center;
      min-width: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .event-date-badge .day {
      font-size: 2em;
      font-weight: bold;
      line-height: 1;
    }
    .event-date-badge .month {
      font-size: 0.9em;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .event-content {
      padding: 20px;
      flex: 1;
    }
    .category-tag {
      background-color: #ecf0f1;
      color: #7f8c8d;
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8em;
      text-transform: uppercase;
    }
    .event-content h3 {
      margin: 10px 0;
      color: #2c3e50;
      font-size: 1.3em;
    }
    .event-address, .event-time {
      color: #7f8c8d;
      font-size: 0.9em;
      margin: 5px 0;
    }
    .event-description {
      color: #555;
      font-size: 0.95em;
      line-height: 1.5;
      margin: 10px 0;
    }
    .event-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #ecf0f1;
    }
    .ticket-price {
      font-size: 1.2em;
      font-weight: bold;
      color: #27ae60;
    }
    .ticket-price.free {
      color: #e74c3c;
    }
    .btn-view {
      background-color: #3498db;
      color: white;
      text-decoration: none;
      padding: 8px 20px;
      border-radius: 5px;
      font-size: 0.9em;
      transition: background-color 0.3s;
    }
    .btn-view:hover {
      background-color: #2980b9;
    }
  `]
})
export class Search implements OnInit {
  categories: any[] = [];
  events: Event[] = [];
  filters = { date: '', location: '', category: '' };
  loading = false;
  searched = false;
  error: string | null = null;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  /**
   * Load categories for the filter drop-down on init
   */
  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  /**
   * Execute a search with the current filter values.
   * Empty filters are omitted from the query string.
   */
  search(): void {
    this.loading = true;
    this.error = null;

    const params: any = {};
    if (this.filters.date) params.date = this.filters.date;
    if (this.filters.location) params.location = this.filters.location;
    if (this.filters.category) params.category = this.filters.category;

    this.apiService.searchEvents(params).subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
        this.searched = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Search failed. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error searching events:', err);
      }
    });
  }

  /**
   * Reset all filters and clear the results
   */
  clear(): void {
    this.filters = { date: '', location: '', category: '' };
    this.events = [];
    this.searched = false;
    this.error = null;
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

  /**
   * Truncate description to 100 characters
   */
  truncateDescription(description: string): string {
    if (!description) return '';
    return description.length > 100 ? description.substring(0, 100) + '...' : description;
  }
}
