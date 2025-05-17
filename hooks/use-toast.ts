"use client"

import { useState, useEffect } from "react";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

type UseToastOptions = {
  duration?: number;
};

// Create a simple EventEmitter pattern for toast management
type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Omit<Toast, "id"> }
  | { type: 'DISMISS_TOAST'; id: string };

// Use a simple event system since toast can be triggered from anywhere
const listeners: ((action: ToastAction) => void)[] = [];
const emit = (action: ToastAction) => {
  listeners.forEach(listener => listener(action));
};

export function useToast(options: UseToastOptions = {}) {
  const { duration = 5000 } = options;
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (action: ToastAction) => {
      if (action.type === 'ADD_TOAST') {
        const id = `toast-${Math.random().toString(36).substring(2, 9)}`;
        setToasts(prevToasts => [...prevToasts, { ...action.toast, id }]);
        
        // Auto dismiss after duration
        if (duration) {
          setTimeout(() => {
            emit({ type: 'DISMISS_TOAST', id });
          }, duration);
        }
      }
      else if (action.type === 'DISMISS_TOAST') {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== action.id));
      }
    };
    
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [duration]);

  return {
    toasts,
    toast: (props: Omit<Toast, "id">) => {
      const id = `toast-${Math.random().toString(36).substring(2, 9)}`;
      emit({ type: 'ADD_TOAST', toast: props });
      return { id };
    },
    dismiss: (id: string) => {
      emit({ type: 'DISMISS_TOAST', id });
    },
  };
}

// Export toast function for direct imports
export const toast = (props: Omit<Toast, "id">) => {
  emit({ type: 'ADD_TOAST', toast: props });
  const id = `toast-${Math.random().toString(36).substring(2, 9)}`;
  return { id };
};
