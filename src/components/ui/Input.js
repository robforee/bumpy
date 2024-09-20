// src/components/ui/Input.jsx

import React from 'react';

export const Input = React.forwardRef(({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className = '',
  name,  // Add name prop
  ...props  // Spread operator for any additional props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      name={name}  // Pass name prop
      className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition duration-300 ${className}`}
      {...props}  // Spread any additional props
    />
  );
});

Input.displayName = 'Input';  // Add display name for React DevTools