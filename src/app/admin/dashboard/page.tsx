'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import { Toast, useToast } from '@/components/admin/Toast';
import styles from './page.module.css';
import { 
  UsersIcon, 
  CandidateIcon, 
  BuildingIcon, 
  BriefcaseIcon, 
  CheckCircleIcon, 
  FileTextIcon, 
  HandshakeIcon, 
  ActivityIcon 
} from '@/components/admin/AdminIcons';

interface DashboardStats {
  totalUsers: number;
  totalCandidates: number;
  totalEmployers: number;
  totalJobPostings: number;
  publishedJobs: number;
  draftJobs: number;
  totalMatches: number;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    userType: string;
    createdAt: string;
  }>;
  recentJobs: Array<{
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Copy ID to clipboard
  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Navigate to matching with preselected candidate
  const handleUserClick = (user: DashboardStats['recentUsers'][0]) => {
    if (user.userType === 'CANDIDATE') {
      sessionStorage.setItem('preselectedCandidate', JSON.stringify({
        ...user,
        id: user.id,
        label: `${user.name || 'No Name'} (${user.email})`,
      }));
      router.push('/admin/matching');
    }
  };

  // Navigate to matching with preselected job
  const handleJobClick = (job: DashboardStats['recentJobs'][0]) => {
    sessionStorage.setItem('preselectedJob', JSON.stringify({
      ...job,
      id: job.id,
      label: `${job.jobTitle} @ ${job.companyName} (${job.status})`,
    }));
    router.push('/admin/matching');
  };

  // Quick match job to all candidates (using Celery async task)
  const matchJobToAll = async (job: DashboardStats['recentJobs'][0], e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/matching/job-to-all-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: job.id,
          skip_hard_gate: false,
        }),
      });

      const data = await response.json();

      addToast({
        type: 'success',
        title: `Matching task submitted for "${job.jobTitle}"`,
        message: `Task ID: ${data.task_id}. The job will be matched against all candidates in the background.`,
      });
    } catch (err) {
      console.error('Background matching error:', err);
      addToast({
        type: 'error',
        title: 'Failed to submit matching task',
        message: 'Please try again later.',
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <>
    <Toast toasts={toasts} onDismiss={dismissToast} />
    <AdminPageContainer
      title="Dashboard"
      description="Overview of your StarPlan admin metrics and recent activity"
    >
      <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <UsersIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Total Users</h3>
              <p className={styles.statNumber}>{stats?.totalUsers || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <CandidateIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Candidates</h3>
              <p className={styles.statNumber}>{stats?.totalCandidates || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <BuildingIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Employers</h3>
              <p className={styles.statNumber}>{stats?.totalEmployers || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <BriefcaseIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Job Postings</h3>
              <p className={styles.statNumber}>{stats?.totalJobPostings || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <CheckCircleIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Published Jobs</h3>
              <p className={styles.statNumber}>{stats?.publishedJobs || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <FileTextIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Draft Jobs</h3>
              <p className={styles.statNumber}>{stats?.draftJobs || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <HandshakeIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>Total Matches</h3>
              <p className={styles.statNumber}>{stats?.totalMatches || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <ActivityIcon className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3>System Status</h3>
              <p className={styles.statNumber}>Operational</p>
            </div>
          </div>
        </div>

        <div className={styles.tablesGrid}>
          <div className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Users</h2>
              <button 
                className={styles.viewAllBtn}
                onClick={() => router.push('/admin/users')}
              >
                View All →
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                    stats.recentUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`${styles.clickableRow} ${user.userType === 'CANDIDATE' ? styles.candidateRow : ''}`}
                        onClick={() => handleUserClick(user)}
                      >
                        <td>{user.email}</td>
                        <td>{user.name || 'N/A'}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[user.userType.toLowerCase()]}`}>
                            {user.userType}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => copyId(user.id, e)}
                            title="Copy ID"
                          >
                            {copiedId === user.id ? '✓' : '📋'}
                          </button>
                          {user.userType === 'CANDIDATE' && (
                            <button
                              className={`${styles.actionBtn} ${styles.matchBtn}`}
                              onClick={(e) => { e.stopPropagation(); handleUserClick(user); }}
                              title="Go to Matching"
                            >
                              →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.noData}>No users yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Job Postings</h2>
              <button 
                className={styles.viewAllBtn}
                onClick={() => router.push('/admin/jobs')}
              >
                View All →
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentJobs && stats.recentJobs.length > 0 ? (
                    stats.recentJobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className={styles.clickableRow}
                        onClick={() => handleJobClick(job)}
                      >
                        <td className={styles.jobTitleCell}>{job.jobTitle}</td>
                        <td>{job.companyName}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[job.status.toLowerCase()]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                        <td className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => copyId(job.id, e)}
                            title="Copy ID"
                          >
                            {copiedId === job.id ? '✓' : '📋'}
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.matchBtn}`}
                            onClick={(e) => { e.stopPropagation(); handleJobClick(job); }}
                            title="Go to Matching"
                          >
                            →
                          </button>
                          {job.status === 'PUBLISHED' && (
                            <button
                              className={`${styles.actionBtn} ${styles.matchAllBtn}`}
                              onClick={(e) => matchJobToAll(job, e)}
                              title="Match All Candidates"
                            >
                              ⚡
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.noData}>No job postings yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </AdminPageContainer>
    </>
  );
}
