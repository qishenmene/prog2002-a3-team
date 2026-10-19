import { Component, Input, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService, EventWeather } from '../../services/api.service';
import { errorMessage } from '../../shared/http-error';
import { formatDateShort } from '../../shared/format';

/** Shows the event-date forecast separately from the registration workflow. */
@Component({
  selector: 'app-weather-panel', standalone: true, imports: [CommonModule],
  template: `
    <section class="weather-panel" aria-label="Event weather" aria-live="polite">
      <h3>Weather on the Event Date</h3>
      <p *ngIf="loading" role="status">Loading forecast...</p>
      <div *ngIf="error">
        <p>{{ error }}</p><button type="button" class="btn btn-outline" (click)="loadWeather()">Retry Forecast</button>
      </div>
      <ng-container *ngIf="!loading && !error && weather">
        <ng-container *ngIf="weather.state === 'available'; else unavailable">
          <p class="forecast-condition">{{ weather.description }} · {{ weather.low }}–{{ weather.high }} °C</p>
          <p>{{ forecastDate() }} · Queensland local time</p>
          <p class="forecast-note">Forecasts can change. Check again before travelling.</p>
        </ng-container>
        <ng-template #unavailable><p>{{ weather.message }}</p></ng-template>
      </ng-container>
      <p class="forecast-source">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>.</p>
    </section>
  `,
  styles: [`
    .weather-panel { padding: 20px; border: 1px solid var(--border); border-left: 4px solid var(--brand); margin: 24px 0; border-radius: 6px; }
    h3 { margin-top: 0; }
    .forecast-condition { font-size: 1.15rem; font-weight: 600; }
    .forecast-note, .forecast-source { color: var(--muted); font-size: .9rem; }
  `]
})
export class WeatherPanel implements OnChanges, OnDestroy {
  @Input({ required: true }) eventId!: number;
  weather: EventWeather | null = null;
  loading = false;
  error: string | null = null;
  private request?: Subscription;
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  /**
   * Refresh the forecast when the event input changes.
   * @returns void
   */
  ngOnChanges(): void { this.loadWeather(); }

  /**
   * Cancel an unfinished request when leaving the page.
   * @returns void
   */
  ngOnDestroy(): void { this.request?.unsubscribe(); }

  /**
   * Load weather independently so a provider failure leaves the event usable.
   * @returns void
   */
  loadWeather(): void {
    this.request?.unsubscribe();
    this.loading = true; this.error = null; this.weather = null;
    this.request = this.api.getEventWeather(this.eventId).subscribe({
      next: weather => { this.weather = weather; this.loading = false; this.cdr.detectChanges(); },
      error: err => { this.error = errorMessage(err, 'Unable to load the forecast.'); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  /**
   * Format the date belonging to the returned forecast.
   * @returns The event date for display.
   */
  forecastDate(): string { return formatDateShort(this.weather?.date); }
}
