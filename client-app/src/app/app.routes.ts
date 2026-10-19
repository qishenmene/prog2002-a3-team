import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Search } from './pages/search/search';
import { EventDetail } from './pages/event-detail/event-detail';
import { Register } from './pages/register/register';

/**
 * Application routes configuration
 * Defines all page routes for the client application
 */
export const routes: Routes = [
  { path: '', component: Home, title: 'Home | Students Helper' },
  { path: 'search', component: Search, title: 'Search Events | Students Helper' },
  { path: 'event/:id', component: EventDetail, title: 'Event Details | Students Helper' },
  { path: 'register/:id', component: Register, title: 'Register | Students Helper' },
  { path: '**', redirectTo: '' }
];
