'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OrganizationRole } from '@/types/team';
import styles from './InviteMemberModal.module.css';

interface InviteMemberModalProps {
  companyName: string;
  currentUserRole: OrganizationRole;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({
  companyName,
  currentUserRole,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/employer/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          message: message.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (selectedRole: 'ADMIN' | 'MEMBER') => {
    if (selectedRole === 'ADMIN') {
      return 'Admins can invite and remove team members, and manage all job postings.';
    }
    return 'Members can create and manage their own job postings and view candidates.';
  };

  // ADMIN can only invite MEMBER
  const canInviteAdmin = currentUserRole === 'OWNER';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Invite Team Member</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <p className={styles.intro}>
              Invite someone to join <strong>{companyName}</strong>&apos;s recruiting team.
            </p>

            {error && (
              <div className={styles.error}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
              >
                <option value="MEMBER">Member</option>
                {canInviteAdmin && <option value="ADMIN">Admin</option>}
              </select>
              <p className={styles.roleHint}>{getRoleDescription(role)}</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Personal Message (Optional)</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'd like to invite you to join our recruiting team..."
                rows={3}
                maxLength={500}
              />
              <span className={styles.charCount}>{message.length}/500</span>
            </div>

            <div className={styles.info}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>An invitation email will be sent. The invitation expires in 7 days.</span>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Sending...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
