import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md';

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60 disabled:cursor-not-allowed';

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(base, sizes[size], variants[variant], fullWidth && 'w-full', className)}
      {...rest}
    />
  );
}


