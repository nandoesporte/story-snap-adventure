
import { toast as sonnerToast, type Toast } from 'sonner';

export type ToastProps = Toast & {
  variant?: 'default' | 'destructive' | 'success'
};

export function toast(props: ToastProps) {
  const { variant = 'default', ...rest } = props;
  
  return sonnerToast(rest);
}

export function useToast() {
  return {
    toast
  };
}
