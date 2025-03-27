
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Placeholder textures that are guaranteed to exist (using Unsplash images that won't expire)
const PLACEHOLDER_TEXTURE = '/placeholder.svg';
const FALLBACK_TEXTURES = {
  adventure: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
  fantasy: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  space: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=800&q=80',
  ocean: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80',
  dinosaurs: 'https://images.unsplash.com/photo-1569240651738-3d1356c8b4bc?auto=format&fit=crop&w=800&q=80',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
};

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

const BookPage: React.FC<BookPageProps> = ({ 
  position, 
  rotation, 
  pageNumber, 
  pageCount, 
  texture = PLACEHOLDER_TEXTURE, 
  isActive,
  turnPage,
  isCurrentPage,
  textContent
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [targetRotation, setTargetRotation] = useState<[number, number, number]>(rotation);
  
  // Use a safe texture path that won't throw errors
  const safeTexturePath = useMemo(() => {
    // If the texture is a URL that doesn't start with http(s), use the placeholder
    if (!texture || texture === PLACEHOLDER_TEXTURE) {
      return PLACEHOLDER_TEXTURE;
    }
    
    if (!texture.startsWith('http') && !texture.startsWith('/')) {
      console.warn('Invalid texture path:', texture);
      return PLACEHOLDER_TEXTURE;
    }
    
    return texture;
  }, [texture]);
  
  // Load textures safely with error handling
  const pageTexture = useMemo(() => {
    try {
      // Wrap in try-catch to handle potential texture loading errors
      const loadedTexture = new THREE.TextureLoader().load(
        safeTexturePath,
        undefined,  // onLoad callback
        undefined,  // onProgress callback
        () => {     // onError callback
          console.warn('Failed to load texture:', safeTexturePath);
          // We don't set state here to avoid re-renders
        }
      );
      return loadedTexture;
    } catch (error) {
      console.error("Failed to load texture, using placeholder:", error);
      return new THREE.TextureLoader().load(PLACEHOLDER_TEXTURE);
    }
  }, [safeTexturePath]);
  
  // Load paper texture once
  const paperTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load(PLACEHOLDER_TEXTURE);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }, []);
  
  // Update rotation in animation frame, not during render
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Smooth transition to target rotation
    meshRef.current.rotation.y += (targetRotation[1] - meshRef.current.rotation.y) * 0.1;
    
    // Add slight movement to non-current pages
    if (!isCurrentPage) {
      meshRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.001;
    }
  });
  
  // Update target rotation when the rotation prop changes
  useEffect(() => {
    setTargetRotation(rotation);
  }, [rotation]);
  
  const isFirstPage = pageNumber === 0;
  const isLastPage = pageNumber === pageCount - 1;
  
  const pageColor = isFirstPage 
    ? new THREE.Color(0x6a5acd)
    : isLastPage 
      ? new THREE.Color(0x8a2be2)
      : new THREE.Color(0xfafafa);
  
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
        <boxGeometry 
          args={[
            5,
            7,
            isFirstPage || isLastPage ? 0.25 : 0.02
          ]}
        />
        
        <meshStandardMaterial 
          color={pageColor}
          roughness={0.7}
          metalness={0.1}
          map={isFirstPage || isLastPage ? pageTexture : undefined}
          attach="material-4"
        />
        
        <meshStandardMaterial
          color={new THREE.Color(0xffffff)}
          roughness={0.8}
          metalness={0}
          map={!isFirstPage && !isLastPage ? pageTexture : undefined}
          attach="material-5"
        />
        
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

const Book3DScene: React.FC<Book3DProps> = ({ coverImage = PLACEHOLDER_TEXTURE, pages, currentPage, onPageTurn, title }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [openAmount, setOpenAmount] = useState(0);
  
  // Use useMemo to prevent recreating this array on every render
  const book3DPages = useMemo(() => [
    { texture: coverImage || PLACEHOLDER_TEXTURE, text: title },
    ...pages.map(page => ({
      texture: page.imageUrl || PLACEHOLDER_TEXTURE,
      text: page.text
    })),
    { texture: coverImage || PLACEHOLDER_TEXTURE, text: "" }
  ], [coverImage, pages, title]);
  
  const totalPages = book3DPages.length;
  
  const turnPage = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      onPageTurn(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      onPageTurn(currentPage - 1);
    }
  };
  
  // Update open amount when current page changes
  useEffect(() => {
    if (currentPage === 0) {
      setOpenAmount(0);
    } else if (currentPage === totalPages - 1) {
      setOpenAmount(0);
    } else {
      const openRatio = currentPage / totalPages;
      setOpenAmount(Math.PI * (0.2 + 0.6 * openRatio));
    }
  }, [currentPage, totalPages]);
  
  // Animate the book gently
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.PI * 0.05 + Math.sin(state.clock.elapsedTime * 0.1) * 0.05,
        0.05
      );
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  // Set camera position and lookAt
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {book3DPages.map((page, index) => {
        const isRightPage = index >= Math.floor(totalPages / 2);
        const pageRotation: [number, number, number] = [
          0,
          isRightPage 
            ? -openAmount / 2 + Math.PI * (index < currentPage ? 1 : 0)
            : openAmount / 2 - Math.PI * (index < currentPage ? 1 : 0),
          0
        ];
        
        const offset = 0.02 * (index - Math.floor(totalPages / 2));
        
        return (
          <BookPage
            key={index}
            position={[offset, 0, 0]}
            rotation={pageRotation}
            pageNumber={index}
            pageCount={totalPages}
            texture={page.texture}
            isActive={Math.abs(index - currentPage) <= 1}
            turnPage={turnPage}
            isCurrentPage={index === currentPage}
            textContent={page.text}
          />
        );
      })}
      
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />
      <pointLight position={[0, -5, 5]} intensity={0.3} color="#a090ff" />
    </group>
  );
};

// Error boundary class to prevent blank screen on 3D rendering errors
class ErrorFallback extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4 text-center">
          <div>
            <h3 className="text-lg font-medium mb-2">Não foi possível renderizar o livro 3D</h3>
            <p className="text-sm text-gray-600">Por favor, use o modo 2D para visualizar esta história.</p>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const Book3DViewer: React.FC<Book3DProps> = (props) => {
  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <ErrorFallback>
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
      </ErrorFallback>
    </div>
  );
};

export default Book3DViewer;
