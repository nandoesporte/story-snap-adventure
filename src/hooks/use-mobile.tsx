
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to check if device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkIfMobile()
    
    // Set up event listener for screen resize
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Modern event listener usage
    try {
      // For modern browsers, use addEventListener
      mql.addEventListener("change", checkIfMobile)
      
      // Cleanup function
      return () => mql.removeEventListener("change", checkIfMobile)
    } catch (e1) {
      // Fallback for older browsers
      try {
        // For older browsers, use addListener (deprecated)
        // @ts-ignore - addListener is deprecated but still works in older browsers
        mql.addListener(checkIfMobile)
        
        // Cleanup function for older browsers
        return () => {
          // @ts-ignore - removeListener is deprecated but still works in older browsers
          mql.removeListener(checkIfMobile)
        }
      } catch (e2) {
        // If all fails, use window resize event
        window.addEventListener('resize', checkIfMobile)
        return () => window.removeEventListener('resize', checkIfMobile)
      }
    }
  }, [])

  // Return current state, defaulting to false if undefined
  return !!isMobile
}
