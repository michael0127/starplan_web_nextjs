import styles from './AdminPageContainer.module.css';

interface AdminPageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AdminPageContainer({
  title,
  description,
  children,
  actions,
}: AdminPageContainerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{title}</h1>
            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </div>
          {actions && (
            <div className={styles.actions}>
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}

