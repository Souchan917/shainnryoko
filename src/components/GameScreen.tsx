import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useGameState, levelCodes } from '../hooks/useGameState';
import Cube from './Cube';

const GameScreenContainer = styled.section<{ isHidden: boolean }>`
  display: ${props => props.isHidden ? 'none' : 'flex'};
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 10, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(77, 171, 255, 0.3);
  padding: 2rem;
  max-width: 800px;
  width: 90%;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(77, 171, 255, 0.1) 0%, transparent 50%, rgba(255, 58, 71, 0.1) 100%);
    z-index: -1;
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

const LevelIndicator = styled.div`
  font-size: 1.2rem;
  color: var(--onsen-blue);
  
  span {
    font-weight: 700;
    font-size: 1.5rem;
  }
`;

const Timer = styled.div<{ isLow: boolean }>`
  font-size: 1.2rem;
  color: ${props => props.isLow ? 'var(--death-red)' : 'var(--text-color)'};
  animation: ${props => props.isLow ? 'timerPulse 0.5s infinite' : 'none'};
  
  span {
    font-weight: 700;
    font-size: 1.5rem;
  }
`;

const CubeSection = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
  }
`;

const CodeDisplay = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 5px;
  border: 1px solid var(--onsen-blue);
  margin-bottom: 2rem;
  width: 100%;
  max-width: 400px;
  
  p {
    text-align: center;
    margin-bottom: 1rem;
    color: var(--onsen-blue);
  }
  
  @media (min-width: 768px) {
    margin-bottom: 0;
    width: 45%;
  }
`;

const CodeSegments = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

interface CodeSegmentProps {
  isCollected: boolean;
}

const CodeSegment = styled.div<CodeSegmentProps>`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isCollected 
    ? 'rgba(77, 171, 255, 0.3)' 
    : 'rgba(0, 0, 0, 0.4)'};
  border: 2px solid ${props => props.isCollected 
    ? 'var(--onsen-blue)' 
    : 'rgba(77, 171, 255, 0.3)'};
  border-radius: 5px;
  font-size: 1.5rem;
  font-family: 'Orbitron', sans-serif;
  color: ${props => props.isCollected 
    ? 'var(--text-color)' 
    : 'rgba(240, 240, 240, 0.5)'};
  box-shadow: ${props => props.isCollected 
    ? '0 0 10px rgba(77, 171, 255, 0.5)' 
    : 'none'};
  transition: all 0.3s;
`;

const ControlButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  
  @media (min-width: 768px) {
    width: 45%;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--onsen-blue);
  border-radius: 5px;
  color: var(--text-color);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover, &:focus {
    background: rgba(77, 171, 255, 0.2);
    box-shadow: 0 0 10px rgba(77, 171, 255, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const SolveButton = styled(ControlButton)`
  width: 130px;
  border-color: var(--accent-gold);
  
  &:hover, &:focus {
    background: rgba(255, 192, 69, 0.2);
    box-shadow: 0 0 10px rgba(255, 192, 69, 0.5);
  }
`;

const FailureMessage = styled.div<{ isHidden: boolean }>`
  display: ${props => props.isHidden ? 'none' : 'block'};
  background: rgba(255, 58, 71, 0.2);
  border: 2px solid var(--death-red);
  color: var(--death-red);
  text-align: center;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 2rem;
  width: 100%;
  max-width: 500px;
  animation: fadeIn 0.5s;
  font-size: 1.2rem;
  letter-spacing: 1px;
`;

const GameScreen: React.FC = () => {
  const { state, dispatch } = useGameState();
  const { level, time, collectedCodes, currentScreen, cubeRotation } = state;
  const [randomCode, setRandomCode] = useState<string | null>(null);
  
  // ランダムにコードを見つける効果
  useEffect(() => {
    if (currentScreen === 'game') {
      const checkRandomCode = () => {
        // すでに全てのコードを収集している場合は何もしない
        if (collectedCodes.length >= 4) return;
        
        // 10%の確率でコードを発見
        if (Math.random() <= 0.1) {
          const availableCodes = levelCodes[level - 1].filter(
            code => !collectedCodes.includes(code)
          );
          
          if (availableCodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCodes.length);
            setRandomCode(availableCodes[randomIndex]);
          }
        }
      };
      
      const interval = setInterval(checkRandomCode, 2000);
      return () => clearInterval(interval);
    }
  }, [level, collectedCodes, currentScreen]);
  
  // コードが見つかったらコレクションに追加
  useEffect(() => {
    if (randomCode) {
      setTimeout(() => {
        dispatch({ type: 'COLLECT_CODE', payload: { code: randomCode } });
        setRandomCode(null);
      }, 800);
    }
  }, [randomCode, dispatch]);
  
  const handleRotate = (direction: string) => {
    dispatch({ type: 'ROTATE_CUBE', payload: { direction } });
  };
  
  const handleSolve = () => {
    // 全てのコードを収集済みの場合のみ解ける
    if (collectedCodes.length === 4) {
      dispatch({ type: 'LEVEL_COMPLETE' });
    }
  };
  
  return (
    <GameScreenContainer isHidden={currentScreen !== 'game'}>
      <GameHeader>
        <LevelIndicator>
          レベル: <span>{level}</span>
        </LevelIndicator>
        <Timer isLow={time <= 10}>
          残り時間: <span>{time}</span>秒
        </Timer>
      </GameHeader>
      
      <CubeSection>
        <Cube />
      </CubeSection>
      
      <ControlPanel>
        <CodeDisplay>
          <p>収集したコード:</p>
          <CodeSegments>
            {levelCodes[level - 1].map((code, index) => (
              <CodeSegment 
                key={index} 
                isCollected={collectedCodes.includes(code)}
              >
                {collectedCodes.includes(code) ? code : '?'}
              </CodeSegment>
            ))}
          </CodeSegments>
        </CodeDisplay>
        
        <ControlButtons>
          <ButtonRow>
            <ControlButton onClick={() => handleRotate('left')}>←</ControlButton>
            <ControlButton onClick={() => handleRotate('up')}>↑</ControlButton>
            <ControlButton onClick={() => handleRotate('down')}>↓</ControlButton>
            <ControlButton onClick={() => handleRotate('right')}>→</ControlButton>
          </ButtonRow>
          <ButtonRow>
            <ControlButton onClick={() => handleRotate('rotate-x')}>X</ControlButton>
            <ControlButton onClick={() => handleRotate('rotate-y')}>Y</ControlButton>
            <ControlButton onClick={() => handleRotate('rotate-z')}>Z</ControlButton>
            <SolveButton onClick={handleSolve}>解く</SolveButton>
          </ButtonRow>
        </ControlButtons>
      </ControlPanel>
      
      <FailureMessage isHidden={time > 0}>
        時間切れです...あなたは湯けむりの中で消えました。
      </FailureMessage>
    </GameScreenContainer>
  );
};

export default GameScreen; 