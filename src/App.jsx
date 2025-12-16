import React, { useState, useEffect, useRef } from 'react';

// --- DATA & CONSTANTS ---
const quizData = {
  Math: [
    { question: "What is 15 × 8?", options: ["120","115","125","130"], correct: 0 },
    { question: "What is the square root of 144?", options: ["10","11","12","13"], correct: 2 },
    { question: "What is 25% of 200?", options: ["40","50","60","75"], correct: 1 },
    { question: "What is 7³ (7 cubed)?", options: ["243","343","423","543"], correct: 1 },
    { question: "What is 180 ÷ 12?", options: ["13","14","15","16"], correct: 2 },
    { question: "Perimeter of square with side 9cm?", options: ["27cm","36cm","45cm","81cm"], correct: 1 },
    { question: "What is 3/4 as a decimal?", options: ["0.25","0.5","0.75","1.0"], correct: 2 },
    { question: "What is 2⁵?", options: ["16","32","64","128"], correct: 1 },
    { question: "What is 15% of 80?", options: ["10","11","12","13"], correct: 2 },
    { question: "Area of circle radius 5 (π≈3.14)?", options: ["15.7","31.4","78.5","157"], correct: 2 }
  ],
  English: [
    { question: "Which word is a synonym for 'happy'?", options: ["Sad","Joyful","Angry","Tired"], correct: 1 },
    { question: "What is the past tense of 'run'?", options: ["Runned","Ran","Running","Runs"], correct: 1 },
    { question: "Which is the correct spelling?", options: ["Recieve","Receive","Receeve","Recive"], correct: 1 },
    { question: "What type of word is 'quickly'?", options: ["Noun","Verb","Adjective","Adverb"], correct: 3 },
    { question: "Which sentence is grammatically correct?", options: ["She don't like it","She doesn't likes it","She doesn't like it","She not like it"], correct: 2 },
    { question: "What is the plural of 'child'?", options: ["Childs","Children","Childes","Childrens"], correct: 1 },
    { question: "Antonym for 'difficult'?", options: ["Hard","Easy","Complex","Tough"], correct: 1 },
    { question: "A group of words with a subject and predicate is a?", options: ["Phrase","Clause","Word","Letter"], correct: 1 },
    { question: "Which is a proper noun?", options: ["city","London","building","person"], correct: 1 },
    { question: "What punctuation mark ends a question?", options: ["Period","Comma","Question mark","Exclamation point"], correct: 2 }
  ],
  ICT: [
    { question: "What does CPU stand for?", options: ["Central Processing Unit","Computer Personal Unit","Central Program Utility","Control Processing Unit"], correct: 0 },
    { question: "Which is an input device?", options: ["Monitor","Printer","Keyboard","Speaker"], correct: 2 },
    { question: "What does RAM stand for?", options: ["Read Access Memory","Random Access Memory","Rapid Access Memory","Real Access Memory"], correct: 1 },
    { question: "Which is a web browser?", options: ["Microsoft Word","Google Chrome","Adobe Photoshop","Windows"], correct: 1 },
    { question: "What does URL stand for?", options: ["Universal Resource Locator","Uniform Resource Locator","Universal Reference Link","Uniform Reference Locator"], correct: 1 },
    { question: "Which file extension is for images?", options: [".txt",".mp3",".jpg",".exe"], correct: 2 },
    { question: "Main circuit board in a computer?", options: ["RAM","Motherboard","Hard Drive","CPU"], correct: 1 },
    { question: "Which key combination copies text?", options: ["Ctrl+V","Ctrl+C","Ctrl+X","Ctrl+Z"], correct: 1 },
    { question: "What does HTML stand for?", options: ["High Tech Markup Language","HyperText Markup Language","Home Tool Markup Language","Hyperlinks and Text Markup Language"], correct: 1 },
    { question: "Which is an output device?", options: ["Mouse","Scanner","Monitor","Microphone"], correct: 2 }
  ],
  Science: [
    { question: "Chemical symbol for water?", options: ["H2O","CO2","O2","H2"], correct: 0 },
    { question: "How many planets in our solar system?", options: ["7","8","9","10"], correct: 1 },
    { question: "Center of an atom is called?", options: ["Electron","Proton","Nucleus","Neutron"], correct: 2 },
    { question: "Gas plants absorb?", options: ["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], correct: 2 },
    { question: "Speed of light?", options: ["300,000 km/s","150,000 km/s","450,000 km/s","600,000 km/s"], correct: 0 },
    { question: "Largest organ in human body?", options: ["Heart","Brain","Liver","Skin"], correct: 3 },
    { question: "Boiling point of water (°C)?", options: ["90°C","95°C","100°C","105°C"], correct: 2 },
    { question: "Which planet is the Red Planet?", options: ["Venus","Mars","Jupiter","Saturn"], correct: 1 },
    { question: "Chemical symbol for gold?", options: ["Go","Gd","Au","Ag"], correct: 2 },
    { question: "How many bones in adult human body?", options: ["186","206","226","246"], correct: 1 }
  ],
  History: [
    { question: "In which year did World War II end?", options: ["1943","1944","1945","1946"], correct: 2 },
    { question: "Who was the first President of the United States?", options: ["Thomas Jefferson","George Washington","John Adams","Benjamin Franklin"], correct: 1 },
    { question: "Which ancient wonder is still standing?", options: ["Colossus of Rhodes","Hanging Gardens","Great Pyramid of Giza","Lighthouse of Alexandria"], correct: 2 },
    { question: "In which year did the Titanic sink?", options: ["1910","1911","1912","1913"], correct: 2 },
    { question: "Who painted the Mona Lisa?", options: ["Michelangelo","Leonardo da Vinci","Raphael","Donatello"], correct: 1 },
    { question: "Which empire built Machu Picchu?", options: ["Aztec","Maya","Inca","Olmec"], correct: 2 },
    { question: "In which year did man first land on the moon?", options: ["1967","1968","1969","1970"], correct: 2 },
    { question: "Who invented the telephone?", options: ["Thomas Edison","Nikola Tesla","Alexander Graham Bell","Benjamin Franklin"], correct: 2 },
    { question: "First city attacked with an atomic bomb?", options: ["Tokyo","Nagasaki","Hiroshima","Kyoto"], correct: 2 },
    { question: "Who was known as the Iron Lady?", options: ["Angela Merkel","Margaret Thatcher","Indira Gandhi","Golda Meir"], correct: 1 }
  ]
};

const PRIMARY = '#3b82f6';
const SECONDARY = '#64748b';
const TIMER_DURATION = 30;

export default function QuizApp() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const timerRef = useRef(null);

  // --- STORAGE & INIT ---

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (screen === 'quiz' && !showFeedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAnswer(-1); // Time's up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [screen, currentQuestionIndex, showFeedback]);

  // Changed to standard localStorage
  function loadData() {
    try {
      const lbData = localStorage.getItem('quiz_leaderboard');
      if (lbData) setLeaderboard(JSON.parse(lbData));

      const psData = localStorage.getItem('quiz_player_stats');
      if (psData) setPlayerStats(JSON.parse(psData));
    } catch (e) {
      console.log('Error loading data', e);
    }
  }

  function saveData(newLeaderboard, newStats) {
    try {
      localStorage.setItem('quiz_leaderboard', JSON.stringify(newLeaderboard));
      localStorage.setItem('quiz_player_stats', JSON.stringify(newStats));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // --- ACTIONS ---

  function handleStartQuiz() {
    if (!playerName.trim()) {
      setNameError(true);
      return;
    }
    setScreen('category');
    setNameError(false);
  }

  function handleCategorySelect(category) {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStartTime(Date.now());
    setTimeLeft(TIMER_DURATION);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScreen('quiz');
  }

  function handleAnswer(answerIndex) {
    if (showFeedback) return;
    
    clearInterval(timerRef.current);
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const questions = quizData[selectedCategory];
    const currentQ = questions[currentQuestionIndex];
    // -1 checks for timeout
    const isCorrect = answerIndex !== -1 && answerIndex === currentQ.correct;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex + 1 >= questions.length) {
        setScreen('results');
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(TIMER_DURATION);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 1200);
  }

  function saveScoreAndShowLeaderboard() {
    const questions = quizData[selectedCategory];
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const timestamp = new Date().toISOString();
    const percentage = Math.round((score / questions.length) * 100);
    
    const entry = {
      id: Date.now().toString(),
      player: playerName,
      category: selectedCategory,
      score: score,
      total: questions.length,
      time: timeTaken,
      timestamp: timestamp,
      percentage: percentage
    };

    const newLeaderboard = [...leaderboard, entry];
    // Sort by Score (desc), then Time (asc)
    newLeaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });
    
    const trimmed = newLeaderboard.slice(0, 100);

    // Update player stats
    const newStats = { ...playerStats };
    if (!newStats[playerName]) {
      newStats[playerName] = {
        totalGames: 0,
        totalScore: 0,
        totalPossible: 0,
        bestScore: 0,
        averageTime: 0,
        totalTime: 0,
        categories: {},
        history: [],
        firstPlayed: timestamp
      };
    }

    const stats = newStats[playerName];
    stats.totalGames += 1;
    stats.totalScore += score;
    stats.totalPossible += questions.length;
    stats.bestScore = Math.max(stats.bestScore, percentage);
    stats.totalTime += timeTaken;
    stats.averageTime = Math.round(stats.totalTime / stats.totalGames);
    
    if (!stats.categories[selectedCategory]) {
      stats.categories[selectedCategory] = {
        games: 0,
        totalScore: 0,
        totalPossible: 0,
        bestScore: 0,
        averageTime: 0,
        totalTime: 0
      };
    }
    
    const catStats = stats.categories[selectedCategory];
    catStats.games += 1;
    catStats.totalScore += score;
    catStats.totalPossible += questions.length;
    catStats.bestScore = Math.max(catStats.bestScore, percentage);
    catStats.totalTime += timeTaken;
    catStats.averageTime = Math.round(catStats.totalTime / catStats.games);
    
    stats.history.unshift(entry);
    if (stats.history.length > 50) stats.history = stats.history.slice(0, 50);

    setLeaderboard(trimmed);
    setPlayerStats(newStats);
    saveData(trimmed, newStats);
    setScreen('leaderboard');
  }

  function resetToCategory() {
    setCurrentQuestionIndex(0);
    setScore(0);
    setStartTime(null);
    setTimeLeft(TIMER_DURATION);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScreen('category');
  }

  function viewPlayerProfile(player) {
    setSelectedPlayer(player);
    setScreen('player-profile');
  }

  // --- HELPERS ---
  
  // Calculate players array from stats object
  const playersList = Object.entries(playerStats).map(([name, stats]) => ({
    name,
    ...stats
  }));

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateShort(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // --- RENDER ---

  // 1. HOME
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Quiz & Reviewer</h1>
          <p className="text-slate-600 mb-6">Test your knowledge across multiple subjects!</p>

          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">Enter Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setNameError(false); }}
                placeholder="Your name"
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500 ${nameError ? 'border-red-500' : 'border-slate-300'}`}
              />
              {nameError && <p className="text-red-500 text-sm mt-1">Please enter your name</p>}
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: PRIMARY }}
            >
              Start Quiz
            </button>

            <button
              onClick={() => setScreen('leaderboard')}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              🏆 View High Scores
            </button>

            <button
              onClick={() => setScreen('players')}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              👥 View All Players
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. CATEGORY SELECT
  if (screen === 'category') {
    const categories = [
      { name: 'Math', icon: '🔢' },
      { name: 'English', icon: '📚' },
      { name: 'ICT', icon: '💻' },
      { name: 'Science', icon: '🔬' },
      { name: 'History', icon: '🏛️' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-2 text-slate-800">Select a Category</h2>
            <p className="text-slate-600 text-center mb-6">Choose a subject, {playerName}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className="p-6 rounded-xl border-2 text-center transition-all hover:scale-105 hover:shadow-lg"
                  style={{ borderColor: SECONDARY }}
                >
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <div className="font-semibold text-slate-800">{cat.name}</div>
                  <div className="text-sm text-slate-500 mt-1">10 questions</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setScreen('home')}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. QUIZ
  if (screen === 'quiz') {
    const questions = quizData[selectedCategory];
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    const timerPercent = Math.max(0, (timeLeft / TIMER_DURATION) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="font-semibold text-slate-700">{selectedCategory}</div>
                <div className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
              </div>

              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke={PRIMARY}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="176"
                    strokeDashoffset={176 - (176 * timerPercent / 100)}
                    style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-800">
                  {timeLeft}
                </div>
              </div>
            </div>

            <div className="mb-4 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: PRIMARY }}
              />
            </div>

            <h3 className="text-xl font-bold mb-6 text-slate-800">{q.question}</h3>

            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let btnClass = "w-full p-4 rounded-lg border-2 text-left font-medium transition-all";
                let btnStyle = { borderColor: SECONDARY };

                if (showFeedback) {
                  if (idx === q.correct) {
                    btnClass += " bg-green-500 text-white border-green-500";
                    btnStyle = {};
                  } else if (idx === selectedAnswer) {
                    btnClass += " bg-red-500 text-white border-red-500";
                    btnStyle = {};
                  }
                } else {
                  btnClass += " hover:-translate-y-1 hover:shadow-lg";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showFeedback}
                    className={btnClass}
                    style={btnStyle}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. RESULTS
  if (screen === 'results') {
    const questions = quizData[selectedCategory];
    const percent = Math.round((score / questions.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    let emoji = '🎉', message = 'Excellent work!';
    if (percent < 50) { emoji = '📚'; message = 'Keep practicing!'; }
    else if (percent < 80) { emoji = '👍'; message = 'Good job!'; }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Quiz Complete!</h2>
            <p className="text-slate-600 mb-6">{message}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border-2 rounded-xl p-4" style={{ borderColor: SECONDARY }}>
                <div className="text-sm text-slate-500 mb-1">Score</div>
                <div className="text-2xl font-bold text-slate-800">{score}/{questions.length}</div>
              </div>
              <div className="border-2 rounded-xl p-4" style={{ borderColor: SECONDARY }}>
                <div className="text-sm text-slate-500 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-slate-800">{percent}%</div>
              </div>
              <div className="border-2 rounded-xl p-4" style={{ borderColor: SECONDARY }}>
                <div className="text-sm text-slate-500 mb-1">Time</div>
                <div className="text-2xl font-bold text-slate-800">{timeTaken}s</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={saveScoreAndShowLeaderboard}
                className="w-full py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: PRIMARY }}
              >
                Save Score & View Leaderboard
              </button>

              <button
                onClick={resetToCategory}
                className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
                style={{ color: SECONDARY, borderColor: SECONDARY }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. LEADERBOARD (Recent high scores)
  if (screen === 'leaderboard') {
    const categoriesList = ['All', 'Math', 'English', 'ICT', 'Science', 'History'];
    const filtered = filterCategory === 'All' 
      ? leaderboard 
      : leaderboard.filter(e => e.category === filterCategory);
    
    // Top 20 scores
    const topScores = filtered.slice(0, 20);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold mb-1 text-slate-800">High Scores</h2>
              <p className="text-slate-600">Top performances by category</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {topScores.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">No scores yet for this category!</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                 {/* Header Row */}
                 <div className="grid grid-cols-4 font-semibold text-slate-500 text-sm px-4 pb-2 border-b">
                    <div className="col-span-1">Player</div>
                    <div className="col-span-1 text-center">Score</div>
                    <div className="col-span-1 text-center">Time</div>
                    <div className="col-span-1 text-right">Date</div>
                 </div>
                {topScores.map((entry, i) => (
                  <div key={i} className="grid grid-cols-4 items-center px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="col-span-1 font-bold text-slate-800 truncate" onClick={() => viewPlayerProfile(entry.player)} title="View Profile" style={{cursor: 'pointer'}}>
                       {i+1}. {entry.player}
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-bold">
                            {entry.score}/{entry.total}
                        </span>
                    </div>
                    <div className="col-span-1 text-center text-sm text-slate-600">{entry.time}s</div>
                    <div className="col-span-1 text-right text-xs text-slate-400">{formatDateShort(entry.timestamp)}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setScreen('home')}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. PLAYERS LIST (Directory)
  if (screen === 'players') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👥</div>
              <h2 className="text-2xl font-bold mb-1 text-slate-800">All Players</h2>
              <p className="text-slate-600">{playersList.length} player{playersList.length !== 1 ? 's' : ''} registered</p>
            </div>

            {playersList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">No players yet!</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {playersList.map((p, i) => {
                  const avgScore = p.totalPossible > 0 ? Math.round((p.totalScore / p.totalPossible) * 100) : 0;
                  return (
                    <div
                      key={p.name}
                      onClick={() => viewPlayerProfile(p.name)}
                      className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ borderColor: SECONDARY }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg text-slate-800">{p.name}</div>
                        <div className="text-sm text-slate-500">Joined {formatDateShort(p.firstPlayed)}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <div className="text-xs text-slate-500">Games</div>
                          <div className="font-bold text-slate-800">{p.totalGames}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="text-xs text-slate-500">Avg Score</div>
                          <div className="font-bold text-slate-800">{avgScore}%</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs text-slate-500">Best</div>
                          <div className="font-bold text-slate-800">{p.bestScore}%</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="text-xs text-slate-500">Avg Time</div>
                          <div className="font-bold text-slate-800">{p.averageTime}s</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setScreen('home')}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. PLAYER PROFILE
  if (screen === 'player-profile' && selectedPlayer) {
    const stats = playerStats[selectedPlayer];
    
    // Safety check if player not found
    if (!stats) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-slate-600">Player not found</p>
            <button
              onClick={() => setScreen('players')}
              className="mt-4 px-6 py-2 rounded-lg font-semibold border-2"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              ← Back
            </button>
          </div>
        </div>
      );
    }

    const avgScore = stats.totalPossible > 0 ? Math.round((stats.totalScore / stats.totalPossible) * 100) : 0;
    const recentGames = stats.history.slice(0, 10);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Player Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">👤</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-1">{selectedPlayer}</h2>
              <p className="text-slate-600">Member since {formatDateShort(stats.firstPlayed)}</p>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-slate-800">{stats.totalGames}</div>
                <div className="text-sm text-slate-600">Total Games</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-slate-800">{avgScore}%</div>
                <div className="text-sm text-slate-600">Average Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-slate-800">{stats.bestScore}%</div>
                <div className="text-sm text-slate-600">Best Score</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl font-bold text-slate-800">{stats.averageTime}s</div>
                <div className="text-sm text-slate-600">Avg Time</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-3">Performance by Category</h3>
              <div className="space-y-3">
                {Object.entries(stats.categories).map(([cat, catData]) => {
                  const catAvg = catData.totalPossible > 0 ? Math.round((catData.totalScore / catData.totalPossible) * 100) : 0;
                  return (
                    <div key={cat} className="p-4 border-2 rounded-lg" style={{ borderColor: SECONDARY }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-800">{cat}</div>
                        <div className="text-sm text-slate-600">{catData.games} game{catData.games !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <div className="text-slate-500">Average</div>
                          <div className="font-bold text-slate-800">{catAvg}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Best</div>
                          <div className="font-bold text-slate-800">{catData.bestScore}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Avg Time</div>
                          <div className="font-bold text-slate-800">{catData.averageTime}s</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Recent Games</h3>
            {recentGames.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No games yet</p>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => (
                  <div key={game.id} className="p-4 border-2 rounded-lg" style={{ borderColor: SECONDARY }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-slate-800">{game.category}</div>
                        <div className="text-xs text-slate-500">{formatDate(game.timestamp)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-slate-800">{game.score}/{game.total}</div>
                        <div className="text-sm text-slate-500">{game.percentage}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>⏱️ {game.time}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('players')}
              className="flex-1 py-3 rounded-lg font-semibold border-2 bg-white transition-transform hover:scale-105"
              style={{ color: SECONDARY, borderColor: SECONDARY }}
            >
              👥 All Players
            </button>
            <button
              onClick={() => setScreen('home')}
              className="flex-1 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: PRIMARY }}
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not happen)
  return <div>Loading...</div>;
}