import React, { useState, useEffect, useRef } from 'react';

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
  const timerRef = useRef(null);

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Timer effect
  useEffect(() => {
    if (screen === 'quiz' && !showFeedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAnswer(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [screen, currentQuestionIndex, showFeedback]);

  async function loadLeaderboard() {
    try {
      const result = await window.storage.get('quiz_leaderboard', true);
      if (result && result.value) {
        setLeaderboard(JSON.parse(result.value));
      }
    } catch (e) {
      console.log('No leaderboard data yet');
    }
  }

  async function saveLeaderboard(data) {
    try {
      await window.storage.set('quiz_leaderboard', JSON.stringify(data), true);
    } catch (e) {
      console.error('Failed to save leaderboard:', e);
    }
  }

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
    const isCorrect = answerIndex === currentQ.correct;
    
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

  async function saveScoreAndShowLeaderboard() {
    const questions = quizData[selectedCategory];
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const entry = {
      player: playerName,
      category: selectedCategory,
      score: score,
      total: questions.length,
      time: timeTaken,
      at: new Date().toISOString()
    };

    const newLeaderboard = [...leaderboard, entry];
    newLeaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });
    
    const trimmed = newLeaderboard.slice(0, 100);
    setLeaderboard(trimmed);
    await saveLeaderboard(trimmed);
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

  // Home Screen
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
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Category Screen
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
            <p className="text-slate-600 text-center mb-6">Choose a subject</p>

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

  // Quiz Screen
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

  // Results Screen
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

  // Leaderboard Screen
  if (screen === 'leaderboard') {
    const top = leaderboard.slice(0, 20);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold mb-1 text-slate-800">Leaderboard</h2>
              <p className="text-slate-600">Top performers</p>
            </div>

            {top.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-slate-500">No scores yet. Be the first to play!</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {top.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border-2"
                    style={{ borderColor: SECONDARY }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold w-8">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{e.player}</div>
                        <div className="text-sm text-slate-500">{e.category} • {e.time}s</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-slate-800">{e.score}/{e.total}</div>
                      <div className="text-sm text-slate-500">{Math.round((e.score / e.total) * 100)}%</div>
                    </div>
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

  return null;
}