
import { toast } from "sonner";
import { useToast as useToastOriginal } from "@/hooks/use-toast";

// Re-export the hook, but use sonner for toast
export const useToast = useToastOriginal;
export { toast };
