'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
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
  const router = useRouter();

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
            <h2 className={styles.sectionTitle}>Recent Users</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                    stats.recentUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.name || 'N/A'}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[user.userType.toLowerCase()]}`}>
                            {user.userType}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={styles.noData}>No users yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h2 className={styles.sectionTitle}>Recent Job Postings</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentJobs && stats.recentJobs.length > 0 ? (
                    stats.recentJobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.jobTitle}</td>
                        <td>{job.companyName}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[job.status.toLowerCase()]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={styles.noData}>No job postings yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </AdminPageContainer>
  );
}

