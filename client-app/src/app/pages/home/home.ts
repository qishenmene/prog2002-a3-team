import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventCard } from '../../components/event-card/event-card';
import { ApiService, Event } from '../../services/api.service';

/**
 * Home page component displaying upcoming charity events
 * Fetches and displays active events from the API
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCard, RouterLink],
  template: `
    <div class="home-container">
      <section class="hero" aria-labelledby="home-heading">
        <div class="hero-copy">
          <p class="eyebrow">STUDENTS HELPER</p>
          <h2 id="home-heading">Charity events<br>for student support.</h2>
          <p>Find local events that raise funds for tutoring and study resources.</p>
          <a routerLink="/search" class="btn hero-button">Find an Event</a>
        </div>
        <div class="hero-note" *ngIf="!loading && !error && events.length > 0">
          <span class="note-label">NEXT UPCOMING EVENT</span>
          <p class="next-date">{{ events[0].event_date | date:'d MMMM y' }}</p>
          <h3>{{ events[0].event_name }}</h3>
          <p>{{ events[0].category_name }} · {{ events[0].event_ticket_price | currency:'AUD':'symbol':'1.2-2' }}</p>
          <a [routerLink]="['/event', events[0].event_id]">View event details &rarr;</a>
        </div>
      </section>

      <section class="about-section" aria-labelledby="about-heading">
        <div><p class="small-title">ABOUT US</p><h2 id="about-heading">About Students Helper</h2>
          <p>Students Helper supports college students who need additional academic assistance or are experiencing difficulties with their assessments.</p>
          <p>Our charity events bring students and the local community together to fund educational resources and academic support.</p></div>
        <address class="contact-card"><h3>Contact Students Helper</h3>
          <p><span>Email</span><a href="mailto:media@studentshelper.org">media@studentshelper.org</a></p>
          <p><span>Phone</span><a href="tel:0724863179">07 2486 3179</a></p>
          <p><span>Address</span>12 Students Avenue, Gold Coast, Queensland, Australia</p>
        </address>
      </section>
      <div class="events-heading"><div><p class="small-title">GET INVOLVED</p><h2>Upcoming Charity Events</h2></div>
        <a routerLink="/search">Search all events &rarr;</a></div>

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
    .home-container { padding: 20px 0; }
    .hero { display: grid; grid-template-columns: 1.8fr 1fr; gap: 32px; background: var(--brand); color: white; padding: clamp(24px,4vw,48px); border-radius: 10px; }
    .hero h2 { color: white; font-size: clamp(1.8rem,3.6vw,3rem); font-weight: 400; margin: 12px 0 22px; line-height: 1.12; }
    .hero-copy>p { max-width: 540px; }
    .eyebrow, .note-label { font-size: .75rem; letter-spacing: 2px; font-weight: 700; }
    .eyebrow { color: #f0c9b3; }
    .hero-button { background: var(--accent); margin-top: 12px; }
    .hero-button:hover { background: #963f36; }
    .hero-note { align-self: center; padding: 24px; border-left: 1px solid rgba(255,255,255,.3); }
    .hero-note p { font-size: .95rem; line-height: 1.6; }
    .hero-note h3 { color: white; font-family: Georgia, serif; font-size: 1.5rem; line-height: 1.3; }
    .hero-note a { color: white; text-underline-offset: 5px; }
    .next-date { color: #f0c9b3; }
    .about-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 48px; padding: 58px 0; }
    .about-section h2, .events-heading h2 { margin-top: 8px; font-size: 2rem; font-weight: 400; }
    .about-section p { color: var(--muted); }
    .contact-card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--brand); padding: 24px; font-style: normal; }
    .contact-card h3 { margin-top: 0; }
    .contact-card p { margin: 12px 0 0; font-size: .92rem; }
    .contact-card span { display: block; font-size: .75rem; font-weight: 700; color: var(--muted); text-transform: uppercase; }
    .contact-card a { color: var(--brand); }
    .events-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; }
    .events-heading h2 { margin-bottom: 0; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(min(100%,330px),1fr)); gap: 24px; }
    .error-message { color: var(--danger); padding: 24px; }
    @media(max-width: 700px) { .hero, .about-section { grid-template-columns: 1fr; } .hero-note { display: none; } .about-section { gap: 20px; padding: 36px 0; } .events-heading { align-items: flex-start; flex-direction: column; } }
  `]
})
export class Home implements OnInit {
  events: Event[] = [];
  loading = true;
  error: string | null = null;

  constructor(private destroyRef: DestroyRef, private apiService: ApiService, private cdr: ChangeDetectorRef) {}

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
    
    this.apiService.getEvents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
