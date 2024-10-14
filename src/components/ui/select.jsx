// src/components/ui/select.jsx

import React from 'react';

const Select = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <select
      className={`block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Select.displayName = 'Select';

export { Select };