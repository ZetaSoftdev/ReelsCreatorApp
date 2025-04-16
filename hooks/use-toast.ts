"use client"

// This is a placeholder hook to make the build succeed
// Replace with actual implementation when ready

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function useToast() {
  return {
    toasts: [] as ToastProps[],
    toast: (props: Omit<ToastProps, "id">) => {
      console.log("Toast:", props);
      return { id: "toast-" + Math.random().toString(36).substr(2, 9) };
    },
    dismiss: (id: string) => {},
  };
}

// Export toast function to satisfy imports
export const toast = (props: Omit<ToastProps, "id">) => {
  console.log("Toast:", props);
  return { id: "toast-" + Math.random().toString(36).substr(2, 9) };
};
