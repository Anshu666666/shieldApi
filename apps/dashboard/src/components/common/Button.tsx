import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  isLoading,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-shieldCyan disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-xs px-3.5 py-2',
    lg: 'text-sm px-4 py-2.5'
  };

  const variantStyles = {
    primary: 'bg-shieldCyan text-background hover:bg-cyan-400 font-semibold shadow-sm shadow-cyan-950',
    secondary: 'bg-card text-textPrimary hover:bg-cardHover border border-border hover:border-borderLight',
    danger: 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-800/80',
    ghost: 'text-textSecondary hover:text-textPrimary hover:bg-card/60',
    outline: 'bg-transparent text-textPrimary hover:bg-card border border-border'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
