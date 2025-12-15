'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';

// 导入主页面组件（我们将复用 new page 的逻辑）
// 这里我们需要创建一个共享的表单组件

export default function EditJobPosting({ params }: { params: Promise<{ id: string }> }) {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);
  
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  useEffect(() => {
    const loadJobData = async () => {
      const { id } = await params;
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No session found');
          router.push('/employer/jobs');
          return;
        }
        
        const response = await fetch(`/api/job-postings/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setJobData(data.data);
        } else {
          router.push('/employer/jobs');
        }
      } catch (error) {
        console.error('Error loading job data:', error);
        router.push('/employer/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isEmployer) {
      loadJobData();
    }
  }, [user, isEmployer, params, router]);

  // Redirect to new page with edit parameter when data is loaded
  useEffect(() => {
    if (jobData && !loading && !isLoading) {
      router.push(`/employer/jobs/new?edit=${jobData.id}`);
    }
  }, [jobData, loading, isLoading, router]);

  if (loading || isLoading || !jobData) {
    return (
      <PageTransition>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}>
          <div>Loading job data...</div>
        </div>
      </PageTransition>
    );
  }

  return null;
}

