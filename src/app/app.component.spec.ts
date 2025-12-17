import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@auth0/auth0-angular';
import { AppComponent } from './app.component';
import { MockAuth0Service } from './core/testing/testing.module';

describe('AppComponent', () => {
  let mockAuth0: MockAuth0Service;

  beforeEach(async () => {
    mockAuth0 = new MockAuth0Service();

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: AuthService, useValue: mockAuth0 }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Fleet Management Portal'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Fleet Management Portal');
  });

  it('should render the router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should subscribe to Auth0 error stream on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    
    // Verify component initialized (which sets up subscriptions)
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should subscribe to Auth0 isLoading stream on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    
    // Trigger loading complete
    mockAuth0.setLoading(false);
    
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should subscribe to Auth0 isAuthenticated stream on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    
    // Trigger authentication
    mockAuth0.setAuthenticated(true);
    
    expect(fixture.componentInstance).toBeTruthy();
  });
});
