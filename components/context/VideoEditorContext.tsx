"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface VideoEditorContextType {
  // Add your context properties here when ready
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(undefined);

export function useVideoEditor() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("useVideoEditor must be used within a VideoEditorProvider");
  }
  return context;
}

// This is a placeholder context provider to make the build succeed
// Replace with actual implementation when ready
export function VideoEditorProvider({ children }: { children: ReactNode }) {
  const value = {};

  return (
    <VideoEditorContext.Provider value={value as VideoEditorContextType}>
      {children}
    </VideoEditorContext.Provider>
  );
} 