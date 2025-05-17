"use client";

// Import the actual toast function from the hooks/use-toast.ts
import { toast as hookToast } from "@/hooks/use-toast";

// This is a placeholder file to make the build succeed
// Replace with actual implementation when ready

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

// Export the toast function that forwards to the real implementation
export const toast = (props: ToastProps) => {
  return hookToast(props);
}; 