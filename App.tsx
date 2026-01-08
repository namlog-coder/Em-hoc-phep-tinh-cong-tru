
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { THEMES } from './constants.ts';
import { GameState, GameData, Difficulty, QuestionType } from './types.ts';
import { Assistant } from './components/Assistant.tsx';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [game, setGame] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [isMerged, setIsMerged] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [assistantMsg, setAssistantMsg] = useState('Chào bé! Cùng học toán với tớ nhé! 👋');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const teachingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const maxRange = difficulty === 'easy' ? 5 : difficulty === 'moderate' ? 8 : 10;

  // Hàm tạo âm thanh SFX đơn giản bằng Web Audio API
  const playSFX = (type: 'success' | 'fail' | 'click') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  };

  const getTargetValue = (g: GameData) => {
    if (g.questionType === 'find_num1') return g.num1;
    if (g.questionType === 'find_num2') return g.num2;
    return g.sum;
  };

  const generateOptions = useCallback((targetValue: number) => {
    const opts = new Set<number>();
    opts.add(targetValue);
    const searchRange = Math.max(maxRange, 5);
    let safetyCounter = 0;
    while (opts.size < 3 && safetyCounter < 50) {
      safetyCounter++;
      const rand = Math.floor(Math.random() * searchRange) + 1;
      opts.add(rand);
    }
    const finalArray = Array.from(opts);
    while (finalArray.length < 3) {
      for (let i = 1; i <= searchRange; i++) {
        if (!finalArray.includes(i)) {
          finalArray.push(i);
          if (finalArray.length === 3) break;
        }
      }
    }
    setOptions(finalArray.sort(() => Math.random() - 0.5));
  }, [maxRange]);

  const initGame = useCallback(() => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const sum = Math.floor(Math.random() * (maxRange - 2 + 1)) + 2;
    const n1 = Math.floor(Math.random() * (sum - 1)) + 1;
    const n2 = sum - n1;

    const questionTypes: QuestionType[] = ['find_sum', 'find_num1', 'find_num2'];
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    const newGame: GameData = { num1: n1, num2: n2, sum, theme, questionType };
    setGame(newGame);
    setGameState(GameState.PLAYING);
    setIsMerged(false);
    setWrongCount(0);
    setHighlightIdx(null);
    setSelectedAnswer(null);
    
    generateOptions(getTargetValue(newGame));

    setTimeout(() => setIsMerged(true), 1500);

    let msg = "";
    if (questionType === 'find_sum') msg = `🤔 ${n1} + ${n2} = ?`;
    else if (questionType === 'find_num1') msg = `🤔 ? + ${n2} = ${sum}`;
    else msg = `🤔 ${n1} + ? = ${sum}`;
    setAssistantMsg(msg);
  }, [maxRange, generateOptions]);

  const handleStartPlaying = () => {
    playSFX('click');
    initGame();
  };

  const handleSelectAnswer = (val: number) => {
    if (gameState !== GameState.PLAYING) return;
    playSFX('click');
    setSelectedAnswer(val);
  };

  const handleCheckResult = async () => {
    if (gameState !== GameState.PLAYING || selectedAnswer === null || !game) return;

    const targetValue = getTargetValue(game);

    if (selectedAnswer === targetValue) {
      playSFX('success');
      setGameState(GameState.SUCCESS);
      setCorrectStreak(prev => prev + 1);
      setAssistantMsg("🌟 Tuyệt vời! Bé làm đúng rồi! ✅");
    } else {
      playSFX('fail');
      setWrongCount(prev => prev + 1);
      setCorrectStreak(0);
      setAssistantMsg("❌ Sai mất rồi, bé thử lại nhé! 💡");
      setSelectedAnswer(null);

      if (wrongCount + 1 >= 2) {
        startTeachingMode();
      }
    }
  };

  const nextLevel = () => {
    playSFX('click');
    if (difficulty === 'easy') setDifficulty('moderate');
    else if (difficulty === 'moderate') setDifficulty('hard');
    setCorrectStreak(0);
    initGame();
  };

  const startTeachingMode = () => {
    setGameState(GameState.TEACHING);
    setAssistantMsg("Cùng đếm để tìm kết quả nhé! 🍎");

    const total = (game?.num1 || 0) + (game?.num2 || 0);
    let current = 0;

    const runStep = () => {
      if (current >= total) {
        setGameState(GameState.PLAYING);
        setHighlightIdx(null);
        setAssistantMsg("Bé hãy đếm và chọn lại nhé! 🔢");
        return;
      }
      setHighlightIdx(current);
      current++;
      teachingTimerRef.current = setTimeout(runStep, 800);
    };

    setTimeout(runStep, 500);
  };

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
            Phát triển bởi: <span className="text-pink-600">Nguyễn Nhật Quỳnh</span> - TH Kim Đồng
          </p>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className={`fixed inset-0 transition-colors duration-700 flex flex-col ${game.theme.bg}`}>
      <div className="p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { playSFX('click'); setShowSettings(true); }}
            className="bg-white/70 backdrop-blur-md p-3 rounded-2xl hover:bg-white transition-all shadow-lg text-2xl"
          >
            ⚙️
          </button>
          <button 
            onClick={() => { playSFX('click'); setGameState(GameState.IDLE); }}
            className="bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl hover:bg-white transition-all shadow-lg font-black text-indigo-700"
          >
            🏠 Home
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-2 rounded-3xl shadow-lg flex gap-2">
          {(['easy', 'moderate', 'hard'] as Difficulty[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => { playSFX('click'); setDifficulty(lvl); initGame(); }}
              className={`px-4 py-2 rounded-2xl font-black text-sm transition-all ${difficulty === lvl ? 'bg-indigo-600 text-white shadow-inner' : 'text-indigo-400 hover:bg-white'}`}
            >
              {lvl === 'easy' ? 'Dễ' : lvl === 'moderate' ? 'Vừa' : 'Khó'}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 bg-yellow-400 text-white px-5 py-3 rounded-2xl shadow-lg font-black">
          🔥 Chuỗi: {correctStreak}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
            <h2 className="text-3xl font-black text-indigo-600 mb-6">Chọn mức độ</h2>
            <div className="space-y-4">
              <button onClick={() => { playSFX('click'); setDifficulty('easy'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>Mức độ Dễ (Trong phạm vi 5)</button>
              <button onClick={() => { playSFX('click'); setDifficulty('moderate'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'moderate' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Mức độ Vừa (Trong phạm vi 8)</button>
              <button onClick={() => { playSFX('click'); setDifficulty('hard'); setShowSettings(false); initGame(); }} className={`w-full p-4 rounded-2xl font-bold text-xl ${difficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>Mức độ Khó (Trong phạm vi 10)</button>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-8 text-gray-400 font-bold underline">Đóng</button>
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-center px-4 relative">
        {gameState === GameState.SUCCESS && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
             <div className="text-[200px] animate-bounce opacity-20">🎉</div>
          </div>
        )}

        <div className={`flex items-center justify-center gap-6 md:gap-12 transition-all duration-1000 ${isMerged ? 'translate-x-0' : ''}`}>
          <div className={`
            ${game.theme.boxBg} border-4 ${game.theme.boxBorder} rounded-[40px] p-6 min-w-[140px] min-h-[140px] max-w-sm
            flex flex-wrap items-center justify-center gap-2 transition-all duration-1000 border-dashed
            ${isMerged ? 'translate-x-4 md:translate-x-8 z-20 shadow-2xl scale-105' : '-translate-x-12'}
          `}>
            {Array.from({ length: game.num1 }).map((_, i) => (
              <span key={i} className={`text-6xl transition-all duration-300 ${highlightIdx === i ? 'scale-150 drop-shadow-[0_0_15px_yellow]' : 'scale-100 opacity-100'}`}>
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
              <span key={i} className={`text-6xl transition-all duration-300 ${highlightIdx === (game.num1 + i) ? 'scale-150 drop-shadow-[0_0_15px_yellow]' : 'scale-100 opacity-100'}`}>
                {game.theme.emoji}
              </span>
            ))}
          </div>
        </div>

        <div className={`mt-10 md:mt-16 py-6 px-12 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl flex items-center gap-6 text-6xl md:text-8xl font-black ${game.theme.textColor}`}>
          <span className={`${game.questionType === 'find_num1' ? 'text-indigo-500 min-w-[1.5ch] text-center border-b-8 border-indigo-200' : ''}`}>
            {game.questionType === 'find_num1' 
              ? (gameState === GameState.SUCCESS ? game.num1 : (selectedAnswer ?? '?')) 
              : game.num1}
          </span>
          <span className="text-indigo-400 opacity-60">+</span>
          <span className={`${game.questionType === 'find_num2' ? 'text-indigo-500 min-w-[1.5ch] text-center border-b-8 border-indigo-200' : ''}`}>
            {game.questionType === 'find_num2' 
              ? (gameState === GameState.SUCCESS ? game.num2 : (selectedAnswer ?? '?')) 
              : game.num2}
          </span>
          <span className="text-indigo-400 opacity-60">=</span>
          <span className={`${game.questionType === 'find_sum' ? 'text-indigo-500 min-w-[1.5ch] text-center border-b-8 border-indigo-200' : ''}`}>
            {game.questionType === 'find_sum' 
              ? (gameState === GameState.SUCCESS ? game.sum : (selectedAnswer ?? '?')) 
              : game.sum}
          </span>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] flex flex-col items-center gap-6 z-30 rounded-t-[50px]">
        {gameState === GameState.SUCCESS ? (
          <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-500">
            <h3 className="text-2xl md:text-3xl font-black text-green-600 mb-2">Chính xác! 🎊 Bé giỏi lắm! ✅</h3>
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
                  Khó hơn! 📈
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
              Kiểm tra ✅
            </button>
          </>
        )}
      </div>

      <Assistant message={assistantMsg} />
    </div>
  );
};

export default App;
