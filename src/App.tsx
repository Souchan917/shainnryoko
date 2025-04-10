import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import LevelModal from './components/LevelModal';
import BackgroundEffects from './components/BackgroundEffects';
import { GameStateProvider } from './hooks/useGameState';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  width: 100%;
  max-width: 800px;
`;

const BloodDrip = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 10px;
  background: linear-gradient(to bottom, var(--death-red) 0%, transparent 100%);
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 4px;
  background: linear-gradient(to bottom, var(--text-color), var(--onsen-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  span {
    color: var(--death-red);
    -webkit-text-fill-color: var(--death-red);
    text-shadow: var(--death-glow);
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Tagline = styled.p`
  font-size: 1.2rem;
  font-weight: 300;
  margin-bottom: 2rem;
  text-shadow: 0 0 5px var(--onsen-blue);
`;

const App: React.FC = () => {
  return (
    <GameStateProvider>
      <BackgroundEffects />
      <AppContainer>
        <Header>
          <BloodDrip />
          <Title>箱根温泉 <span>デス</span> ゲーム</Title>
          <Tagline>湯けむりの向こうは生か死か...</Tagline>
        </Header>
        
        <StartScreen />
        <GameScreen />
        <ResultScreen />
        <LevelModal />
      </AppContainer>
    </GameStateProvider>
  );
};

export default App; 