// src/components/ui/button.jsx
import React from 'react';

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses = "font-bold py-2 px-4 rounded transition duration-300";
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-800",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-500 hover:bg-red-600 text-white",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};