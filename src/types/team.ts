/**
 * Team Management Types
 */

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: OrganizationRole;
  joinedAt: string | null;
  isCurrentUser: boolean;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  status: TeamInvitationStatus;
  message: string | null;
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

export interface TeamCompany {
  id: string;
  companyName: string;
  companyLogo: string | null;
}

export interface TeamListResponse {
  company: TeamCompany;
  members: TeamMember[];
  currentUserRole: OrganizationRole;
  pendingInvitations: number;
}

export interface InviteMemberRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER';
  message?: string;
}

export interface UpdateMemberRoleRequest {
  role: 'ADMIN' | 'MEMBER';
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
}

export interface TeamActivityLog {
  id: string;
  action: string;
  actionLabel: string;
  user: {
    id: string | null;
    name: string | null;
    email: string;
  };
  target: {
    type: string;
    id: string;
    name?: string;
    email?: string;
  };
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface TeamActivityResponse {
  logs: TeamActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Permission helper type
export interface TeamPermissions {
  canInvite: boolean;
  canRemoveMembers: boolean;
  canRemoveAdmins: boolean;
  canChangeRoles: boolean;
  canTransferOwnership: boolean;
  canRevokeInvitations: boolean;
  canViewActivityLog: boolean;
}

export function getPermissions(role: OrganizationRole): TeamPermissions {
  switch (role) {
    case 'OWNER':
      return {
        canInvite: true,
        canRemoveMembers: true,
        canRemoveAdmins: true,
        canChangeRoles: true,
        canTransferOwnership: true,
        canRevokeInvitations: true,
        canViewActivityLog: true,
      };
    case 'ADMIN':
      return {
        canInvite: true,
        canRemoveMembers: true,
        canRemoveAdmins: false,
        canChangeRoles: false,
        canTransferOwnership: false,
        canRevokeInvitations: true, // Only own invitations
        canViewActivityLog: true,
      };
    case 'MEMBER':
    default:
      return {
        canInvite: false,
        canRemoveMembers: false,
        canRemoveAdmins: false,
        canChangeRoles: false,
        canTransferOwnership: false,
        canRevokeInvitations: false,
        canViewActivityLog: false,
      };
  }
}
