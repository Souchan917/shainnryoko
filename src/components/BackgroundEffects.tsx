import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: -3;
`;

const Stars = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  opacity: 0.5;
  animation: twinkle 8s infinite linear;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(white, rgba(255, 255, 255, 0.2) 2px, transparent 4px);
    background-size: 50px 50px;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(white, rgba(255, 255, 255, 0.15) 1px, transparent 3px);
    background-size: 50px 50px;
    background-position: 25px 25px;
  }
`;

const Mountains = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 25%;
  z-index: -1;
  opacity: 0.3;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(transparent 30%, rgba(0, 0, 0, 0.8));
    clip-path: polygon(0% 100%, 15% 65%, 30% 85%, 45% 70%, 60% 80%, 75% 65%, 90% 75%, 100% 60%, 100% 100%);
  }
`;

const OnsenBubblesContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
`;

interface BubbleProps {
  size: number;
  left: string;
  animationDuration: string;
}

const OnsenBubble = styled.div<BubbleProps>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(77, 171, 255, 0.6), rgba(77, 171, 255, 0.1));
  animation: bubbleRise ${props => props.animationDuration} ease-in forwards;
  opacity: 0.7;
  left: ${props => props.left};
  bottom: -20px;
`;

interface BloodDropProps {
  left: string;
}

const BloodDrop = styled.div<BloodDropProps>`
  position: absolute;
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, var(--death-red), rgba(255, 0, 0, 0.2));
  top: -20px;
  left: ${props => props.left};
  animation: bloodDrip 7s ease-in forwards;
  opacity: 0;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: -4px;
    width: 10px;
    height: 10px;
    background: var(--death-red);
    border-radius: 50%;
  }
`;

const BackgroundEffects: React.FC = () => {
  const [bubbles, setBubbles] = useState<Array<{id: number, size: number, left: string, animationDuration: string}>>([]);
  const [bloodDrops, setBloodDrops] = useState<Array<{id: number, left: string}>>([]);
  
  // 温泉の泡エフェクトを作成
  useEffect(() => {
    const createBubbles = () => {
      const newBubbles = Array.from({ length: 15 }, (_, index) => {
        const size = Math.random() * 30 + 10; // 10px〜40px
        const left = `${Math.random() * 100}%`; // 0%〜100%
        const animationDuration = `${Math.random() * 8 + 4}s`; // 4s〜12s
        
        return { 
          id: Date.now() + index, 
          size, 
          left, 
          animationDuration 
        };
      });
      
      setBubbles(prev => [...prev, ...newBubbles]);
    };
    
    createBubbles();
    const intervalId = setInterval(createBubbles, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 古い泡を削除
  useEffect(() => {
    if (bubbles.length > 50) {
      setBubbles(prev => prev.slice(prev.length - 50));
    }
  }, [bubbles]);
  
  // 血の滴りエフェクト
  useEffect(() => {
    const createBloodDrop = () => {
      if (Math.random() > 0.7) { // 30%の確率で血滴を生成
        const left = `${Math.random() * 100}%`;
        setBloodDrops(prev => [...prev, { id: Date.now(), left }]);
      }
    };
    
    const intervalId = setInterval(createBloodDrop, 3000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 古い血滴を削除
  useEffect(() => {
    if (bloodDrops.length > 20) {
      setBloodDrops(prev => prev.slice(prev.length - 20));
    }
  }, [bloodDrops]);
  
  return (
    <>
      <Overlay />
      <Stars />
      <Mountains />
      <OnsenBubblesContainer>
        {bubbles.map(bubble => (
          <OnsenBubble 
            key={bubble.id}
            size={bubble.size}
            left={bubble.left}
            animationDuration={bubble.animationDuration}
          />
        ))}
      </OnsenBubblesContainer>
      
      {bloodDrops.map(drop => (
        <BloodDrop key={drop.id} left={drop.left} />
      ))}
    </>
  );
};

export default BackgroundEffects; 