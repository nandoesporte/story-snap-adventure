
import { toast as sonnerToast } from 'sonner';

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  action?: React.ReactNode;
};

export function toast(props: ToastProps) {
  const { variant = 'default', title, description, ...rest } = props;
  
  // Properly pass title and description as separate arguments to sonnerToast
  return sonnerToast(title || '', {
    description,
    ...rest
  });
}

// Create a fake toasts array for compatibility with shadcn toaster
const toastsState = { toasts: [] };

export function useToast() {
  return {
    toast,
    toasts: toastsState.toasts
  };
}
