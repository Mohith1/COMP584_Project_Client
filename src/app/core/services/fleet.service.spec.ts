import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FleetService } from './fleet.service';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerStateService } from '../state/owner-state.service';
import { PersonaService } from './persona.service';
import { environment } from '../../../environments/environment';

describe('FleetService', () => {
  let service: FleetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FleetService, OwnerAuthService, OwnerStateService, PersonaService]
    });
    service = TestBed.inject(FleetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests paginated fleets', () => {
    service
      .getFleets('owner-1', { page: 1, size: 5 })
      .subscribe((response) => {
        expect(response.data.length).toBe(1);
      });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/owners/owner-1/fleets?page=1&size=5`
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          id: 'fleet-1',
          name: 'Metro Delivery',
          vehicleCount: 3,
          status: 'Active'
        }
      ],
      total: 1,
      page: 1,
      size: 5
    });
  });
});











