import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, Category, Event } from '../../services/api.service';
import { EventCard } from '../../components/event-card/event-card';
import { errorMessage } from '../../shared/http-error';

/** Filters events through the API and preserves search criteria in the URL. */
@Component({
  selector: 'app-search', standalone: true,
  imports: [CommonModule, FormsModule, EventCard],
  template: `
    <section class="search-container" aria-labelledby="search-heading">
      <div class="hero">
        <h2 id="search-heading">Search Events</h2>
        <p>Find a charity event by date, location or category.</p>
      </div>
      <div *ngIf="categoryError" class="alert alert-error" role="alert">
        <p>{{ categoryError }}</p>
        <button type="button" class="btn btn-outline" (click)="loadCategories()">Retry Categories</button>
      </div>
      <form class="search-form" (ngSubmit)="search()">
        <div class="field">
          <label for="search-date">Date</label>
          <input class="input" type="date" id="search-date" name="date" [(ngModel)]="filters.date" />
        </div>
        <div class="field">
          <label for="search-location">Location</label>
          <input class="input" type="text" id="search-location" name="location" maxlength="150"
                 [(ngModel)]="filters.location" placeholder="e.g. Harbour Street" />
        </div>
        <div class="field">
          <label for="search-category">Category</label>
          <select class="select" id="search-category" name="category" [(ngModel)]="filters.category">
            <option value="">All Categories</option>
            <option *ngFor="let category of categories" [value]="category.category_id">{{ category.category_name }}</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn" [disabled]="loading">Search</button>
          <button type="button" class="btn btn-outline" (click)="clear()">Clear</button>
        </div>
      </form>
      <p *ngIf="loading" class="loading" role="status">Searching events...</p>
      <div *ngIf="error" class="alert alert-error" role="alert">
        <p>{{ error }}</p><button class="btn" type="button" (click)="search()">Try Again</button>
      </div>
      <div *ngIf="searched && !loading && !error" aria-live="polite">
        <h3>{{ events.length }} {{ events.length === 1 ? 'event' : 'events' }} found</h3>
        <div class="events-grid">
          <app-event-card *ngFor="let event of events" [event]="event"></app-event-card>
        </div>
        <div *ngIf="events.length === 0" class="empty-state">
          <h3>No matching events</h3><p>Try another date, a shorter location, or all categories.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .search-container { padding: 20px 0; }
    .hero { margin-bottom: 28px; }
    .hero p { color: var(--muted); }
    .search-form { display: flex; flex-wrap: wrap; gap: 18px; align-items: flex-end;
      padding: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .field { flex: 1 1 180px; margin: 0; }
    .form-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr)); gap: 24px; }
  `]
})
export class Search implements OnInit, OnDestroy {
  categories: Category[] = [];
  events: Event[] = [];
  filters = { date: '', location: '', category: '' };
  loading = false;
  searched = false;
  error: string | null = null;
  categoryError: string | null = null;
  private routeSubscription?: Subscription;
  private searchSubscription?: Subscription;

  constructor(private destroyRef: DestroyRef, private apiService: ApiService, private cdr: ChangeDetectorRef,
              private route: ActivatedRoute, private router: Router) {}

  /**
   * Load categories and restore searches when browser history changes.
   * @returns void
   */
  ngOnInit(): void {
    this.loadCategories();
    this.routeSubscription = this.route.queryParamMap.subscribe(query => {
      this.filters = { date: query.get('date') || '', location: query.get('location') || '', category: query.get('category') || '' };
      if (query.keys.length) this.loadResults();
      else {
        this.searchSubscription?.unsubscribe();
        this.events = []; this.searched = false; this.loading = false; this.error = null;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cancel requests when leaving the search page.
   * @returns void
   */
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  /**
   * Load category options, keeping any error separate from search results.
   * @returns void
   */
  loadCategories(): void {
    this.categoryError = null;
    this.apiService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.categories = data; this.cdr.detectChanges(); },
      error: err => { this.categoryError = errorMessage(err, 'Unable to load categories.'); this.cdr.detectChanges(); }
    });
  }

  /**
   * Save filters to a shareable URL, then let the route subscription search.
   * @returns void
   */
  search(): void {
    const params = this.searchParams();
    const queryParams = Object.keys(params).length ? params : { all: '1' };
    const target = this.router.createUrlTree([], { relativeTo: this.route, queryParams }).toString();
    if (target === this.router.url) this.loadResults();
    else void this.router.navigateByUrl(target);
  }

  /**
   * Request matching events and discard an earlier unfinished search.
   * @returns void
   */
  private loadResults(): void {
    this.searchSubscription?.unsubscribe();
    this.loading = true; this.error = null;
    this.searchSubscription = this.apiService.searchEvents(this.searchParams()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.events = data; this.loading = false; this.searched = true; this.cdr.detectChanges(); },
      error: err => { this.error = errorMessage(err, 'Search failed. Please try again.'); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  /**
   * Omit empty filters from the API request.
   * @returns The date, location and category values currently in use.
   */
  private searchParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.filters.date) params['date'] = this.filters.date;
    if (this.filters.location.trim()) params['location'] = this.filters.location.trim();
    if (this.filters.category) params['category'] = this.filters.category;
    return params;
  }

  /**
   * Remove filters and results from the page and URL.
   * @returns void
   */
  clear(): void {
    this.searchSubscription?.unsubscribe();
    this.filters = { date: '', location: '', category: '' };
    this.events = []; this.searched = false; this.loading = false; this.error = null;
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
}
