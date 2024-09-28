// src/components/ui/button.jsx
import React from 'react';

export const Button = ({ onClick, children, variant = 'primary' }) => {
  const baseClasses = "font-bold py-2 px-4 rounded transition duration-300";
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-800",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};