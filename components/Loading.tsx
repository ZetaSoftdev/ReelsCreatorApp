"use client";

import React from "react";

interface LoadingProps {
  className?: string;
}

// This is a placeholder component to make the build succeed
// Replace with actual implementation when ready
const Loading: React.FC<LoadingProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
    </div>
  );
};

export default Loading; 