import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Event interface representing a charity event.
 * Field names match the backend database columns exactly.
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
  registration_count?: number;
}

/**
 * A stored event registration returned by the API.
 * Dates are ISO strings; phone numbers are optional in the database.
 */
export interface Registration {
  registration_id: number;
  event_id: number;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  num_tickets: number;
  registration_date: string;
}

/**
 * Category interface for event categories.
 */
export interface Category {
  category_id: number;
  category_name: string;
}

/** Result of an event create, update or delete request. */
export interface EventResponse { message: string; event_id?: number; }

/**
 * API Service for the admin application.
 * Handles all HTTP requests to the charity events admin API endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Relative path: proxied to http://localhost:8080 by the Angular dev server
  // (see proxy.conf.json).
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  /**
   * Get every event regardless of date or availability (admin listing),
   * including category name and registration count.
   * @returns Observable of Event array ordered by date descending
   */
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/all`);
  }

  /**
   * Get an event for editing, regardless of its date or availability.
   * @param id - The event ID to load into the admin form.
   * @returns An observable containing the event details.
   */
  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/admin/events/${id}`);
  }

  /**
   * Get the registrations for an event, ordered newest first by the API.
   * @param eventId - The event whose registrations should be retrieved.
   * @returns An observable containing the event's stored registrations.
   */
  getEventRegistrations(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/events/${eventId}/registrations`);
  }

  /**
   * Get all event categories for the category dropdown.
   * @returns Observable of Category array
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Create a new event. The backend defaults availability to 'Available'.
   * @param payload The event data to create
   * @returns Observable of the API response (message + new event_id)
   */
  createEvent(payload: Partial<Event>): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/events`, payload);
  }

  /**
   * Update an existing event, including its availability status.
   * @param id The event ID
   * @param payload The updated event data
   * @returns Observable of the API response message
   */
  updateEvent(id: number, payload: Partial<Event>): Observable<EventResponse> {
    return this.http.put<EventResponse>(`${this.apiUrl}/events/${id}`, payload);
  }

  /**
   * Delete an event. The backend rejects deletion (400) when the event
   * still has registrations.
   * @param id The event ID
   * @returns Observable of the API response message
   */
  deleteEvent(id: number): Observable<EventResponse> {
    return this.http.delete<EventResponse>(`${this.apiUrl}/events/${id}`);
  }
}
