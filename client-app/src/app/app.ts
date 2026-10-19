import { Component, ViewChild, ElementRef } from '@angular/core';
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
    <a class="skip-link" href="#main-content" (click)="focusContent($event)">Skip to content</a>
    <app-header></app-header>
    <app-nav></app-nav>
    <main #mainContent id="main-content" class="main-content" tabindex="-1">
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
  @ViewChild('mainContent') mainContent?: ElementRef<HTMLElement>;

  /**
   * Move keyboard focus to the page content without changing the route.
   * @param event - The skip link click.
   * @returns void
   */
  focusContent(event: globalThis.Event): void {
    event.preventDefault();
    this.mainContent?.nativeElement.focus();
  }
}
