import { Routes } from '@angular/router';
import { EventList } from './pages/event-list/event-list';
import { EventForm } from './pages/event-form/event-form';

/**
 * Admin application routes:
 * ''        -> event list (dashboard)
 * 'create'  -> create event form
 * 'edit/:id'-> edit event form
 */
export const routes: Routes = [
  { path: '', component: EventList },
  { path: 'create', component: EventForm },
  { path: 'edit/:id', component: EventForm },
  { path: '**', redirectTo: '' }
];
