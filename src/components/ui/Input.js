// src/components/ui/input.jsx
import React from 'react';

export const Input = ({ type = 'text', value, onChange, placeholder, className = '' }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300 ${className}`}
    />
  );
};