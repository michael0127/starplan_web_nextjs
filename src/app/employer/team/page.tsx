'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import TeamMemberList from '@/components/employer/team/TeamMemberList';
import PendingInvitationsList from '@/components/employer/team/PendingInvitationsList';
import ActivityLogList from '@/components/employer/team/ActivityLogList';
import InviteMemberModal from '@/components/employer/team/InviteMemberModal';
import { TeamListResponse, TeamInvitation, getPermissions } from '@/types/team';
import styles from './page.module.css';

type TabType = 'members' | 'invitations' | 'activity';

// Wrapper component to handle Suspense boundary for useSearchParams
export default function TeamManagementPage() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageTransition>
    }>
      <TeamManagementContent />
    </Suspense>
  );
}

function TeamManagementContent() {
  const mounted = usePageAnimation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [teamData, setTeamData] = useState<TeamListResponse | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    submessage?: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user, loading: authLoading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/',
  });

  // Check if user just joined
  useEffect(() => {
    if (searchParams.get('joined') === 'true') {
      // Show success message
      setError(null);
    }
  }, [searchParams]);

  // Fetch team data
  const fetchTeamData = useCallback(async (companyId?: string) => {
    if (!user || !isEmployer) return;

    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const url = companyId 
        ? `/api/employer/team?companyId=${companyId}`
        : '/api/employer/team';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setTeamData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [user, isEmployer]);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    if (!user || !isEmployer) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/employer/team-invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setInvitations(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  }, [user, isEmployer]);

  useEffect(() => {
    fetchTeamData(selectedCompanyId || undefined);
    fetchInvitations();
  }, [fetchTeamData, fetchInvitations, selectedCompanyId]);

  // Handle company switch
  const handleCompanySwitch = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setShowCompanySelector(false);
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${memberName || 'this member'} from the team?`,
      submessage: 'They will lose access to all company resources.',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(`/api/employer/team/${memberId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
          });

          const result = await response.json();

          if (result.success) {
            fetchTeamData();
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to remove member');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle role change
  const handleChangeRole = async (memberId: string, memberName: string, newRole: 'ADMIN' | 'MEMBER') => {
    setConfirmModal({
      isOpen: true,
      title: 'Change Member Role',
      message: `Change ${memberName || 'this member'}'s role to ${newRole}?`,
      submessage: newRole === 'ADMIN' 
        ? 'Admins can invite and remove members.' 
        : 'Members can only manage jobs and candidates.',
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(`/api/employer/team/${memberId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole }),
          });

          const result = await response.json();

          if (result.success) {
            fetchTeamData();
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to change role');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle leave team
  const handleLeaveTeam = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Leave Team',
      message: 'Are you sure you want to leave this team?',
      submessage: 'You will lose access to all company resources.',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch('/api/employer/team/leave', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ companyId: teamData?.company.id }),
          });

          const result = await response.json();

          if (result.success) {
            window.location.href = '/';
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to leave team');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle transfer ownership
  const handleTransferOwnership = async (memberId: string, memberName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Transfer Ownership',
      message: `Transfer ownership to ${memberName || 'this member'}?`,
      submessage: 'You will become an Admin and they will become the Owner. This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();

          // Find the user ID from member ID
          const member = teamData?.members.find(m => m.id === memberId);
          if (!member) {
            setError('Member not found');
            return;
          }

          const response = await fetch('/api/employer/team/transfer-ownership', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newOwnerId: member.userId }),
          });

          const result = await response.json();

          if (result.success) {
            fetchTeamData();
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to transfer ownership');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle revoke invitation
  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Invitation',
      message: `Revoke the invitation to ${email}?`,
      submessage: 'They will no longer be able to join the team with this link.',
      variant: 'warning',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(`/api/employer/team-invitations/${invitationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
          });

          const result = await response.json();

          if (result.success) {
            fetchInvitations();
            fetchTeamData();
          } else {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to revoke invitation');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Handle resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/employer/team-invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resend' }),
      });

      const result = await response.json();

      if (result.success) {
        fetchInvitations();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to resend invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle invite success
  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchInvitations();
    fetchTeamData();
  };

  const permissions = teamData ? getPermissions(teamData.currentUserRole) : null;

  if (authLoading || !isEmployer) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        <EmployerNavbar userEmail={user?.email} />

        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Team Management</h1>
              <p className={styles.subtitle}>
                Manage your company&apos;s team members and their roles
              </p>
              {/* Company Selector - show if user has multiple companies */}
              {teamData?.availableCompanies && teamData.availableCompanies.length > 1 && (
                <div className={styles.companySelector}>
                  <span className={styles.companySelectorLabel}>Current company:</span>
                  <div className={styles.companySelectorDropdown}>
                    <button 
                      className={styles.companySelectorButton}
                      onClick={() => setShowCompanySelector(!showCompanySelector)}
                    >
                      <span>{teamData.company.companyName}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {showCompanySelector && (
                      <>
                        <div className={styles.companySelectorOverlay} onClick={() => setShowCompanySelector(false)}></div>
                        <div className={styles.companySelectorMenu}>
                          {teamData.availableCompanies.map(company => (
                            <button
                              key={company.id}
                              className={`${styles.companySelectorItem} ${company.id === teamData.company.id ? styles.companySelectorItemActive : ''}`}
                              onClick={() => handleCompanySwitch(company.id)}
                            >
                              <span className={styles.companyName}>{company.companyName}</span>
                              <span className={styles.companyRole}>{company.role}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {permissions?.canInvite && (
              <button
                className={styles.inviteButton}
                onClick={() => setShowInviteModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Invite Member
              </button>
            )}
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
              <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
            </div>
          )}

          {/* Stats Cards */}
          {teamData && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{teamData.members.length}</span>
                  <span className={styles.statLabel}>Team Members</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{teamData.pendingInvitations}</span>
                  <span className={styles.statLabel}>Pending Invitations</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'members' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Team Members
            </button>
            {permissions?.canInvite && (
              <button
                className={`${styles.tab} ${activeTab === 'invitations' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('invitations')}
              >
                Pending Invitations
                {teamData && teamData.pendingInvitations > 0 && (
                  <span className={styles.badge}>{teamData.pendingInvitations}</span>
                )}
              </button>
            )}
            {permissions?.canViewActivityLog && (
              <button
                className={`${styles.tab} ${activeTab === 'activity' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity Log
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.loadingContent}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading team data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'members' && teamData && (
                  <TeamMemberList
                    members={teamData.members}
                    currentUserRole={teamData.currentUserRole}
                    onRemove={handleRemoveMember}
                    onChangeRole={handleChangeRole}
                    onLeave={handleLeaveTeam}
                    onTransferOwnership={handleTransferOwnership}
                  />
                )}
                {activeTab === 'invitations' && (
                  <PendingInvitationsList
                    invitations={invitations.filter(i => i.status === 'PENDING')}
                    currentUserRole={teamData?.currentUserRole || 'MEMBER'}
                    onRevoke={handleRevokeInvitation}
                    onResend={handleResendInvitation}
                  />
                )}
                {activeTab === 'activity' && (
                  <ActivityLogList />
                )}
              </>
            )}
          </div>
        </main>

        {/* Invite Modal */}
        {showInviteModal && teamData && (
          <InviteMemberModal
            companyName={teamData.company.companyName}
            currentUserRole={teamData.currentUserRole}
            onClose={() => setShowInviteModal(false)}
            onSuccess={handleInviteSuccess}
          />
        )}

        {/* Confirm Modal */}
        {confirmModal && (
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            submessage={confirmModal.submessage}
            variant={confirmModal.variant}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
            isLoading={actionLoading}
          />
        )}
      </div>
    </PageTransition>
  );
}
