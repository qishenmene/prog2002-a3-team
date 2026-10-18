import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Event interface representing a charity event
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
  category_name?: string;
  organisation_name?: string;
}

/**
 * Registration interface for event sign-ups
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
 * Complete response from the public single-event endpoint.
 * An event without registrations is returned with an empty array.
 */
export interface EventDetails extends Event {
  registrations: Registration[];
}

/**
 * API Service for communicating with the backend
 * Handles all HTTP requests to the charity events API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Relative path: proxied to http://localhost:8080 by the Angular dev server
  // (see proxy.conf.json), and served same-origin in production on cPanel.
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  /**
   * Get all upcoming and active events
   * @returns Observable of Event array
   */
  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`);
  }

  /**
   * Get an available event and its registrations in a single HTTP request.
   * @param id - The event ID to retrieve.
   * @returns An observable containing event details and registrations, newest first.
   */
  getEvent(id: number): Observable<EventDetails> {
    return this.http.get<EventDetails>(`${this.apiUrl}/events/${id}`);
  }

  /**
   * Get all event categories
   * @returns Observable of categories array
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Search events with filters
   * @param params Search parameters (date, location, category)
   * @returns Observable of Event array
   */
  searchEvents(params: any): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/search`, { params });
  }

  /**
   * Get registrations for a specific event
   * @param eventId The event ID
   * @returns Observable of Registration array
   */
  getEventRegistrations(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/events/${eventId}/registrations`);
  }

  /**
   * Submit a new registration
   * @param registration The registration data
   * @returns Observable of the created registration
   */
  submitRegistration(registration: Registration): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registrations`, registration);
  }
}
