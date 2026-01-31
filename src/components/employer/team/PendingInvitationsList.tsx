'use client';

import { TeamInvitation, OrganizationRole } from '@/types/team';
import styles from './PendingInvitationsList.module.css';

interface PendingInvitationsListProps {
  invitations: TeamInvitation[];
  currentUserRole: OrganizationRole;
  onRevoke: (invitationId: string, email: string) => void;
  onResend: (invitationId: string) => void;
}

export default function PendingInvitationsList({
  invitations,
  currentUserRole,
  onRevoke,
  onResend,
}: PendingInvitationsListProps) {
  const getRoleBadgeClass = (role: OrganizationRole) => {
    switch (role) {
      case 'ADMIN':
        return styles.roleAdmin;
      default:
        return styles.roleMember;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  // User can revoke if they are OWNER, or ADMIN who sent the invitation
  const canRevoke = (invitation: TeamInvitation) => {
    if (currentUserRole === 'OWNER') return true;
    // For ADMIN, we'd need to check if they sent it, but we don't have current user ID here
    // For simplicity, we'll allow ADMINs to revoke any pending invitation they can see
    if (currentUserRole === 'ADMIN') return true;
    return false;
  };

  if (invitations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <h3>No pending invitations</h3>
        <p>All sent invitations have been accepted or expired.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {invitations.map((invitation) => (
          <div key={invitation.id} className={styles.invitationCard}>
            <div className={styles.invitationMain}>
              <div className={styles.invitationInfo}>
                <div className={styles.emailRow}>
                  <span className={styles.email}>{invitation.email}</span>
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass(invitation.role)}`}>
                    {invitation.role}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.invitedBy}>
                    Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.date}>{formatDate(invitation.createdAt)}</span>
                </div>
              </div>
              <div className={styles.expiryInfo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{getTimeRemaining(invitation.expiresAt)}</span>
              </div>
            </div>
            {invitation.message && (
              <div className={styles.messagePreview}>
                <span className={styles.messageLabel}>Message:</span> {invitation.message}
              </div>
            )}
            <div className={styles.actions}>
              <button
                className={styles.resendButton}
                onClick={() => onResend(invitation.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Resend
              </button>
              {canRevoke(invitation) && (
                <button
                  className={styles.revokeButton}
                  onClick={() => onRevoke(invitation.id, invitation.email)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
