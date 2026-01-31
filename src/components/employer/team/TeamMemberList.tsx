'use client';

import { useState } from 'react';
import { TeamMember, OrganizationRole, getPermissions } from '@/types/team';
import styles from './TeamMemberList.module.css';

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserRole: OrganizationRole;
  onRemove: (memberId: string, memberName: string) => void;
  onChangeRole: (memberId: string, memberName: string, newRole: 'ADMIN' | 'MEMBER') => void;
  onLeave: () => void;
  onTransferOwnership: (memberId: string, memberName: string) => void;
}

export default function TeamMemberList({
  members,
  currentUserRole,
  onRemove,
  onChangeRole,
  onLeave,
  onTransferOwnership,
}: TeamMemberListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const permissions = getPermissions(currentUserRole);

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'OWNER':
        return '👑';
      case 'ADMIN':
        return '🛡️';
      default:
        return null;
    }
  };

  const getRoleBadgeClass = (role: OrganizationRole) => {
    switch (role) {
      case 'OWNER':
        return styles.roleOwner;
      case 'ADMIN':
        return styles.roleAdmin;
      default:
        return styles.roleMember;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canManageMember = (member: TeamMember) => {
    if (member.isCurrentUser) return false;
    if (member.role === 'OWNER') return false;
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN' && member.role === 'MEMBER') return true;
    return false;
  };

  const toggleMenu = (memberId: string) => {
    setOpenMenuId(openMenuId === memberId ? null : memberId);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  if (members.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3>No team members yet</h3>
        <p>Invite team members to collaborate on recruiting.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className={member.isCurrentUser ? styles.currentUser : ''}>
              <td>
                <div className={styles.memberInfo}>
                  {member.avatarUrl ? (
                    <img 
                      src={member.avatarUrl} 
                      alt={member.name || member.email}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.memberDetails}>
                    <span className={styles.memberName}>
                      {member.name || 'No name'}
                      {member.isCurrentUser && <span className={styles.youBadge}>(You)</span>}
                    </span>
                    <span className={styles.memberEmail}>{member.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(member.role)}`}>
                  {getRoleIcon(member.role)} {member.role}
                </span>
              </td>
              <td>
                <span className={styles.joinedDate}>{formatDate(member.joinedAt)}</span>
              </td>
              <td>
                <div className={styles.actions}>
                  {member.isCurrentUser && member.role !== 'OWNER' && (
                    <button
                      className={styles.leaveButton}
                      onClick={onLeave}
                    >
                      Leave
                    </button>
                  )}
                  {canManageMember(member) && (
                    <div className={styles.menuContainer}>
                      <button
                        className={styles.menuButton}
                        onClick={() => toggleMenu(member.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="12" cy="5" r="1"></circle>
                          <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                      </button>
                      {openMenuId === member.id && (
                        <>
                          <div className={styles.menuOverlay} onClick={closeMenu}></div>
                          <div className={styles.menu}>
                            {permissions.canChangeRoles && (
                              <>
                                {member.role === 'MEMBER' && (
                                  <button
                                    className={styles.menuItem}
                                    onClick={() => {
                                      closeMenu();
                                      onChangeRole(member.id, member.name || member.email, 'ADMIN');
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                    Promote to Admin
                                  </button>
                                )}
                                {member.role === 'ADMIN' && (
                                  <button
                                    className={styles.menuItem}
                                    onClick={() => {
                                      closeMenu();
                                      onChangeRole(member.id, member.name || member.email, 'MEMBER');
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                      <circle cx="8.5" cy="7" r="4"></circle>
                                    </svg>
                                    Change to Member
                                  </button>
                                )}
                              </>
                            )}
                            {permissions.canTransferOwnership && member.role !== 'OWNER' && (
                              <button
                                className={`${styles.menuItem} ${styles.menuItemWarning}`}
                                onClick={() => {
                                  closeMenu();
                                  onTransferOwnership(member.id, member.name || member.email);
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <polyline points="9 21 3 21 3 15"></polyline>
                                  <line x1="21" y1="3" x2="14" y2="10"></line>
                                  <line x1="3" y1="21" x2="10" y2="14"></line>
                                </svg>
                                Transfer Ownership
                              </button>
                            )}
                            <div className={styles.menuDivider}></div>
                            <button
                              className={`${styles.menuItem} ${styles.menuItemDanger}`}
                              onClick={() => {
                                closeMenu();
                                onRemove(member.id, member.name || member.email);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="18" y1="8" x2="23" y2="13"></line>
                                <line x1="23" y1="8" x2="18" y2="13"></line>
                              </svg>
                              Remove from Team
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
