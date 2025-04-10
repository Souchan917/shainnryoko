import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGameState } from '../hooks/useGameState';

interface ResultContainerProps {
  isHidden: boolean;
  isSuccess: boolean;
}

const ResultContainer = styled.section<ResultContainerProps>`
  display: ${props => props.isHidden ? 'none' : 'flex'};
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 10, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 
    0 0 40px ${props => props.isSuccess ? 'rgba(77, 171, 255, 0.3)' : 'rgba(255, 58, 71, 0.3)'};
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
    background: linear-gradient(135deg, 
      ${props => props.isSuccess ? 'rgba(77, 171, 255, 0.1)' : 'rgba(255, 58, 71, 0.1)'} 0%, 
      transparent 50%, 
      ${props => props.isSuccess ? 'rgba(77, 171, 255, 0.1)' : 'rgba(255, 58, 71, 0.1)'} 100%);
    z-index: -1;
  }
`;

const ResultContent = styled.div`
  text-align: center;
  width: 100%;
`;

const Title = styled.h2<{ isSuccess: boolean }>`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: ${props => props.isSuccess ? 'var(--onsen-blue)' : 'var(--death-red)'};
  text-shadow: 0 0 10px ${props => props.isSuccess ? 'rgba(77, 171, 255, 0.5)' : 'rgba(255, 58, 71, 0.5)'};
`;

const ResultItem = styled.p`
  font-size: 1.3rem;
  margin-bottom: 1rem;
  
  span {
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--accent-gold);
  }
`;

const RestartButton = styled.button`
  margin-top: 2rem;
  padding: 0.8rem 3rem;
  background: transparent;
  border: 2px solid var(--onsen-blue);
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

const RankingContainer = styled.div`
  margin-top: 3rem;
  width: 100%;
  max-width: 600px;
`;

const RankingTitle = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--onsen-blue);
  text-align: center;
`;

const RankingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.8rem;
    text-align: center;
    border-bottom: 1px solid rgba(77, 171, 255, 0.3);
  }
  
  th {
    color: var(--onsen-blue);
    font-weight: 500;
    font-size: 1rem;
  }
  
  tr:nth-child(even) {
    background: rgba(77, 171, 255, 0.05);
  }
  
  tr.current-player {
    background: rgba(255, 192, 69, 0.1);
    
    td {
      color: var(--accent-gold);
      font-weight: 700;
    }
  }
`;

const ResultScreen: React.FC = () => {
  const { state, dispatch, rankings, setRankings } = useGameState();
  const { playerName, score, level, elapsedTime, currentScreen, isGameSuccess } = state;
  
  // ランキングを更新
  useEffect(() => {
    if (currentScreen === 'result' && playerName) {
      const updatedRankings = [...rankings, { 
        name: playerName, 
        score, 
        level, 
        time: Math.floor(elapsedTime) 
      }].sort((a, b) => b.score - a.score).slice(0, 10);
      
      setRankings(updatedRankings);
    }
  }, [currentScreen, playerName, score, level, elapsedTime, rankings, setRankings]);
  
  const handleRestart = () => {
    dispatch({ type: 'RESTART_GAME' });
  };
  
  const playerRank = rankings.findIndex(rank => rank.name === playerName) + 1;
  
  return (
    <ResultContainer isHidden={currentScreen !== 'result'} isSuccess={isGameSuccess}>
      <ResultContent>
        <Title isSuccess={isGameSuccess}>
          {isGameSuccess ? '箱根温泉からの脱出' : '湯けむりの中で消えました'}
        </Title>
        
        <ResultItem>
          ミッション結果: <span>{isGameSuccess ? '成功' : '失敗'}</span>
        </ResultItem>
        
        <ResultItem>
          最終スコア: <span>{score}</span>
        </ResultItem>
        
        <ResultItem>
          クリアタイム: <span>{Math.floor(elapsedTime)}</span> 秒
        </ResultItem>
        
        <ResultItem>
          到達レベル: <span>{level}</span>
        </ResultItem>
        
        <RestartButton onClick={handleRestart}>
          もう一度挑戦
        </RestartButton>
      </ResultContent>
      
      <RankingContainer>
        <RankingTitle>生存者ランキング</RankingTitle>
        <RankingTable>
          <thead>
            <tr>
              <th>順位</th>
              <th>名前</th>
              <th>スコア</th>
              <th>レベル</th>
              <th>時間</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((rank, index) => (
              <tr 
                key={index} 
                className={rank.name === playerName ? 'current-player' : ''}
              >
                <td>{index + 1}</td>
                <td>{rank.name}</td>
                <td>{rank.score}</td>
                <td>{rank.level}</td>
                <td>{rank.time}秒</td>
              </tr>
            ))}
          </tbody>
        </RankingTable>
      </RankingContainer>
    </ResultContainer>
  );
};

export default ResultScreen; 