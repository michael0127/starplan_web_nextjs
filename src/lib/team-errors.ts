/**
 * Team Management Error Messages
 * Centralized error messages for team/organization management
 */

export const TEAM_ERRORS = {
  // Member errors
  ALREADY_MEMBER: 'This user is already a member of the team',
  MEMBER_NOT_FOUND: 'Member not found',
  CANNOT_REMOVE_OWNER: 'The owner cannot be removed from the team',
  CANNOT_REMOVE_SELF: 'You cannot remove yourself. Use the leave option instead.',
  OWNER_CANNOT_LEAVE: 'The owner cannot leave. Please transfer ownership first.',
  CANNOT_CHANGE_OWNER_ROLE: 'Cannot change the role of the owner',
  CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',
  ADMIN_CANNOT_REMOVE_ADMIN: 'Admins cannot remove other admins',
  
  // Invitation errors
  INVITATION_PENDING: 'An invitation is already pending for this email',
  INVITATION_NOT_FOUND: 'Invitation not found',
  INVITATION_EXPIRED: 'This invitation has expired',
  INVITATION_ALREADY_RESPONDED: 'This invitation has already been responded to',
  ROLE_UPGRADE_DENIED: 'You cannot invite someone with a higher role than yourself',
  CANNOT_INVITE_OWNER: 'Cannot invite someone as owner. Use transfer ownership instead.',
  
  // Permission errors
  INSUFFICIENT_PERMISSION: 'You do not have permission to perform this action',
  ONLY_OWNER_CAN_CHANGE_ROLES: 'Only the owner can change member roles',
  ONLY_OWNER_CAN_TRANSFER: 'Only the current owner can transfer ownership',
  ONLY_ADMIN_CAN_INVITE: 'Only owners and admins can invite members',
  ONLY_ADMIN_CAN_REVOKE: 'Only owners and admins can revoke invitations',
  
  // Company errors
  NO_COMPANY: 'You must have a company to manage a team',
  NOT_A_MEMBER: 'You are not a member of this team',
  
  // Transfer errors
  TARGET_NOT_MEMBER: 'Target user is not a member of this company',
  
  // General errors
  UNAUTHORIZED: 'Unauthorized',
  INVALID_REQUEST: 'Invalid request',
  INTERNAL_ERROR: 'An internal error occurred',
} as const;

export type TeamErrorKey = keyof typeof TEAM_ERRORS;
