import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton = ({ className = '', count = 1 }: SkeletonProps) => {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
          />
        ))}
    </>
  );
};

export default Skeleton; 