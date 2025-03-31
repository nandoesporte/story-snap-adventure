
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )
  const [windowDimensions, setWindowDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  React.useEffect(() => {
    // Function to check if device is mobile and update dimensions
    const checkIfMobile = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobileView = width < MOBILE_BREAKPOINT
      
      setIsMobile(isMobileView)
      setWindowDimensions({ width, height })
      
      console.log("Mobile device check:", { 
        width, 
        height,
        isMobile: isMobileView, 
        breakpoint: MOBILE_BREAKPOINT,
        timestamp: new Date().toISOString()
      })
    }
    
    // Initial check
    checkIfMobile()
    
    // Use debounce for resize for better performance
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    
    const handleResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
      
      resizeTimer = setTimeout(() => {
        checkIfMobile()
      }, 250)
    }
    
    // Set up listeners for screen resize
    window.addEventListener('resize', handleResize, { passive: true })
    
    // Set up listeners for orientation changes on mobile devices
    window.addEventListener('orientationchange', checkIfMobile)
    
    // Set up listeners for when window becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkIfMobile()
      }
    })
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', checkIfMobile)
      document.removeEventListener('visibilitychange', checkIfMobile)
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
    }
  }, [])

  return {
    isMobile,
    windowWidth: windowDimensions.width,
    windowHeight: windowDimensions.height
  }
}
