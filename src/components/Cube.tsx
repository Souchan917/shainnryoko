import React from 'react';
import styled from 'styled-components';
import { useGameState, levelSymbols } from '../hooks/useGameState';

interface CubeContainerProps {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

const CubeContainer = styled.div`
  width: 200px;
  height: 200px;
  perspective: 800px;
  margin: 2rem auto;
  
  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
  }
`;

const CubeWrapper = styled.div<CubeContainerProps>`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(${props => props.rotateX}deg) rotateY(${props => props.rotateY}deg) rotateZ(${props => props.rotateZ}deg);
  transition: transform 0.8s ease;
  
  &:hover {
    animation: cubeHover 2s infinite alternate;
  }
  
  @keyframes cubeHover {
    0% {
      transform: rotateX(${props => props.rotateX}deg) rotateY(${props => props.rotateY}deg) rotateZ(${props => props.rotateZ}deg) translateZ(0);
    }
    100% {
      transform: rotateX(${props => props.rotateX}deg) rotateY(${props => props.rotateY}deg) rotateZ(${props => props.rotateZ}deg) translateZ(20px);
    }
  }
`;

const CubeFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(8, 26, 56, 0.9);
  border: 2px solid var(--onsen-blue);
  box-shadow: inset 0 0 15px rgba(77, 171, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: visible;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(77, 171, 255, 0.2), transparent);
  }
`;

const FrontFace = styled(CubeFace)`
  transform: translateZ(100px);
  
  @media (max-width: 768px) {
    transform: translateZ(75px);
  }
`;

const BackFace = styled(CubeFace)`
  transform: rotateY(180deg) translateZ(100px);
  
  @media (max-width: 768px) {
    transform: rotateY(180deg) translateZ(75px);
  }
`;

const RightFace = styled(CubeFace)`
  transform: rotateY(90deg) translateZ(100px);
  
  @media (max-width: 768px) {
    transform: rotateY(90deg) translateZ(75px);
  }
`;

const LeftFace = styled(CubeFace)`
  transform: rotateY(-90deg) translateZ(100px);
  
  @media (max-width: 768px) {
    transform: rotateY(-90deg) translateZ(75px);
  }
`;

const TopFace = styled(CubeFace)`
  transform: rotateX(90deg) translateZ(100px);
  
  @media (max-width: 768px) {
    transform: rotateX(90deg) translateZ(75px);
  }
`;

const BottomFace = styled(CubeFace)`
  transform: rotateX(-90deg) translateZ(100px);
  
  @media (max-width: 768px) {
    transform: rotateX(-90deg) translateZ(75px);
  }
`;

const CubeSymbol = styled.div`
  font-family: 'Yuji Mai', serif;
  font-size: 3.5rem;
  color: white;
  text-shadow: 0 0 10px var(--onsen-blue);
  z-index: 2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Cube: React.FC = () => {
  const { state } = useGameState();
  const { level, cubeRotation } = state;
  const symbols = state.level <= 5 ? state.level - 1 : 4; // 5レベルまで
  
  return (
    <CubeContainer>
      <CubeWrapper 
        rotateX={cubeRotation.x} 
        rotateY={cubeRotation.y} 
        rotateZ={cubeRotation.z}
      >
        <FrontFace>
          <CubeSymbol>{levelSymbols[symbols].front}</CubeSymbol>
        </FrontFace>
        <BackFace>
          <CubeSymbol>{levelSymbols[symbols].back}</CubeSymbol>
        </BackFace>
        <RightFace>
          <CubeSymbol>{levelSymbols[symbols].right}</CubeSymbol>
        </RightFace>
        <LeftFace>
          <CubeSymbol>{levelSymbols[symbols].left}</CubeSymbol>
        </LeftFace>
        <TopFace>
          <CubeSymbol>{levelSymbols[symbols].top}</CubeSymbol>
        </TopFace>
        <BottomFace>
          <CubeSymbol>{levelSymbols[symbols].bottom}</CubeSymbol>
        </BottomFace>
      </CubeWrapper>
    </CubeContainer>
  );
};

export default Cube; 