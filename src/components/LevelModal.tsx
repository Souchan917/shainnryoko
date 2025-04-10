import React from 'react';
import styled from 'styled-components';
import { useGameState } from '../hooks/useGameState';

interface ModalWrapperProps {
  isVisible: boolean;
}

const ModalWrapper = styled.div<ModalWrapperProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isVisible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fadeIn 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: rgba(8, 26, 56, 0.95);
  border: 2px solid var(--onsen-blue);
  border-radius: 10px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 0 30px rgba(77, 171, 255, 0.4);
  animation: fadeInUp 0.5s ease-out;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(77, 171, 255, 0.05) 0%, transparent 50%);
    border-radius: 8px;
    z-index: -1;
  }
`;

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--onsen-blue);
  text-shadow: 0 0 10px rgba(77, 171, 255, 0.5);
`;

const MessageText = styled.p`
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
  
  span {
    font-weight: 700;
    color: var(--accent-gold);
    font-size: 1.5rem;
  }
`;

const BonusText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  
  span {
    font-weight: 700;
    color: var(--accent-gold);
  }
`;

const NextButton = styled.button`
  display: block;
  margin: 2rem auto 1rem;
  padding: 0.8rem 3rem;
  background: transparent;
  border: 2px solid var(--accent-gold);
  border-radius: 5px;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 192, 69, 0.3), transparent);
    transition: all 0.5s;
    z-index: -1;
  }
  
  &:hover {
    box-shadow: 0 0 15px var(--accent-gold);
    
    &::before {
      left: 100%;
    }
  }
`;

const Warning = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: var(--death-red);
  margin-top: 1.5rem;
`;

const LevelModal: React.FC = () => {
  const { state, dispatch } = useGameState();
  const { level, time, showLevelModal } = state;
  
  const handleNextLevel = () => {
    dispatch({ type: 'NEXT_LEVEL' });
  };
  
  // 時間ボーナスとレベルボーナスの計算
  const timeBonus = time * 10;
  const levelBonus = level * 100;
  
  return (
    <ModalWrapper isVisible={showLevelModal}>
      <ModalContent>
        <Title>レベルクリア！</Title>
        <MessageText>
          湯けむりレベル <span>{level}</span> をクリアしました！
        </MessageText>
        <BonusText>
          残り時間: <span>{time}</span> 秒
        </BonusText>
        <BonusText>
          ボーナス: <span>{timeBonus + levelBonus}</span> ポイント
        </BonusText>
        
        <NextButton onClick={handleNextLevel}>
          次のレベルへ
        </NextButton>
        
        <Warning>
          ※注意: 次のレベルはさらに危険です。
        </Warning>
      </ModalContent>
    </ModalWrapper>
  );
};

export default LevelModal; 