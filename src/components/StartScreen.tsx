import React, { useState } from 'react';
import styled from 'styled-components';
import { useGameState } from '../hooks/useGameState';

const StartScreenContainer = styled.section<{ isHidden: boolean }>`
  display: ${props => props.isHidden ? 'none' : 'flex'};
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: rgba(0, 0, 10, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(77, 171, 255, 0.3);
  max-width: 600px;
  width: 90%;
  animation: fadeIn 1s ease-out;
  position: relative;
  overflow: hidden;
  
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

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--onsen-blue);
  text-shadow: 0 0 10px rgba(77, 171, 255, 0.8);
`;

const Warning = styled.p`
  color: var(--death-red);
  font-weight: 700;
  margin-bottom: 2rem;
  text-shadow: 0 0 8px rgba(255, 58, 71, 0.5);
  letter-spacing: 1px;
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 2rem;
`;

const PlayerNameInput = styled.input`
  padding: 0.8rem 1.2rem;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid var(--onsen-blue);
  color: var(--text-color);
  font-size: 1.1rem;
  width: 80%;
  margin-bottom: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 10px var(--onsen-blue);
  }
  
  &::placeholder {
    color: rgba(240, 240, 240, 0.6);
  }
`;

const StartButton = styled.button`
  position: relative;
  padding: 0.8rem 3rem;
  background: transparent;
  border: 2px solid var(--onsen-blue);
  border-radius: 5px;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  z-index: 1;
  transition: all 0.3s;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(77, 171, 255, 0.3), transparent);
    transition: all 0.5s;
    z-index: -1;
  }
  
  &:hover {
    box-shadow: 0 0 15px var(--onsen-blue);
    
    &::before {
      left: 100%;
    }
  }
`;

const Instructions = styled.p`
  text-align: center;
  line-height: 1.8;
  margin-bottom: 2rem;
  font-weight: 300;
`;

const DeathCount = styled.div`
  background: rgba(255, 58, 71, 0.2);
  padding: 0.7rem 1.5rem;
  border-radius: 5px;
  border: 1px solid var(--death-red);
  
  p {
    font-size: 0.9rem;
    color: var(--text-color);
    
    .count {
      color: var(--death-red);
      font-weight: 700;
      font-size: 1.1rem;
    }
  }
`;

const StartScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const { state, dispatch } = useGameState();
  
  const handleStartGame = () => {
    const name = playerName.trim() || '名無し';
    dispatch({ type: 'START_GAME', payload: { playerName: name } });
  };
  
  return (
    <StartScreenContainer isHidden={state.currentScreen !== 'start'}>
      <Title>湯けむり招待状</Title>
      <Warning>※注意※ このゲームは命がけです。参加者は覚悟をしてください。</Warning>
      
      <PlayerInfo>
        <PlayerNameInput 
          type="text" 
          placeholder="名前を入力してください" 
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <StartButton onClick={handleStartGame}>
          ゲーム開始
        </StartButton>
      </PlayerInfo>
      
      <Instructions>
        湯けむりの中で繰り広げられる命がけのパズルに挑戦！<br />
        全てのコードを見つけて立方体を解き明かせ。
      </Instructions>
      
      <DeathCount>
        <p>これまでの犠牲者数: <span className="count">42</span>人</p>
      </DeathCount>
    </StartScreenContainer>
  );
};

export default StartScreen; 