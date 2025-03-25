
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Combine the refs (user provided ref and our internal ref)
    const setRefs = React.useCallback(
      (element: HTMLTextAreaElement | null) => {
        // For our internal use
        textareaRef.current = element;
        
        // For the forwarded ref from props
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );
    
    // Auto-resize handler
    const handleInput = React.useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      
      // Reset height first to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set to scrollHeight which represents full content height
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);
    
    // Add event listener on mount, run once for initial content
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      // Initial resize
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      
      // Add event listener for resize
      textarea.addEventListener('input', handleInput as any);
      
      return () => {
        textarea.removeEventListener('input', handleInput as any);
      };
    }, [handleInput]);
    
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden resize-none",
          className
        )}
        ref={setRefs}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
