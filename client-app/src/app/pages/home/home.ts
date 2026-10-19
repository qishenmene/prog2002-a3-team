import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCard } from '../../components/event-card/event-card';
import { ApiService, Event } from '../../services/api.service';

/**
 * Home page component displaying upcoming charity events
 * Fetches and displays active events from the API
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCard],
  template: `
    <div class="home-container">
      <section class="hero">
        <h2>Upcoming Charity Events</h2>
        <p>Find events funding tutoring, study resources and student support.</p>
      </section>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading" role="status">
        <p>Loading events...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="error" class="error-message" role="alert">
        <p>{{ error }}</p>
        <button (click)="loadEvents()" class="btn-retry">Try Again</button>
      </div>

      <!-- Events grid -->
      <div *ngIf="!loading && !error" class="events-grid">
        <app-event-card *ngFor="let event of events" [event]="event"></app-event-card>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !error && events.length === 0" class="empty-state">
        <p>No upcoming events at the moment. Please check back later!</p>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px 0;
    }
    .hero {
      text-align: center;
      margin-bottom: 30px;
    }
    .hero h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .hero p {
      color: #7f8c8d;
      font-size: 1.1em;
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
  `]
})
export class Home implements OnInit {
  events: Event[] = [];
  loading = true;
  error: string | null = null;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  /**
   * Start the initial event request.
   * @returns void
   */
  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Load upcoming events and update the loading or error state.
   * @returns void
   */
  loadEvents(): void {
    this.loading = true;
    this.error = null;
    
    this.apiService.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load events. Please try again later.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading events:', err);
      }
    });
  }

}
