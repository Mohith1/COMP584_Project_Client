import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerStateService } from '../state/owner-state.service';
import { PersonaService } from './persona.service';
import { environment } from '../../../environments/environment';

describe('OwnerAuthService', () => {
  let service: OwnerAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OwnerAuthService, OwnerStateService, PersonaService]
    });
    service = TestBed.inject(OwnerAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('logs in owner via API', () => {
    const mockResponse = {
      accessToken: 'abc',
      refreshToken: 'xyz',
      expiresIn: 3600,
      owner: {
        id: 'owner-1',
        firstName: 'Alex',
        lastName: 'Fleet',
        email: 'alex@example.com',
        companyName: 'Fleet Co'
      }
    };

    service
      .login({ email: 'alex@example.com', password: 'Secret123!' })
      .subscribe((owner) => {
        expect(owner.id).toEqual('owner-1');
      });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/auth/login`
    );
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});

