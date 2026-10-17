import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * A charity event returned by the API.
 * The extra fields (category_name, tickets_sold) are produced by the SQL joins
 * and sub-selects in api-controller.js.
 */
export interface Event {
  event_id: number;
  event_name: string;
  event_date: string;
  event_time: string;
  event_address: string;
  event_purpose: string;
  event_description: string;
  event_ticket_price: number;
  event_goal_amount: number;
  event_goal_raised_amount: number;
  event_availability: string;
  event_category_id: number;
  event_organisation_id: number;
  latitude?: number | null;
  longitude?: number | null;
  category_name?: string;
  organisation_name?: string;
  tickets_sold?: number;
  registration_count?: number;
  registrations?: Registration[];
}

/**
 * One ticket purchase for an event.
 */
export interface Registration {
  registration_id?: number;
  event_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string | null;
  num_tickets: number;
  registration_date?: string;
}

/**
 * One day of the Open-Meteo forecast.
 */
export interface WeatherDay {
  date: string;
  weather_code: number;
  description: string;
  icon: string;
  temperature_max: number;
  temperature_min: number;
}

/**
 * Normalised forecast returned by GET /api/events/:id/weather.
 */
export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string | null;
  location?: string;
  days: WeatherDay[];
  source: string;
  cached?: boolean;
}

/**
 * Search filters used by the search page. Every value is optional.
 */
export interface SearchFilters {
  date?: string;
  location?: string;
  category?: string;
}

/**
 * Handles every HTTP call the client website makes to the Express API.
 *
 * The base URL is relative ("/api") so the same build works locally through
 * the Angular dev-server proxy and on cPanel where the API is served from the
 * same host. See proxy.conf.json.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Upcoming, available events for the home page.
   */
  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`);
  }

  /**
   * A single event together with its full registration list.
   */
  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
  }

  /**
   * All event categories for the search filter.
   */
  getCategories(): Observable<{ category_id: number; category_name: string }[]> {
    return this.http.get<{ category_id: number; category_name: string }[]>(
      `${this.apiUrl}/categories`
    );
  }

  /**
   * Filtered event search.
   */
  searchEvents(filters: SearchFilters): Observable<Event[]> {
    let params = new HttpParams();

    if (filters.date) {
      params = params.set('date', filters.date);
    }
    if (filters.location) {
      params = params.set('location', filters.location);
    }
    if (filters.category) {
      params = params.set('category', filters.category);
    }

    return this.http.get<Event[]>(`${this.apiUrl}/events/search`, { params });
  }

  /**
   * Registrations of one event, newest first.
   */
  getEventRegistrations(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(
      `${this.apiUrl}/events/${eventId}/registrations`
    );
  }

  /**
   * Creates a registration.
   */
  submitRegistration(registration: Registration): Observable<{
    message: string;
    registration_id: number;
    tickets: number;
    revenue_added: number;
  }> {
    return this.http.post<{
      message: string;
      registration_id: number;
      tickets: number;
      revenue_added: number;
    }>(`${this.apiUrl}/registrations`, registration);
  }

  /**
   * Three day weather forecast for the event location.
   */
  getEventWeather(eventId: number): Observable<WeatherForecast> {
    return this.http.get<WeatherForecast>(
      `${this.apiUrl}/events/${eventId}/weather`
    );
  }
}
