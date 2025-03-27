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
  const [textureLoadFailed, setTextureLoadFailed] = useState(false);
  
  let pageTexture;
  try {
    pageTexture = useTexture(texture);
    
    pageTexture.onError = () => {
      console.log("Failed to load texture:", texture);
      setTextureLoadFailed(true);
    };
  } catch (error) {
    console.error("Error loading texture:", error);
    setTextureLoadFailed(true);
    pageTexture = useTexture("/placeholder.svg");
  }
  
  const paperTexture = useTexture('/placeholder.svg');
  paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
  paperTexture.repeat.set(1, 1);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    meshRef.current.rotation.y += (targetRotation[1] - meshRef.current.rotation.y) * 0.1;
    
    if (!isCurrentPage) {
      meshRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.001;
    }
  });
  
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

const Book3DScene: React.FC<Book3DProps> = ({ coverImage = "/placeholder.svg", pages, currentPage, onPageTurn, title }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [openAmount, setOpenAmount] = useState(0);
  
  const book3DPages = [
    { texture: coverImage, text: title },
    ...pages.map(page => ({
      texture: page.imageUrl || "/placeholder.svg",
      text: page.text
    })),
    { texture: coverImage, text: "" }
  ];
  
  const totalPages = book3DPages.length;
  
  const turnPage = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      onPageTurn(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      onPageTurn(currentPage - 1);
    }
  };
  
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
