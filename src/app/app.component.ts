import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'Fleet Management Portal';

  constructor(private readonly auth0: AuthService) {}

  ngOnInit(): void {
    // Handle Auth0 callback errors - clear cache and retry
    this.auth0.error$.pipe(
      filter((err) => err !== null)
    ).subscribe((err) => {
      console.error('❌ Auth0 error:', err);
      
      // If unauthorized error, clear the cache and allow fresh login
      if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
        console.log('🧹 Clearing stale Auth0 cache...');
        // Clear Auth0's cache from localStorage
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('@@auth0spajs@@')) {
            localStorage.removeItem(key);
          }
        });
      }
    });

    // Log when user is authenticated
    this.auth0.isAuthenticated$.pipe(
      filter((isAuth) => isAuth),
      take(1)
    ).subscribe(() => {
      console.log('✅ Auth0: User authenticated');
    });
  }
}
