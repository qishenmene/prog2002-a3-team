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
 * Category interface for event categories.
 */
export interface Category {
  category_id: number;
  category_name: string;
}

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
  createEvent(payload: Partial<Event>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events`, payload);
  }

  /**
   * Update an existing event, including its availability status.
   * @param id The event ID
   * @param payload The updated event data
   * @returns Observable of the API response message
   */
  updateEvent(id: number, payload: Partial<Event>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/events/${id}`, payload);
  }

  /**
   * Delete an event. The backend rejects deletion (400) when the event
   * still has registrations.
   * @param id The event ID
   * @returns Observable of the API response message
   */
  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/events/${id}`);
  }
}
