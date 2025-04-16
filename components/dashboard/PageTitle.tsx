"use client";

import React from "react";

interface PageTitleProps {
  title: string;
  description?: string;
  backButton?: boolean;
  onBackClick?: () => void;
}

// This is a placeholder component to make the build succeed
// Replace with actual implementation when ready
export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  description,
  backButton,
  onBackClick,
}) => {
  return (
    <div className="mb-4">
      {backButton && (
        <button 
          onClick={onBackClick} 
          className="mb-2 text-sm"
        >
          ← Back
        </button>
      )}
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
}; 