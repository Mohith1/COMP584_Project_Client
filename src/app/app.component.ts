import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private readonly auth0: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Handle Auth0 callback errors - clear cache and allow fresh login
    this.auth0.error$.pipe(
      filter((err) => err !== null)
    ).subscribe((err) => {
      console.error('❌ Auth0 error:', err);
      
      // If unauthorized error, clear the cache
      if (err?.message?.includes('Unauthorized') || err?.message?.includes('401') || 
          err?.message?.includes('invalid_grant')) {
        console.log('🧹 Clearing stale Auth0 cache...');
        this.clearAuth0Cache();
        
        // Clear the URL parameters to prevent re-processing
        this.clearCallbackParams();
      }
    });

    // When Auth0 finishes loading, clean up the URL
    this.auth0.isLoading$.pipe(
      filter((loading) => !loading),
      take(1)
    ).subscribe(() => {
      // If we have callback params, clean them up
      if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
        console.log('🧹 Cleaning up callback URL...');
        this.clearCallbackParams();
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

  private clearAuth0Cache(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('@@auth0spajs@@') || key.startsWith('a0.spajs')) {
        localStorage.removeItem(key);
      }
    });
  }

  private clearCallbackParams(): void {
    // Remove code, state, error params from URL without triggering navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    
    // Replace URL without triggering navigation
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
}
