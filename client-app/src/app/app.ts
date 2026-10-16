import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Nav } from './components/nav/nav';
import { Footer } from './components/footer/footer';

/**
 * Root component of the application
 * Contains the main layout with header, navigation, content area, and footer
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Nav, Footer],
  template: `
    <app-header></app-header>
    <app-nav></app-nav>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 200px);
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class App {
  title = 'Charity Events Client';
}
