
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface BookPageProps {
  position: [number, number, number];
  rotation: [number, number, number];
  pageNumber: number;
  pageCount: number;
  texture?: string;
  isActive: boolean;
  turnPage: (direction: 'next' | 'prev') => void;
  isCurrentPage: boolean;
  textContent?: string;
}

// Componente individual para uma página de livro
const BookPage: React.FC<BookPageProps> = ({ 
  position, 
  rotation, 
  pageNumber, 
  pageCount, 
  texture = "/placeholder.svg", 
  isActive,
  turnPage,
  isCurrentPage,
  textContent
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [targetRotation, setTargetRotation] = useState(rotation);
  
  // Carrega a textura para esta página
  const pageTexture = useTexture(texture);
  
  // Textura de papel para o fundo da página
  const paperTexture = useTexture('/placeholder.svg');
  paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
  paperTexture.repeat.set(1, 1);
  
  // Efeito para animação de virada de página
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Animação suave de rotação para virada de página
    meshRef.current.rotation.y += (targetRotation[1] - meshRef.current.rotation.y) * 0.1;
    
    // Adiciona pequena oscilação para páginas não ativas
    if (!isCurrentPage) {
      meshRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.001;
    }
  });
  
  // Determina as cores e estilos com base no tipo de página
  const isFirstPage = pageNumber === 0;
  const isLastPage = pageNumber === pageCount - 1;
  
  // Cores diferentes para capa, contracapa e páginas internas
  const pageColor = isFirstPage 
    ? new THREE.Color(0x6a5acd) // Capa (roxo)
    : isLastPage 
      ? new THREE.Color(0x8a2be2) // Contracapa (roxo mais escuro)
      : new THREE.Color(0xfafafa); // Páginas internas (branco papel)
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        onClick={() => isActive && turnPage(pageNumber < pageCount / 2 ? 'next' : 'prev')}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered && isActive ? [1.01, 1.01, 1.01] : [1, 1, 1]}
      >
        {/* Geometria da página - um pouco mais fina para páginas internas */}
        <boxGeometry 
          args={[
            5, // largura
            7, // altura
            isFirstPage || isLastPage ? 0.25 : 0.02 // espessura (mais grossa para capas)
          ]} 
        />
        
        {/* Materiais diferentes para as faces do livro */}
        <meshStandardMaterial 
          color={pageColor}
          roughness={0.7}
          metalness={0.1}
          map={isFirstPage || isLastPage ? pageTexture : undefined}
          attach="material-4" // Frente da página (onde fica o conteúdo)
        />
        
        {/* Material para a página de texto */}
        <meshStandardMaterial
          color={new THREE.Color(0xffffff)}
          roughness={0.8}
          metalness={0}
          map={!isFirstPage && !isLastPage ? pageTexture : undefined}
          attach="material-5" // Verso da página
        />
        
        {/* Outros lados da página */}
        {[0, 1, 2, 3].map(idx => (
          <meshStandardMaterial
            key={idx}
            color={pageColor}
            roughness={0.7}
            metalness={0.1}
            attach={`material-${idx}`}
          />
        ))}
      </mesh>
      
      {/* Efeito de destaques nas bordas para páginas ativas */}
      {isActive && hovered && (
        <mesh position={[2.45, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.1, 7]} />
          <meshBasicMaterial color={0xffdd00} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

interface Book3DProps {
  coverImage?: string;
  pages: Array<{
    text: string;
    imageUrl?: string;
  }>;
  currentPage: number;
  onPageTurn: (newPage: number) => void;
  title: string;
}

// Componente principal do Livro 3D
const Book3DScene: React.FC<Book3DProps> = ({ coverImage = "/placeholder.svg", pages, currentPage, onPageTurn, title }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [openAmount, setOpenAmount] = useState(0);
  
  // Converte páginas do formato de história para o formato 3D (páginas duplas para livro)
  const book3DPages = [
    // Capa
    { texture: coverImage, text: title },
    // Páginas internas
    ...pages.map(page => ({
      texture: page.imageUrl || "/placeholder.svg",
      text: page.text
    })),
    // Contracapa
    { texture: coverImage, text: "" }
  ];
  
  const totalPages = book3DPages.length;
  
  // Função para virar a página
  const turnPage = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      onPageTurn(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      onPageTurn(currentPage - 1);
    }
  };
  
  // Efeito de abertura do livro baseado na página atual
  useEffect(() => {
    // Livro fechado no início (capa) ou no final (contracapa)
    if (currentPage === 0) {
      setOpenAmount(0); // Livro fechado na capa
    } else if (currentPage === totalPages - 1) {
      setOpenAmount(0); // Livro fechado na contracapa
    } else {
      // Livro aberto com ângulo de abertura proporcional à posição da página atual
      const openRatio = currentPage / totalPages;
      setOpenAmount(Math.PI * (0.2 + 0.6 * openRatio)); // Abre entre 20% e 80% baseado na página
    }
  }, [currentPage, totalPages]);
  
  // Animação e rotação do livro
  useFrame((state) => {
    if (groupRef.current) {
      // Rotação suave do livro
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.PI * 0.05 + Math.sin(state.clock.elapsedTime * 0.1) * 0.05,
        0.05
      );
      // Pequena oscilação para efeito de "flutuação"
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  // Calcula a câmera ideal para o livro
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Renderiza todas as páginas do livro */}
      {book3DPages.map((page, index) => {
        // Calcula posição e rotação de cada página
        const isRightPage = index >= Math.floor(totalPages / 2);
        const pageRotation: [number, number, number] = [
          0,
          // Ângulos diferentes para páginas esquerdas e direitas
          isRightPage 
            ? -openAmount / 2 + Math.PI * (index < currentPage ? 1 : 0)
            : openAmount / 2 - Math.PI * (index < currentPage ? 1 : 0),
          0
        ];
        
        // Offset para criar efeito de espessura do livro
        const offset = 0.02 * (index - Math.floor(totalPages / 2));
        
        return (
          <BookPage
            key={index}
            position={[offset, 0, 0]}
            rotation={pageRotation}
            pageNumber={index}
            pageCount={totalPages}
            texture={page.texture}
            isActive={Math.abs(index - currentPage) <= 1} // Apenas páginas próximas são interativas
            turnPage={turnPage}
            isCurrentPage={index === currentPage}
            textContent={page.text}
          />
        );
      })}
      
      {/* Iluminação suave para o livro */}
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />
      <pointLight position={[0, -5, 5]} intensity={0.3} color="#a090ff" />
    </group>
  );
};

interface Book3DViewerProps {
  coverImage?: string;
  pages: Array<{
    text: string;
    imageUrl?: string;
  }>;
  currentPage: number;
  onPageTurn: (newPage: number) => void;
  title: string;
}

// Componente público que exportamos (wrapper do Canvas)
const Book3DViewer: React.FC<Book3DViewerProps> = (props) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <Canvas shadows>
        <Environment preset="apartment" />
        <ambientLight intensity={0.4} />
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        <Book3DScene {...props} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          dampingFactor={0.2}
          rotateSpeed={0.7}
        />
      </Canvas>
    </div>
  );
};

export default Book3DViewer;
