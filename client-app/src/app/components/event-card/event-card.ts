import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Event } from '../../services/api.service';
import {
  dayOfMonth,
  monthAbbr,
  formatTime,
  formatMoney,
  truncate
} from '../../shared/format';

/**
 * Reusable event card.
 *
 * The same card is used by the home page and by the search results, so the
 * markup and styling for an event only exist in one place. The parent passes
 * the event through the required `event` input.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css'
})
export class EventCard {
  /** The event to display. */
  readonly event = input.required<Event>();

  /**
   * Day number shown in the date badge.
   */
  getDay(): string {
    return dayOfMonth(this.event().event_date);
  }

  /**
   * Month abbreviation shown in the date badge.
   */
  getMonth(): string {
    return monthAbbr(this.event().event_date);
  }

  /**
   * Start time in 12 hour format.
   */
  getTime(): string {
    return formatTime(this.event().event_time);
  }

  /**
   * Short description for the card body.
   */
  getSummary(): string {
    return truncate(this.event().event_description, 100);
  }

  /**
   * Price label for the card footer.
   */
  getPrice(): string {
    return Number(this.event().event_ticket_price) === 0
      ? 'FREE'
      : formatMoney(this.event().event_ticket_price);
  }

  /**
   * True when the event is free, used for a different price colour.
   */
  isFree(): boolean {
    return Number(this.event().event_ticket_price) === 0;
  }
}
