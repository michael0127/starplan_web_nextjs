'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface InvitationData {
  company: {
    companyName: string;
    companyLogo: string | null;
  };
  invitedBy: {
    name: string | null;
  };
  email: string;
  role: string;
  message: string | null;
  expiresAt: string;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TeamInvitationPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setCurrentEmail(session?.user?.email || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setCurrentEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitation/${token}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error);
          setErrorStatus(result.data?.status || null);
        } else {
          setInvitation(result.data);
        }
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  // Update time remaining
  useEffect(() => {
    if (!invitation) return;

    const updateTimeRemaining = () => {
      const expires = new Date(invitation.expiresAt);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [invitation]);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/team-invitation/${token}`);
      router.push(`/login?returnUrl=${returnUrl}&invitationEmail=${encodeURIComponent(invitation?.email || '')}`);
      return;
    }

    // Check email match
    if (currentEmail?.toLowerCase() !== invitation?.email.toLowerCase()) {
      setError('EMAIL_MISMATCH');
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(result.data.redirectUrl || '/employer/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ action: 'decline' }),
      });

      const result = await response.json();

      if (result.success) {
        setError('DECLINED');
        setErrorStatus('DECLINED');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Admin';
      case 'MEMBER': return 'Member';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admins can manage team members, create and edit job postings, and view all candidates.';
      case 'MEMBER':
        return 'Members can create job postings, manage candidates, and collaborate with the team.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'EMAIL_MISMATCH') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <Link href="/">
              <img src="/img/logo.png" alt="StarPlan" />
            </Link>
          </div>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2>Email Mismatch</h2>
            <p>This invitation was sent to <strong>{invitation?.email}</strong>, but you are logged in as <strong>{currentEmail}</strong>.</p>
            <p className={styles.hint}>Please sign in with the correct email address to accept this invitation.</p>
            <div className={styles.actions}>
              <button 
                className={styles.secondaryButton}
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  setCurrentEmail(null);
                  setError(null);
                }}
              >
                Sign Out and Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const getErrorContent = () => {
      switch (errorStatus || error) {
        case 'EXPIRED':
          return {
            icon: '⏰',
            title: 'Invitation Expired',
            message: 'This invitation has expired. Please ask the team admin to send a new invitation.'
          };
        case 'ACCEPTED':
          return {
            icon: '✅',
            title: 'Already Accepted',
            message: 'This invitation has already been accepted.'
          };
        case 'DECLINED':
          return {
            icon: '❌',
            title: 'Invitation Declined',
            message: 'You have declined this invitation.'
          };
        case 'REVOKED':
          return {
            icon: '🚫',
            title: 'Invitation Revoked',
            message: 'This invitation has been revoked by the team admin.'
          };
        default:
          return {
            icon: '❓',
            title: 'Invitation Not Found',
            message: 'This invitation link is invalid or has expired.'
          };
      }
    };

    const errorContent = getErrorContent();

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <Link href="/">
              <img src="/img/logo.png" alt="StarPlan" />
            </Link>
          </div>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>{errorContent.icon}</div>
            <h2>{errorContent.title}</h2>
            <p>{errorContent.message}</p>
            <Link href="/" className={styles.homeLink}>
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Link href="/">
            <img src="/img/logo.png" alt="StarPlan" />
          </Link>
        </div>

        <div className={styles.companySection}>
          {invitation.company.companyLogo ? (
            <img 
              src={invitation.company.companyLogo} 
              alt={invitation.company.companyName}
              className={styles.companyLogo}
            />
          ) : (
            <div className={styles.companyLogoPlaceholder}>
              {invitation.company.companyName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className={styles.companyName}>{invitation.company.companyName}</h1>
        </div>

        <div className={styles.invitationContent}>
          <h2>You&apos;ve been invited to join the team!</h2>
          
          <div className={styles.roleInfo}>
            <span className={styles.roleLabel}>Role:</span>
            <span className={`${styles.roleBadge} ${styles[`role${invitation.role}`]}`}>
              {getRoleLabel(invitation.role)}
            </span>
          </div>

          <p className={styles.roleDescription}>{getRoleDescription(invitation.role)}</p>

          {invitation.invitedBy.name && (
            <p className={styles.invitedBy}>
              Invited by <strong>{invitation.invitedBy.name}</strong>
            </p>
          )}

          {invitation.message && (
            <div className={styles.messageBox}>
              <span className={styles.messageLabel}>Personal message:</span>
              <p className={styles.messageText}>&ldquo;{invitation.message}&rdquo;</p>
            </div>
          )}

          <div className={styles.expiryInfo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Expires in {timeRemaining}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAccept}
            disabled={processing}
          >
            {processing ? 'Processing...' : (isLoggedIn ? 'Accept Invitation' : 'Sign In to Accept')}
          </button>
          <button
            className={styles.declineButton}
            onClick={handleDecline}
            disabled={processing}
          >
            Decline
          </button>
        </div>

        {!isLoggedIn && (
          <p className={styles.authHint}>
            Don&apos;t have an account?{' '}
            <Link href={`/login?mode=signup&returnUrl=${encodeURIComponent(`/team-invitation/${token}`)}&invitationEmail=${encodeURIComponent(invitation.email)}`}>
              Sign up
            </Link>
          </p>
        )}

        {isLoggedIn && currentEmail && currentEmail.toLowerCase() === invitation.email.toLowerCase() && (
          <p className={styles.loggedInAs}>
            Logged in as <strong>{currentEmail}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
