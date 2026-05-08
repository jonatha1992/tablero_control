import type { UserRole } from '../domain/user';

export interface InviteMemberDTO {
  name: string;
  email: string;
  role: UserRole;
  locationId?: string;
}

export interface LocationAssignmentInput {
  locationId: string;
  role: UserRole;
  customRoleIds?: string[];
}

export interface UpdateMemberDTO {
  name?: string;
  role?: UserRole;
  locationId?: string;
  customRoleIds?: string[];
  locationAssignments?: LocationAssignmentInput[];
  isActive?: boolean;
}
