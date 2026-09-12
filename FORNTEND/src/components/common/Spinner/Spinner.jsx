import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const currentSizeClass = sizeMap[size] || 'w-6 h-6 border-2';

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span
        className={`${currentSizeClass} border-blue-600 border-t-transparent rounded-full animate-spin inline-block`}
      />
    </div>
  );
};

export default Spinner;

