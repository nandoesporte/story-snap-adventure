
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Function to check if device is mobile
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileView)
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
    
    // Initial check
    checkIfMobile()
    
    // Set up event listener for screen resize
    window.addEventListener('resize', checkIfMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [isInitialized])

  return isMobile
}
