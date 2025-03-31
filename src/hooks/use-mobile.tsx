
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
      console.log("Tamanho da tela alterado:", { width: window.innerWidth, isMobile: isMobileView })
    }
    
    // Verificação inicial
    checkIfMobile()
    
    // Configurar listener para redimensionamento da tela
    window.addEventListener('resize', checkIfMobile)
    
    // Limpar
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return isMobile
}
