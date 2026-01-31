'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { OrganizationRole, getPermissions, TeamPermissions } from '@/types/team';

interface UseTeamRoleResult {
  role: OrganizationRole | null;
  companyId: string | null;
  companyName: string | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  permissions: TeamPermissions | null;
  refresh: () => Promise<void>;
}

export function useTeamRole(): UseTeamRoleResult {
  const [role, setRole] = useState<OrganizationRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamRole = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setRole(null);
        setCompanyId(null);
        setCompanyName(null);
        return;
      }

      const response = await fetch('/api/employer/team', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRole(result.data.currentUserRole);
          setCompanyId(result.data.company.id);
          setCompanyName(result.data.company.companyName);
        }
      } else if (response.status === 404) {
        // No company, not an error
        setRole(null);
        setCompanyId(null);
        setCompanyName(null);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to fetch team role');
      }
    } catch (err) {
      setError('Failed to fetch team role');
      console.error('Error fetching team role:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchTeamRole();
    });

    return () => subscription.unsubscribe();
  }, [fetchTeamRole]);

  const permissions = role ? getPermissions(role) : null;

  return {
    role,
    companyId,
    companyName,
    loading,
    error,
    isOwner: role === 'OWNER',
    isAdmin: role === 'OWNER' || role === 'ADMIN',
    isMember: role !== null,
    permissions,
    refresh: fetchTeamRole,
  };
}
