import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';

// ゲーム状態の型定義
export interface GameState {
  playerName: string;
  level: number;
  score: number;
  time: number;
  collectedCodes: string[];
  cubeRotation: { x: number; y: number; z: number };
  gameActive: boolean;
  startTime: number;
  elapsedTime: number;
  currentScreen: 'start' | 'game' | 'result';
  showLevelModal: boolean;
  isGameSuccess: boolean;
}

// キューブシンボル
export const levelSymbols = [
  // レベル1
  { front: '温', back: '死', right: '湯', left: '命', top: '泉', bottom: '罠' },
  // レベル2
  { front: '闇', back: '忍', right: '宿', left: '鬼', top: '殺', bottom: '落' },
  // レベル3
  { front: '業', back: '怨', right: '霧', left: '縛', top: '惨', bottom: '骸' },
  // レベル4
  { front: '絶', back: '滅', right: '呪', left: '断', top: '焦', bottom: '血' },
  // レベル5
  { front: '獄', back: '冥', right: '崩', left: '闘', top: '壊', bottom: '終' }
];

// コード（レベルごとに変わる）
export const levelCodes = [
  ['7', '3', '9', '2'],
  ['A', '4', 'F', '1'],
  ['B', '5', 'D', '8'],
  ['E', '0', '6', 'C'],
  ['死', '命', '罠', '生']
];

// ランキングデータ
export const initialRankings = [
  { name: 'たろう', score: 5240, level: 5, time: 243 },
  { name: 'はなこ', score: 4120, level: 4, time: 198 },
  { name: 'ゆうた', score: 3600, level: 3, time: 176 },
  { name: 'まりこ', score: 2800, level: 3, time: 203 },
  { name: 'けんた', score: 2200, level: 2, time: 154 },
  { name: 'あきら', score: 1950, level: 2, time: 167 },
  { name: 'さとし', score: 1500, level: 2, time: 189 },
  { name: 'みさき', score: 1200, level: 1, time: 132 },
  { name: 'ようこ', score: 980, level: 1, time: 145 },
  { name: 'かずき', score: 750, level: 1, time: 156 }
];

// 初期状態
const initialState: GameState = {
  playerName: '',
  level: 1,
  score: 0,
  time: 60,
  collectedCodes: [],
  cubeRotation: { x: -15, y: 15, z: 0 },
  gameActive: false,
  startTime: 0,
  elapsedTime: 0,
  currentScreen: 'start',
  showLevelModal: false,
  isGameSuccess: false
};

// アクションの型
type GameAction = 
  | { type: 'START_GAME', payload: { playerName: string } }
  | { type: 'COLLECT_CODE', payload: { code: string } }
  | { type: 'ROTATE_CUBE', payload: { direction: string } }
  | { type: 'UPDATE_TIME', payload: { time: number } }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'GAME_OVER', payload: { success: boolean } }
  | { type: 'RESTART_GAME' }
  | { type: 'CLOSE_LEVEL_MODAL' };

// リデューサー
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        playerName: action.payload.playerName,
        gameActive: true,
        startTime: Date.now(),
        currentScreen: 'game'
      };

    case 'COLLECT_CODE':
      return {
        ...state,
        collectedCodes: [...state.collectedCodes, action.payload.code],
        score: state.score + 100
      };

    case 'ROTATE_CUBE':
      const { direction } = action.payload;
      const { x, y, z } = state.cubeRotation;
      
      let newRotation = { ...state.cubeRotation };
      
      switch (direction) {
        case 'rotate-x':
          newRotation.x = (x + 90) % 360;
          break;
        case 'rotate-y':
          newRotation.y = (y + 90) % 360;
          break;
        case 'rotate-z':
          newRotation.z = (z + 90) % 360;
          break;
        case 'left':
          newRotation.y = (y - 90) % 360;
          break;
        case 'right':
          newRotation.y = (y + 90) % 360;
          break;
        case 'up':
          newRotation.x = (x - 90) % 360;
          break;
        case 'down':
          newRotation.x = (x + 90) % 360;
          break;
      }
      
      return {
        ...state,
        cubeRotation: newRotation
      };

    case 'UPDATE_TIME':
      return {
        ...state,
        time: action.payload.time
      };

    case 'LEVEL_COMPLETE':
      return {
        ...state,
        showLevelModal: true,
        score: state.score + state.time * 10, // 残り時間ボーナス
      };

    case 'NEXT_LEVEL':
      const nextLevel = state.level + 1;
      const isGameComplete = nextLevel > 5;
      
      return {
        ...state,
        level: nextLevel,
        time: 60 - (nextLevel - 1) * 5, // レベルが上がるごとに制限時間が減少
        collectedCodes: [],
        showLevelModal: false,
        currentScreen: isGameComplete ? 'result' : 'game',
        isGameSuccess: isGameComplete ? true : state.isGameSuccess,
        gameActive: !isGameComplete,
        elapsedTime: isGameComplete ? (Date.now() - state.startTime) / 1000 : state.elapsedTime
      };

    case 'CLOSE_LEVEL_MODAL':
      return {
        ...state,
        showLevelModal: false
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameActive: false,
        currentScreen: 'result',
        isGameSuccess: action.payload.success,
        elapsedTime: (Date.now() - state.startTime) / 1000
      };

    case 'RESTART_GAME':
      return {
        ...initialState,
        currentScreen: 'start'
      };

    default:
      return state;
  }
};

// コンテキスト作成
type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  rankings: typeof initialRankings;
  setRankings: React.Dispatch<React.SetStateAction<typeof initialRankings>>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [rankings, setRankings] = useState(initialRankings);

  // タイマー効果
  useEffect(() => {
    let timerInterval: number | null = null;
    
    if (state.gameActive) {
      timerInterval = window.setInterval(() => {
        dispatch({ type: 'UPDATE_TIME', payload: { time: state.time - 1 } });
        
        if (state.time <= 1) {
          // 時間切れでゲームオーバー
          if (timerInterval) clearInterval(timerInterval);
          dispatch({ type: 'GAME_OVER', payload: { success: false } });
        }
      }, 1000);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [state.gameActive, state.time]);

  return (
    <GameContext.Provider value={{ state, dispatch, rankings, setRankings }}>
      {children}
    </GameContext.Provider>
  );
};

// カスタムフック
export const useGameState = () => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  
  return context;
}; 