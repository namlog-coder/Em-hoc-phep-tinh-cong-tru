
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { THEMES } from './constants';
import { GameState, GameData, Difficulty } from './types';
import { speakWithGemini, getEncouragement } from './services/geminiService';
import { Assistant } from './components/Assistant';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [game, setGame] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [isMerged, setIsMerged] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [assistantMsg, setAssistantMsg] = useState('Chào bé! Tớ là người bạn toán học của cậu!');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const teachingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxRange = difficulty === 'easy' ? 5 : difficulty === 'moderate' ? 10 : 20;

  const generateOptions = useCallback((correctSum: number) => {
    const opts = [correctSum];
    while (opts.length < 3) {
      // Ensure range of options is appropriate for the level
      const spread = difficulty === 'easy' ? 2 : 4;
      const rand = Math.floor(Math.random() * (spread * 2 + 1)) + (correctSum - spread);
      const validRand = Math.max(1, Math.min(maxRange + 2, rand));
      if (!opts.includes(validRand)) opts.push(validRand);
    }
    setOptions(opts.sort(() => Math.random() - 0.5));
  }, [difficulty, maxRange]);

  const initGame = useCallback(() => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const sum = Math.floor(Math.random() * (maxRange - 2 + 1)) + 2;
    const n1 = Math.floor(Math.random() * (sum - 1)) + 1;
    const n2 = sum - n1;

    setGame({ num1: n1, num2: n2, sum, theme });
    setGameState(GameState.PLAYING);
    setIsMerged(false);
    setWrongCount(0);
    setHighlightIdx(null);
    setSelectedAnswer(null);
    generateOptions(sum);

    setTimeout(() => setIsMerged(true), 1500);
  }, [maxRange, generateOptions]);

  const handleStartPlaying = () => {
    initGame();
    speakWithGemini("Chào mừng bé đến với trò chơi Em học phép cộng! Cùng chơi nhé!");
  };

  const handleSelectAnswer = (val: number) => {
    if (gameState !== GameState.PLAYING) return;
    setSelectedAnswer(val);
    speakWithGemini(val.toString());
  };

  const handleCheckResult = async () => {
    if (gameState !== GameState.PLAYING || selectedAnswer === null || !game) return;

    if (selectedAnswer === game.sum) {
      setGameState(GameState.SUCCESS);
      setCorrectStreak(prev => prev + 1);
      
      const encouragement = await getEncouragement(true);
      const mathFeedback = `${encouragement}. ${game.num1} cộng ${game.num2} bằng ${game.sum}, quá chính xác!`;
      
      setAssistantMsg(mathFeedback);
      speakWithGemini(mathFeedback);

      // Level up suggestion
      if (correctStreak + 1 >= 3 && difficulty !== 'hard') {
        setTimeout(() => {
          setAssistantMsg("Bé đã làm đúng 3 câu liên tiếp rồi! Mình thử mức độ khó hơn nhé?");
          speakWithGemini("Bé đã làm đúng 3 câu liên tiếp rồi! Mình thử mức độ khó hơn nhé?");
        }, 3000);
      }
    } else {
      setWrongCount(prev => prev + 1);
      setCorrectStreak(0);
      const msg = await getEncouragement(false);
      setAssistantMsg(msg);
      speakWithGemini(msg);
      setSelectedAnswer(null);

      if (wrongCount + 1 >= 2) {
        startTeachingMode();
      }
    }
  };

  const nextLevel = () => {
    if (difficulty === 'easy') setDifficulty('moderate');
    else if (difficulty === 'moderate') setDifficulty('hard');
    setCorrectStreak(0);
    initGame();
  };

  const startTeachingMode = async () => {
    setGameState(GameState.TEACHING);
    setAssistantMsg("Đừng lo, cùng đếm với tớ nào!");
    speakWithGemini("Đừng lo, cùng đếm với tớ nào!");

    const total = (game?.num1 || 0) + (game?.num2 || 0);
    let current = 0;

    const runStep = () => {
      if (current >= total) {
        setGameState(GameState.PLAYING);
        setHighlightIdx(null);
        setAssistantMsg("Vậy tất cả có bao nhiêu nhỉ?");
        speakWithGemini("Vậy tất cả có bao nhiêu nhỉ?");
        return;
      }

      setHighlightIdx(current);
      speakWithGemini((current + 1).toString());
      current++;
      teachingTimerRef.current = setTimeout(runStep, 1500);
    };

    setTimeout(runStep, 1000);
  };

  // Welcome Screen
  if (gameState === GameState.IDLE) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 via-pink-100 to-indigo-100 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl animate-bounce opacity-40 select-none">✏️</div>
        <div className="absolute top-20 right-20 text-7xl animate-pulse opacity-40 select-none">🎨</div>
        <div className="absolute bottom-40 left-20 text-6xl animate-bounce opacity-40 select-none">📐</div>
        <div className="absolute bottom-20 right-10 text-8xl animate-pulse opacity-40 select-none">🧸</div>
        
        <div className="text-center z-10 px-6">
          <h2 className="text-4xl md:text-6xl font-hand text-pink-500 mb-2 animate-fade-in">Bé học toán</h2>
          <h1 className="text-6xl md:text-9xl font-black text-indigo-700 drop-shadow-lg mb-10 tracking-tight animate-bounce-subtle">
            Em học <br className="md:hidden" /> phép cộng
          </h1>
          
          <button 
            onClick={handleStartPlaying}
            className="group relative inline-flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity animate-pulse"></div>
            <span className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-3xl md:text-5xl font-black px-12 py-6 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
              Bắt đầu chơi 🚀
            </span>
          </button>
        </div>

        <div className="absolute bottom-8 text-center w-full">
          <p className="text-indigo-900 font-bold text-lg md:text-xl bg-white/40 backdrop-blur-sm px-6 py-2 rounded-full inline-block">
            Tên nhà phát triển: <span className="text-pink-600">Nguyễn Nhật Quỳnh</span> - Trường Tiểu học Kim Đồng
          </p>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className={`fixed inset-0 transition-colors duration-700 flex flex-col ${game.theme.bg}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="bg-white/70 backdrop-blur-md p-3 rounded-2xl hover:bg-white transition-all shadow-lg text-2xl"
          >
            ⚙️
          </button>
          <button 
            onClick={() => setGameState(GameState.IDLE)}
            className="bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl hover:bg-white transition-all shadow-lg font-black text-indigo-700"
          >
            🏠 Home
          </button>
        </div>

        {/* Level Selector */}
        <div className="bg-white/70 backdrop-blur-md p-2 rounded-3xl shadow-lg flex gap-2">
          {(['easy', 'moderate', 'hard'] as Difficulty[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => { setDifficulty(lvl); initGame(); }}
              className={`px-4 py-2 rounded-2xl font-black text-sm transition-all ${difficulty === lvl ? 'bg-indigo-600 text-white shadow-inner' : 'text-indigo-400 hover:bg-white'}`}
            >
              {lvl === 'easy' ? 'Dễ' : lvl === 'moderate' ? 'Hơi Khó' : 'Khó'}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 bg-yellow-400 text-white px-5 py-3 rounded-2xl shadow-lg font-black">
          🔥 Chuỗi: {correctStreak}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
            <h2 className="text-3xl font-black text-indigo-600 mb-6">Cài đặt</h2>
            <div className="space-y-4">
              <button onClick={() => { setDifficulty('easy'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>Mức độ Dễ (Phạm vi 5)</button>
              <button onClick={() => { setDifficulty('moderate'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'moderate' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Mức độ Hơi Khó (Phạm vi 10)</button>
              <button onClick={() => { setDifficulty('hard'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>Mức độ Khó (Phạm vi 20)</button>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-8 text-gray-400 font-bold underline">Đóng</button>
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 relative">
        {gameState === GameState.SUCCESS && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
             <div className="text-9xl animate-ping opacity-20">🎉</div>
          </div>
        )}

        <div className={`flex items-center justify-center gap-6 md:gap-12 transition-all duration-1000 ${isMerged ? 'translate-x-0' : ''}`}>
          <div className={`
            ${game.theme.boxBg} border-4 ${game.theme.boxBorder} rounded-[40px] p-6 min-w-[140px] min-h-[140px] max-w-sm
            flex flex-wrap items-center justify-center gap-2 transition-all duration-1000 border-dashed
            ${isMerged ? 'translate-x-4 md:translate-x-8 z-20 shadow-2xl scale-105' : '-translate-x-12'}
          `}>
            {Array.from({ length: game.num1 }).map((_, i) => (
              <span key={i} className={`text-6xl transition-all duration-300 ${highlightIdx === i ? 'scale-150 drop-shadow-[0_0_15px_yellow]' : 'scale-100'}`}>
                {game.theme.emoji}
              </span>
            ))}
          </div>

          <div className={`
            ${game.theme.boxBg} border-4 ${game.theme.boxBorder} rounded-[40px] p-6 min-w-[140px] min-h-[140px] max-w-sm
            flex flex-wrap items-center justify-center gap-2 transition-all duration-1000 border-dashed
            ${isMerged ? '-translate-x-4 md:translate-x-8 z-10 shadow-2xl scale-105' : 'translate-x-12'}
          `}>
            {Array.from({ length: game.num2 }).map((_, i) => (
              <span key={i} className={`text-6xl transition-all duration-300 ${highlightIdx === (game.num1 + i) ? 'scale-150 drop-shadow-[0_0_15px_yellow]' : 'scale-100'}`}>
                {game.theme.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Calculation */}
        <div className={`mt-10 md:mt-16 py-6 px-12 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl flex items-center gap-6 text-6xl md:text-8xl font-black ${game.theme.textColor}`}>
          <span>{game.num1}</span>
          <span className="text-indigo-400 opacity-60">+</span>
          <span>{game.num2}</span>
          <span className="text-indigo-400 opacity-60">=</span>
          <span className={`transition-all duration-500 min-w-[1ch] text-center ${gameState === GameState.SUCCESS ? 'text-green-500 scale-110 drop-shadow-md' : 'text-indigo-500'}`}>
            {gameState === GameState.SUCCESS ? game.sum : (selectedAnswer ?? '?')}
          </span>
        </div>
      </div>

      {/* Interaction Area */}
      <div className="bg-white/90 backdrop-blur-xl p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] flex flex-col items-center gap-6 z-30 rounded-t-[50px]">
        {gameState === GameState.SUCCESS ? (
          <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-500">
            <h3 className="text-2xl md:text-3xl font-black text-green-600 mb-2">Đúng rồi! 🎉 Bé quá tuyệt vời!</h3>
            <div className="flex gap-4">
               <button
                onClick={initGame}
                className="bg-green-500 text-white px-16 py-6 rounded-full text-3xl md:text-5xl font-black shadow-2xl border-b-[10px] border-green-700 hover:scale-105 active:border-b-0 active:translate-y-2 transition-all"
              >
                Tiếp tục 🚀
              </button>
              {correctStreak >= 3 && difficulty !== 'hard' && (
                <button
                  onClick={nextLevel}
                  className="bg-indigo-600 text-white px-10 py-6 rounded-full text-3xl md:text-4xl font-black shadow-2xl border-b-[10px] border-indigo-800 hover:scale-105 active:border-b-0 active:translate-y-2 transition-all flex items-center gap-3"
                >
                  Khó hơn nào! 📈
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center items-center gap-4 md:gap-8">
              {options.map((opt, i) => (
                <button
                  key={i}
                  disabled={gameState === GameState.TEACHING}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`
                    w-20 h-20 md:w-32 md:h-32 rounded-[30px] text-4xl md:text-6xl font-black shadow-xl border-b-[8px] active:border-b-0 active:translate-y-2 transition-all
                    ${gameState === GameState.TEACHING ? 'opacity-30' : 'hover:scale-105'}
                    ${selectedAnswer === opt ? 'bg-yellow-400 border-yellow-600 text-white scale-110' : 'bg-white border-indigo-100 text-indigo-700'}
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckResult}
              disabled={gameState !== GameState.PLAYING || selectedAnswer === null}
              className={`
                group relative px-16 py-6 md:px-28 md:py-8 rounded-full text-3xl md:text-5xl font-black shadow-2xl transition-all border-b-[10px] active:border-b-0 active:translate-y-2
                ${(gameState !== GameState.PLAYING || selectedAnswer === null) 
                  ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 border-emerald-700 text-white hover:scale-105'}
              `}
            >
              Kiểm tra kết quả ✅
            </button>
          </>
        )}
      </div>

      <Assistant message={assistantMsg} />
    </div>
  );
};

export default App;
