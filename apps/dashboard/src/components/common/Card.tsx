import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = 'p-4',
  headerBorder = true
}) => {
  return (
    <div
      className={`bg-card rounded-lg border border-border transition-colors ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            headerBorder ? 'border-b border-border' : ''
          }`}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-sm font-semibold text-textPrimary tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-textSecondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
