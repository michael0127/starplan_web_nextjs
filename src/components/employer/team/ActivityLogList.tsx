'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamActivityLog, TeamActivityResponse } from '@/types/team';
import styles from './ActivityLogList.module.css';

export default function ActivityLogList() {
  const [logs, setLogs] = useState<TeamActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`/api/employer/team-activity?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        const data: TeamActivityResponse = result.data;
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'member_invited':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        );
      case 'member_removed':
      case 'member_left':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="18" y1="8" x2="23" y2="13"></line>
            <line x1="23" y1="8" x2="18" y2="13"></line>
          </svg>
        );
      case 'role_changed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'ownership_transferred':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        );
      case 'invitation_accepted':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'invitation_declined':
      case 'invitation_revoked':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  const getActionColorClass = (action: string) => {
    if (action.includes('removed') || action.includes('revoked') || action.includes('declined') || action.includes('left')) {
      return styles.actionDanger;
    }
    if (action.includes('invited') || action.includes('accepted')) {
      return styles.actionSuccess;
    }
    if (action.includes('changed') || action.includes('transferred')) {
      return styles.actionWarning;
    }
    return styles.actionDefault;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }

    // Default format
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActionDescription = (log: TeamActivityLog) => {
    const details = log.details as Record<string, unknown> | null;
    const email = details?.email as string | undefined;
    const role = details?.role as string | undefined;
    const oldRole = details?.oldRole as string | undefined;
    const newRole = details?.newRole as string | undefined;

    switch (log.action) {
      case 'member_invited':
        return `invited ${email || 'a user'}${role ? ` as ${role}` : ''}`;
      case 'member_removed':
        return `removed ${email || 'a member'} from the team`;
      case 'member_left':
        return 'left the team';
      case 'role_changed':
        return `changed ${email || 'a member'}'s role${oldRole && newRole ? ` from ${oldRole} to ${newRole}` : ''}`;
      case 'ownership_transferred':
        const newOwner = (details?.newOwner as Record<string, string>)?.email;
        return `transferred ownership to ${newOwner || 'another member'}`;
      case 'invitation_accepted':
        return `${email || 'Someone'} accepted the invitation`;
      case 'invitation_declined':
        return `${email || 'Someone'} declined the invitation`;
      case 'invitation_revoked':
        return `revoked the invitation to ${email || 'a user'}`;
      case 'invitation_resent':
        return `resent the invitation to ${email || 'a user'}`;
      default:
        return log.actionLabel;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading activity log...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3>No activity yet</h3>
        <p>Team activity will appear here.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.timeline}>
        {logs.map((log) => (
          <div key={log.id} className={styles.logItem}>
            <div className={`${styles.iconWrapper} ${getActionColorClass(log.action)}`}>
              {getActionIcon(log.action)}
            </div>
            <div className={styles.logContent}>
              <div className={styles.logText}>
                <span className={styles.userName}>{log.user.name || log.user.email}</span>
                {' '}
                <span className={styles.actionText}>{getActionDescription(log)}</span>
              </div>
              <span className={styles.timestamp}>{formatDate(log.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button
            className={styles.pageButton}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
