import type { UserRole } from '../domain/user';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}
