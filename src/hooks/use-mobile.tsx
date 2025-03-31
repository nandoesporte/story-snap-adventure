
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
    // Função para verificar se o dispositivo é móvel e atualizar dimensões
    const checkIfMobile = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobileView = width < MOBILE_BREAKPOINT
      
      setIsMobile(isMobileView)
      setWindowDimensions({ width, height })
      
      console.log("Verificação de dispositivo móvel:", { 
        width, 
        height,
        isMobile: isMobileView, 
        breakpoint: MOBILE_BREAKPOINT,
        timestamp: new Date().toISOString()
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
    window.addEventListener('resize', handleResize, { passive: true })
    
    // Configurar listener para mudanças de orientação em dispositivos móveis
    window.addEventListener('orientationchange', checkIfMobile)
    
    // Configurar listener para quando a janela volta a ficar visível
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkIfMobile()
      }
    })
    
    // Limpar
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
