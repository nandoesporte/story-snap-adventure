
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    // Função para verificar se o dispositivo é móvel
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileView)
      console.log("Verificação de dispositivo móvel:", { 
        width: window.innerWidth, 
        isMobile: isMobileView, 
        breakpoint: MOBILE_BREAKPOINT 
      })
    }
    
    // Verificação inicial
    checkIfMobile()
    
    // Usar um debounce para o resize para melhor performance
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    
    const handleResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
      
      resizeTimer = setTimeout(() => {
        checkIfMobile()
      }, 250)
    }
    
    // Configurar listener para redimensionamento da tela
    window.addEventListener('resize', handleResize)
    
    // Configurar listener para mudanças de orientação em dispositivos móveis
    window.addEventListener('orientationchange', checkIfMobile)
    
    // Limpar
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', checkIfMobile)
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
    }
  }, [])

  return isMobile
}
