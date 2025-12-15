/**
 * Lazy-loaded components for job posting form
 * These components are loaded on-demand to improve initial page load time
 * 
 * TODO: Create Step components (Step1Classify.tsx, Step2Write.tsx, etc.)
 * For now, these are commented out until the components are created.
 */

import dynamic from 'next/dynamic';

// Step components - TODO: Uncomment when components are created
// export const Step1Classify = dynamic(
//   () => import('./Step1Classify').then(mod => ({ default: mod.Step1Classify })),
//   {
//     loading: () => (
//       <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//         Loading classification form...
//       </div>
//     ),
//     ssr: true,
//   }
// );

// export const Step2Write = dynamic(
//   () => import('./Step2Write').then(mod => ({ default: mod.Step2Write })),
//   {
//     loading: () => <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading job details form...</div>,
//     ssr: true,
//   }
// );

// export const Step3Screening = dynamic(
//   () => import('./Step3Screening').then(mod => ({ default: mod.Step3Screening })),
//   {
//     loading: () => <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading screening form...</div>,
//     ssr: true,
//   }
// );

// export const Step4Payment = dynamic(
//   () => import('./Step4Payment').then(mod => ({ default: mod.Step4Payment })),
//   {
//     loading: () => <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading payment form...</div>,
//     ssr: true,
//   }
// );

// Heavy components - loaded only when needed
export const CustomQuestionBuilderLazy = dynamic(
  () => import('@/components/CustomQuestionBuilder').then(mod => ({ 
    default: mod.CustomQuestionBuilder 
  })),
  {
    loading: () => (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#666',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        Loading question builder...
      </div>
    ),
    ssr: false, // Not needed for SEO
  }
);

// Modal - only loaded when opened
export const ConfirmModalLazy = dynamic(
  () => import('@/components/common/ConfirmModal').then(mod => ({ 
    default: mod.ConfirmModal 
  })),
  {
    loading: () => null, // No loading state needed for modals
    ssr: false,
  }
);

