import { useState } from 'react';
import styles from './AuthForm.module.css';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  errorId?: string;
}

export default function PasswordInput({ 
  id, 
  label, 
  placeholder = "Enter your password",
  required = false,
  errorId 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.formItem}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.passwordContainer}>
        <input
          type={showPassword ? 'text' : 'password'}
          className={styles.input}
          id={id}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {errorId && <div className={styles.errorMessage} id={errorId}></div>}
    </div>
  );
}






















































