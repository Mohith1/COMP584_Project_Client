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
    // Handle Auth0 callback errors
    this.auth0.error$.pipe(
      filter((err) => err !== null)
    ).subscribe((err) => {
      console.error('❌ Auth0 error:', err);
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
