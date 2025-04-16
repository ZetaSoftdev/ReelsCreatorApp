"use client";

// This is a placeholder file to make the build succeed
// Replace with actual implementation when ready

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const toast = (props: ToastProps) => {
  console.log("Toast:", props);
  // This would normally show a toast notification
  return {
    id: "toast-" + Math.random().toString(36).substr(2, 9),
    dismiss: () => {},
  };
}; 