export type Role = 'ADMIN' | 'DONOR' | 'RECEIVER' | 'HOSPITAL';

export interface User {
  id: number;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  name: string;
  phone: string;
  donor?: any;
  receiver?: any;
  hospital?: any;
  admin?: any;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
