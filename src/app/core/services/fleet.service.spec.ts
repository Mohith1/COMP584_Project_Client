import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FleetService } from './fleet.service';
import { OwnerAuthService } from './owner-auth.service';
import { MockDataService } from './mock-data.service';
import { provideMockAuth0, mockFleetSummary } from '../testing/testing.module';
import { environment } from '../../../environments/environment';
import { FleetSummary } from '../models/fleet.model';

describe('FleetService', () => {
  let service: FleetService;
  let httpMock: HttpTestingController;
  let ownerAuthSpy: jasmine.SpyObj<OwnerAuthService>;

  beforeEach(() => {
    ownerAuthSpy = jasmine.createSpyObj('OwnerAuthService', ['ownerId']);
    ownerAuthSpy.ownerId.and.returnValue('owner-1');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FleetService,
        MockDataService,
        provideMockAuth0(),
        { provide: OwnerAuthService, useValue: ownerAuthSpy }
      ]
    });

    service = TestBed.inject(FleetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFleets', () => {
    it('should request paginated fleets from API', () => {
      const mockResponse = {
        items: [mockFleetSummary],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1
      };

      service.getFleets('owner-1', { page: 1, size: 5 }).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].name).toBe('Metro Delivery Fleet');
        expect(response.total).toBe(1);
        expect(response.page).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-1/fleets?page=1&size=5`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use mock data when ownerId is null', () => {
      service.getFleets(null, { page: 1, size: 5 }).subscribe((response) => {
        expect(response.data).toBeDefined();
        expect(response.page).toBe(1);
      });

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/api/owners/null/fleets`);
    });

    it('should fallback to mock data on API error', () => {
      service.getFleets('owner-1', { page: 1, size: 5 }).subscribe((response) => {
        expect(response.data).toBeDefined();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-1/fleets?page=1&size=5`
      );
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('getFleetDetail', () => {
    it('should request fleet detail from API', () => {
      const mockFleetDetail = {
        ...mockFleetSummary,
        location: 'Downtown',
        vehicles: []
      };

      service.getFleetDetail('fleet-123').subscribe((fleet) => {
        expect(fleet.id).toBe('fleet-123');
        expect(fleet.name).toBe('Metro Delivery Fleet');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFleetDetail);
    });
  });

  describe('createFleet', () => {
    it('should POST new fleet to API', () => {
      const newFleet = { name: 'New Fleet', description: 'Test description' };

      service.createFleet('owner-1', newFleet).subscribe((fleet) => {
        expect(fleet.name).toBe('New Fleet');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/owners/owner-1/fleets`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newFleet);
      req.flush({ ...mockFleetSummary, name: 'New Fleet' });
    });

    it('should use mock data when ownerId is null', () => {
      const newFleet = { name: 'New Fleet' };

      service.createFleet(null, newFleet).subscribe((fleet) => {
        expect(fleet.name).toBe('New Fleet');
      });

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/api/owners/null/fleets`);
    });
  });

  describe('updateFleet', () => {
    it('should PUT updated fleet to API', () => {
      const updateData = { name: 'Updated Fleet', description: 'Updated' };

      service.updateFleet('fleet-123', updateData).subscribe((fleet) => {
        expect(fleet.name).toBe('Updated Fleet');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123`
      );
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockFleetSummary, name: 'Updated Fleet' });
    });
  });

  describe('deleteFleet', () => {
    it('should DELETE fleet via API', () => {
      service.deleteFleet('fleet-123').subscribe((id) => {
        expect(id).toBe('fleet-123');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/Fleets/fleet-123`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
