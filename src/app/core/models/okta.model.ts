export interface OktaProfile {
  sub: string;
  name?: string;
  email?: string;
  locale?: string;
  ownerId?: string;
  roles?: string[];
  [key: string]: unknown;
}















