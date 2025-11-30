export interface OwnerProfile {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  fleetCount?: number;
  oktaGroupId?: string;
}

