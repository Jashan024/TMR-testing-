import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoaderIcon } from './Icons';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  to,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  loading = false
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-6 py-3 font-semibold text-center rounded-2xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

  const variantStyles = {
    primary: 'text-white bg-gradient-to-br from-cyan-500 to-blue-600 hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.4)] hover:brightness-110',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md',
    outline: 'border-2 border-cyan-500/50 bg-transparent text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 focus:ring-cyan-600 shadow-sm',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading && <LoaderIcon className="w-5 h-5 mr-2" />}
      {children}
    </>
  );

  if (to) {
    if (isDisabled) {
      // Render a div that looks like a button but isn't a link
      // Manually add disabled styles because div doesn't have a disabled attribute
      return <div className={`${combinedClassName} opacity-50 cursor-not-allowed`}>{content}</div>;
    }
    return (
      <Link to={to} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedClassName} disabled={isDisabled}>
      {content}
    </button>
  );
};

export default Button;
