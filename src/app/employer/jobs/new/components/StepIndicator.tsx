import { memo } from 'react';
import styles from './StepIndicator.module.css';

interface Step {
  id: number;
  name: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = memo(function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className={styles.progressSteps}>
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className={`${styles.stepItem} ${
            currentStep === step.id ? styles.stepActive : ''
          } ${currentStep > step.id ? styles.stepCompleted : ''}`}
        >
          <div className={styles.stepCircle}>
            {currentStep > step.id ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <span>{step.id}</span>
            )}
          </div>
          <div className={styles.stepLabel}>
            <div className={styles.stepName}>{step.name}</div>
            <div className={styles.stepDescription}>{step.label}</div>
          </div>
          {index < steps.length - 1 && (
            <div className={styles.stepConnector}></div>
          )}
        </div>
      ))}
    </div>
  );
});



