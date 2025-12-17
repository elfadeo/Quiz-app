import React, { useState, useEffect, useRef } from 'react';
// --- FIREBASE IMPORTS ---
import { db } from './firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// --- ICONS (INLINE SVGs for Professional Look) ---
const Icons = {
  Math: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  English: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Science: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  ICT: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  History: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  Trophy: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Back: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
};

// --- DATA ---
const staticQuizData = {
  English: [
    { question: "Synonym for 'happy'?", options: ["Sad","Joyful","Angry","Tired"], correct: 1 },
    { question: "Past tense of 'run'?", options: ["Runned","Ran","Running","Runs"], correct: 1 },
    { question: "Correct spelling?", options: ["Recieve","Receive","Receeve","Recive"], correct: 1 },
    { question: "Type of word is 'quickly'?", options: ["Noun","Verb","Adjective","Adverb"], correct: 3 },
    { question: "Which is a proper noun?", options: ["city","London","building","person"], correct: 1 },
    { question: "Punctuation ending a question?", options: ["Period","Comma","?","!"], correct: 2 },
    { question: "Plural of 'mouse'?", options: ["Mouses","Mice","Mouse","Mices"], correct: 1 },
    { question: "Antonym for 'beautiful'?", options: ["Pretty","Ugly","Gorgeous","Nice"], correct: 1 },
    { question: "Comparison: Big, Bigger, ___?", options: ["Bigest","Most Big","Biggest","Biggerest"], correct: 2 },
    { question: "What is a stanza?", options: ["A type of food","Paragraph in a poem","A punctuation mark","A grammar rule"], correct: 1 },
    { question: "Identify the verb: 'She sings well.'", options: ["She","Sings","Well","a"], correct: 1 },
    { question: "Homophone for 'see'?", options: ["Saw","Sea","Say","Scene"], correct: 1 },
    { question: "Prefix for 'happy' to mean opposite?", options: ["Un-","Dis-","Mis-","Re-"], correct: 0 },
    { question: "Suffix for 'care' to mean 'without'?", options: ["-ful","-less","-ly","-ness"], correct: 1 },
    { question: "Person who writes books?", options: ["Editor","Author","Reader","Librarian"], correct: 1 },
    { question: "Past participle of 'eat'?", options: ["Ate","Eaten","Eating","Eats"], correct: 1 },
    { question: "Collective noun for lions?", options: ["Pack","Herd","Pride","Flock"], correct: 2 },
    { question: "What is a hyperbole?", options: ["Understatement","Exaggeration","Fact","Question"], correct: 1 },
    { question: "Correct pronoun: '___ is my friend.'", options: ["Him","He","His","Her"], correct: 1 },
    { question: "Opposite of 'Victory'?", options: ["Win","Defeat","Triumph","Success"], correct: 1 },
    { question: "Rhyme for 'Cat'?", options: ["Dog","Bat","Cot","Cut"], correct: 1 },
    { question: "First letter of the alphabet?", options: ["Z","B","A","C"], correct: 2 },
    { question: "Word for a baby dog?", options: ["Kitten","Cub","Puppy","Calf"], correct: 2 },
    { question: "Identify the noun: 'The blue car.'", options: ["The","Blue","Car","Fast"], correct: 2 },
    { question: "Superlative of 'Good'?", options: ["Gooder","Best","Better","Goodest"], correct: 1 },
    { question: "Word describing an action?", options: ["Noun","Verb","Adjective","Pronoun"], correct: 1 },
    { question: "Contraction of 'Do not'?", options: ["Don't","D'not","Dont","Do'nt"], correct: 0 },
    { question: "Synonym for 'Fast'?", options: ["Slow","Quick","Heavy","Late"], correct: 1 },
    { question: "Plural of 'Leaf'?", options: ["Leafs","Leaves","Leeves","Leafes"], correct: 1 },
    { question: "Tense: 'I will go.'", options: ["Past","Present","Future","Perfect"], correct: 2 }
  ],
  ICT: [
    { question: "What does CPU stand for?", options: ["Central Processing Unit","Computer Personal Unit","Central Program Utility","Control Processing Unit"], correct: 0 },
    { question: "Which is an input device?", options: ["Monitor","Printer","Keyboard","Speaker"], correct: 2 },
    { question: "What does RAM stand for?", options: ["Read Access Memory","Random Access Memory","Rapid Access Memory","Real Access Memory"], correct: 1 },
    { question: "Which is a web browser?", options: ["Word","Chrome","Photoshop","Excel"], correct: 1 },
    { question: "Extension for images?", options: [".txt",".mp3",".jpg",".exe"], correct: 2 },
    { question: "Main circuit board?", options: ["RAM","Motherboard","HDD","CPU"], correct: 1 },
    { question: "Shortcut for Copy?", options: ["Ctrl+V","Ctrl+C","Ctrl+X","Ctrl+Z"], correct: 1 },
    { question: "What does HTML stand for?", options: ["High Tech Markup","HyperText Markup Language","Home Tool Markup","Hyperlinks Text"], correct: 1 },
    { question: "Output device?", options: ["Mouse","Scanner","Monitor","Mic"], correct: 2 },
    { question: "Brain of the computer?", options: ["CPU","RAM","HDD","Mouse"], correct: 0 },
    { question: "Smallest unit of data?", options: ["Byte","Bit","Megabyte","Gigabyte"], correct: 1 },
    { question: "1024 Megabytes equals?", options: ["1 KB","1 GB","1 TB","1 PB"], correct: 1 },
    { question: "Shortcut for Paste?", options: ["Ctrl+C","Ctrl+V","Ctrl+P","Ctrl+X"], correct: 1 },
    { question: "Software to browse internet?", options: ["Browser","Spreadsheet","Compiler","Database"], correct: 0 },
    { question: "Which is an OS?", options: ["Google","Windows","Dell","Intel"], correct: 1 },
    { question: "Shortcut for Undo?", options: ["Ctrl+Y","Ctrl+Z","Ctrl+U","Ctrl+D"], correct: 1 },
    { question: "Meaning of 'www'?", options: ["World Wide Web","World Web Wide","Wide World Web","Web World Wide"], correct: 0 },
    { question: "Device to move cursor?", options: ["Keyboard","Mouse","Printer","Speaker"], correct: 1 },
    { question: "Permanent storage?", options: ["RAM","Cache","Hard Drive","Register"], correct: 2 },
    { question: "Wireless technology?", options: ["Ethernet","Fiber","Wi-Fi","Coaxial"], correct: 2 },
    { question: "Binary consists of?", options: ["0,1,2","1,2","0,1","Yes,No"], correct: 2 },
    { question: "Portable storage?", options: ["HDD","USB Drive","RAM","CPU"], correct: 1 },
    { question: "Video sharing platform?", options: ["Google","YouTube","Amazon","Bing"], correct: 1 },
    { question: "Social Media App?", options: ["Excel","Facebook","Word","Paint"], correct: 1 },
    { question: "Malicious software?", options: ["Malware","Hardware","Firmware","Freeware"], correct: 0 },
    { question: "PDF stands for?", options: ["Portable Document Format","Personal Data File","Print Doc File","Public Data Form"], correct: 0 },
    { question: "Key to capitalize letters?", options: ["Ctrl","Shift","Alt","Tab"], correct: 1 },
    { question: "Connects computer to network?", options: ["GPU","NIC","USB","VGA"], correct: 1 },
    { question: "Resolution refers to?", options: ["Speed","Pixels","Sound","Storage"], correct: 1 },
    { question: "Touchscreen is?", options: ["Input only","Output only","Input & Output","Neither"], correct: 2 }
  ],
  Science: [
    { question: "Symbol for water?", options: ["H2O","CO2","O2","H2"], correct: 0 },
    { question: "Planets in solar system?", options: ["7","8","9","10"], correct: 1 },
    { question: "Center of atom?", options: ["Electron","Proton","Nucleus","Neutron"], correct: 2 },
    { question: "Gas plants absorb?", options: ["Oxygen","Nitrogen","CO2","Hydrogen"], correct: 2 },
    { question: "Largest organ?", options: ["Heart","Brain","Liver","Skin"], correct: 3 },
    { question: "Boiling point of water?", options: ["90°C","95°C","100°C","105°C"], correct: 2 },
    { question: "Red Planet?", options: ["Venus","Mars","Jupiter","Saturn"], correct: 1 },
    { question: "Symbol for gold?", options: ["Go","Gd","Au","Ag"], correct: 2 },
    { question: "Bones in adult body?", options: ["186","206","226","246"], correct: 1 },
    { question: "Force keeping us on ground?", options: ["Magnetism","Gravity","Friction","Tension"], correct: 1 },
    { question: "Hardest natural substance?", options: ["Gold","Iron","Diamond","Silver"], correct: 2 },
    { question: "Animal that eats plants?", options: ["Carnivore","Herbivore","Omnivore","Insectivore"], correct: 1 },
    { question: "Process plants make food?", options: ["Respiration","Photosynthesis","Digestion","Absorption"], correct: 1 },
    { question: "Closest star to Earth?", options: ["Moon","Mars","Sun","Alpha Centauri"], correct: 2 },
    { question: "Symbol for Oxygen?", options: ["Ox","O","On","Og"], correct: 1 },
    { question: "States of matter?", options: ["1","2","3","4"], correct: 2 },
    { question: "Study of life?", options: ["Physics","Chemistry","Biology","Geology"], correct: 2 },
    { question: "Freezing point of water?", options: ["10°C","0°C","-10°C","100°C"], correct: 1 },
    { question: "Planet with rings?", options: ["Mars","Venus","Saturn","Mercury"], correct: 2 },
    { question: "Human heart chambers?", options: ["2","3","4","5"], correct: 2 },
    { question: "Source of solar energy?", options: ["Fission","Fusion","Burning","Wind"], correct: 1 },
    { question: "Vertebrates have?", options: ["Wings","Backbones","Scales","Fur"], correct: 1 },
    { question: "Liquid metal?", options: ["Iron","Lead","Mercury","Gold"], correct: 2 },
    { question: "Powerhouse of cell?", options: ["Nucleus","Mitochondria","Ribosome","Wall"], correct: 1 },
    { question: "pH of water?", options: ["5","6","7","8"], correct: 2 },
    { question: "Speed of light?", options: ["Slow","Fast","300,000 km/s","Instant"], correct: 2 },
    { question: "Sound travels fastest in?", options: ["Vacuum","Air","Water","Steel"], correct: 3 },
    { question: "Largest mammal?", options: ["Elephant","Blue Whale","Giraffe","Hippo"], correct: 1 },
    { question: "Study of rocks?", options: ["Biology","Geology","Chemistry","Physics"], correct: 1 },
    { question: "Unit of energy?", options: ["Watt","Joule","Newton","Volt"], correct: 1 }
  ],
  History: [
    { question: "WWII ended in?", options: ["1943","1944","1945","1946"], correct: 2 },
    { question: "First US President?", options: ["Jefferson","Washington","Adams","Franklin"], correct: 1 },
    { question: "Who painted Mona Lisa?", options: ["Michelangelo","Da Vinci","Raphael","Donatello"], correct: 1 },
    { question: "Man on moon year?", options: ["1967","1968","1969","1970"], correct: 2 },
    { question: "Discovered America?", options: ["Columbus","Magellan","Cook","Drake"], correct: 0 },
    { question: "Built Great Wall?", options: ["Japan","China","India","Mongolia"], correct: 1 },
    { question: "Ancient Egyptian writing?", options: ["Latin","Hieroglyphics","Cuneiform","Sanskrit"], correct: 1 },
    { question: "First Emperor of Rome?", options: ["Caesar","Nero","Augustus","Trajan"], correct: 2 },
    { question: "Start of WWI?", options: ["1912","1914","1916","1918"], correct: 1 },
    { question: "Invented lightbulb?", options: ["Tesla","Edison","Bell","Wright"], correct: 1 },
    { question: "Civil Rights leader?", options: ["MLK Jr","JFK","Lincoln","Truman"], correct: 0 },
    { question: "Queen of Egypt?", options: ["Helen","Cleopatra","Victoria","Elizabeth"], correct: 1 },
    { question: "Ship hit an iceberg?", options: ["Titanic","Lusitania","Britannic","Olympic"], correct: 0 },
    { question: "French woman warrior?", options: ["Joan of Arc","Marie Curie","Coco Chanel","Antoinette"], correct: 0 },
    { question: "Built Machu Picchu?", options: ["Aztec","Inca","Maya","Olmec"], correct: 1 },
    { question: "First female pilot solo Atlantic?", options: ["Earhart","Coleman","Ride","Markham"], correct: 0 },
    { question: "Invented Telephone?", options: ["Bell","Edison","Morse","Marconi"], correct: 0 },
    { question: "Currency of UK?", options: ["Dollar","Euro","Pound","Yen"], correct: 2 },
    { question: "Iron Lady?", options: ["Merkel","Thatcher","Gandhi","Meir"], correct: 1 },
    { question: "Nelson Mandela country?", options: ["Kenya","Nigeria","South Africa","Egypt"], correct: 2 },
    { question: "Napoleon was?", options: ["French","British","German","Russian"], correct: 0 },
    { question: "Pyramids location?", options: ["Giza","Athens","Rome","Paris"], correct: 0 },
    { question: "Viking origin?", options: ["Scandinavia","Asia","Africa","America"], correct: 0 },
    { question: "Currency of Japan?", options: ["Won","Yuan","Yen","Baht"], correct: 2 },
    { question: "Year USA independence?", options: ["1770","1776","1780","1790"], correct: 1 },
    { question: "Longest river in world?", options: ["Amazon","Nile","Yangtze","Mississippi"], correct: 1 },
    { question: "Capital of Italy?", options: ["Venice","Milan","Rome","Naples"], correct: 2 },
    { question: "Cold War participants?", options: ["US & UK","US & USSR","UK & France","China & Japan"], correct: 1 },
    { question: "Renaissance started in?", options: ["France","Italy","England","Spain"], correct: 1 },
    { question: "Alexander the ___?", options: ["Good","Great","Bad","Bold"], correct: 1 }
  ]
};

// --- LOGIC HELPERS ---
function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function generateMathQuestions(count) {
  const questions = [];
  const operators = ['+', '-', '×'];
  for(let i = 0; i < count; i++) {
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1, num2, answer, questionText;
    let options = [];

    if (operator === '×') {
      num1 = Math.floor(Math.random() * 12) + 2; 
      num2 = Math.floor(Math.random() * 12) + 2; 
      answer = num1 * num2;
      questionText = `What is ${num1} × ${num2}?`;
    } else if (operator === '-') {
      num1 = Math.floor(Math.random() * 50) + 20; 
      num2 = Math.floor(Math.random() * 19) + 1;
      answer = num1 - num2;
      questionText = `What is ${num1} - ${num2}?`;
    } else {
      num1 = Math.floor(Math.random() * 50) + 1; 
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      questionText = `What is ${num1} + ${num2}?`;
    }

    options.push(answer.toString()); 
    options.push((answer + Math.floor(Math.random() * 5) + 1).toString());
    options.push((answer - Math.floor(Math.random() * 5) - 1).toString());
    options.push((answer + 10).toString());
    
    const shuffledOptions = shuffleArray(options);
    const correctIndex = shuffledOptions.indexOf(answer.toString());

    questions.push({ question: questionText, options: shuffledOptions, correct: correctIndex });
  }
  return questions;
}

// --- COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled }) => {
  const baseStyle = "w-full py-4 rounded-xl font-bold transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    outline: "border-2 border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600",
    danger: "bg-red-500 text-white"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};

export default function QuizApp() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questionCount, setQuestionCount] = useState(10); 
  const [gameQuestions, setGameQuestions] = useState([]); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const timerRef = useRef(null);

  // Background Animation Styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
      .float-anim { animation: float 6s ease-in-out infinite; }
      .bg-gradient-mesh {
        background-color: #f3f4f6;
        background-image: 
          radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
      }
      /* Light Glass Mode Background */
      .professional-bg {
        background: radial-gradient(circle at 10% 20%, rgb(239, 246, 255) 0%, rgb(219, 228, 255) 90%);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Firebase
  useEffect(() => {
    const q = query(collection(db, "scores"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGames = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const sortedLeaderboard = [...allGames].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      });
      setLeaderboard(sortedLeaderboard);
      
      const stats = {};
      allGames.forEach(game => {
        if (!stats[game.player]) {
          stats[game.player] = { totalGames: 0, totalScore: 0, totalPossible: 0, bestScore: 0, totalTime: 0, firstPlayed: game.timestamp, history: [], categories: {} };
        }
        const p = stats[game.player];
        p.totalGames++; p.totalScore += game.score; p.totalPossible += game.total; p.totalTime += game.time;
        if (new Date(game.timestamp) < new Date(p.firstPlayed)) p.firstPlayed = game.timestamp;
        p.bestScore = Math.max(p.bestScore, game.percentage);
        p.history.push(game);
        if (!p.categories[game.category]) p.categories[game.category] = { games: 0, totalScore: 0, totalPossible: 0, bestScore: 0, totalTime: 0 };
        const c = p.categories[game.category];
        c.games++; c.totalScore += game.score; c.totalPossible += game.total; c.bestScore = Math.max(c.bestScore, game.percentage); c.totalTime += game.time;
      });
      Object.values(stats).forEach(p => {
        p.averageTime = Math.round(p.totalTime / p.totalGames);
      });
      setPlayerStats(stats);
    });
    return () => unsubscribe();
  }, []);

  // Timer
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

  // Logic
  const handleStartQuiz = () => { if (playerName.trim()) setScreen('category'); };
  
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    let questions = [];
    if (category === 'Math') {
      questions = generateMathQuestions(questionCount);
    } else {
      const allQuestions = staticQuizData[category];
      if (allQuestions) {
        const shuffledQuestions = shuffleArray(allQuestions);
        questions = shuffledQuestions.slice(0, questionCount).map(q => {
            const originalOptions = q.options;
            const correctText = originalOptions[q.correct];
            const shuffledOptions = shuffleArray(originalOptions);
            return { ...q, options: shuffledOptions, correct: shuffledOptions.indexOf(correctText) };
        });
      }
    }
    setGameQuestions(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStartTime(Date.now());
    setTimeLeft(30);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScreen('quiz');
  };

  const handleAnswer = (idx) => {
    if (showFeedback) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(idx);
    setShowFeedback(true);
    if (idx !== -1 && idx === gameQuestions[currentQuestionIndex].correct) setScore(p => p + 1);
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= gameQuestions.length) setScreen('results');
      else {
        setCurrentQuestionIndex(p => p + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 1200);
  };

  const saveScore = async () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    await addDoc(collection(db, "scores"), {
      player: playerName, category: selectedCategory, score: score, total: gameQuestions.length,
      time: timeTaken, timestamp: new Date().toISOString(), percentage: Math.round((score / gameQuestions.length) * 100)
    });
    setScreen('leaderboard');
  };

  // --- RENDER SCREENS ---

  const renderHome = () => (
    <Card className="max-w-md w-full text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="mb-8 float-anim">
         <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg text-white text-4xl">
           🧠
         </div>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">QuizMaster</h1>
      <p className="text-slate-500 mb-8 font-medium">Challenge yourself & grow.</p>
      
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icons.User />
          </div>
          <input 
            type="text" 
            placeholder="Enter your name..." 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)}
            className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-semibold text-slate-700"
          />
        </div>
        <Button onClick={handleStartQuiz}>Get Started</Button>
        <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setScreen('leaderboard')}>
               <Icons.Trophy /> Rankings
            </Button>
            <Button variant="secondary" onClick={() => setScreen('players')}>
               <Icons.User /> Profiles
            </Button>
        </div>
      </div>
    </Card>
  );

  const renderCategory = () => {
    const cats = [
      { id: 'Math', icon: Icons.Math, color: 'text-blue-500', bg: 'bg-blue-50' },
      { id: 'English', icon: Icons.English, color: 'text-pink-500', bg: 'bg-pink-50' },
      { id: 'ICT', icon: Icons.ICT, color: 'text-purple-500', bg: 'bg-purple-50' },
      { id: 'Science', icon: Icons.Science, color: 'text-green-500', bg: 'bg-green-50' },
      { id: 'History', icon: Icons.History, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    return (
      <div className="max-w-4xl w-full">
        <Card className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Configuration</h2>
            <p className="text-slate-500 mb-6">Customize your session</p>
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl">
              {[10, 20, 30].map(num => (
                <button 
                  key={num} 
                  onClick={() => setQuestionCount(num)}
                  className={`px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${questionCount === num ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {num} Qs
                </button>
              ))}
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map(cat => (
            <button 
                key={cat.id} 
                onClick={() => handleCategorySelect(cat.id)}
                className="bg-white/90 backdrop-blur border border-white p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 group text-left relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${cat.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`}></div>
              <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                <cat.icon />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{cat.id}</h3>
              <p className="text-slate-500 text-sm">Start Quiz →</p>
            </button>
          ))}
        </div>
        <div className="mt-8">
            <Button variant="secondary" onClick={() => setScreen('home')} className="max-w-xs mx-auto"><Icons.Back /> Back</Button>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const q = gameQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / gameQuestions.length) * 100;
    
    return (
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6 px-2">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{selectedCategory}</span>
            <div className="flex items-center gap-2 text-slate-600 font-mono bg-white px-3 py-1 rounded-full shadow-sm">
                <span>⏰</span>
                <span className={`${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>

        <Card className="mb-6 relative">
             <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg">
                 {currentQuestionIndex + 1}
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mt-2 leading-tight">{q.question}</h3>
        </Card>

        <div className="grid gap-4">
            {q.options.map((opt, idx) => {
                let statusClass = "border-2 border-transparent bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50";
                if (showFeedback) {
                    if (idx === q.correct) statusClass = "bg-green-500 text-white border-green-600 shadow-green-200";
                    else if (idx === selectedAnswer) statusClass = "bg-red-500 text-white border-red-600 shadow-red-200";
                    else statusClass = "bg-slate-100 text-slate-400 opacity-50";
                }
                return (
                    <button 
                        key={idx} 
                        disabled={showFeedback}
                        onClick={() => handleAnswer(idx)}
                        className={`p-5 rounded-2xl text-lg font-medium text-left shadow-sm transition-all duration-200 transform active:scale-[0.99] flex justify-between items-center group ${statusClass}`}
                    >
                        <span>{opt}</span>
                        {showFeedback && idx === q.correct && <div className="bg-white/20 p-1 rounded-full"><Icons.Check /></div>}
                    </button>
                )
            })}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percent = Math.round((score / gameQuestions.length) * 100);
    return (
      <Card className="max-w-md w-full text-center">
         <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-indigo-600" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{percent}%</span>
                <span className="text-xs text-slate-400 font-bold uppercase">Accuracy</span>
            </div>
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
         <p className="text-slate-500 mb-8">You scored {score} out of {gameQuestions.length}</p>
         <div className="space-y-3">
            <Button onClick={saveScore}>Save & Leaderboard</Button>
            <Button variant="secondary" onClick={() => setScreen('category')}>Play Again</Button>
         </div>
      </Card>
    );
  };

  const renderLeaderboard = () => {
    const filtered = filterCategory === 'All' ? leaderboard : leaderboard.filter(e => e.category === filterCategory);
    return (
      <div className="max-w-4xl w-full h-[90vh] flex flex-col">
        <Card className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icons.Trophy /> Leaderboard</h2>
                <button onClick={() => setScreen('home')} className="text-sm font-bold text-slate-500 hover:text-indigo-600">Back Home</button>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Math', 'English', 'ICT', 'Science', 'History'].map(cat => (
                   <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {cat}
                   </button>
                ))}
             </div>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
             <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wide px-4 mb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Player</div>
                <div className="col-span-3 text-center">Score</div>
                <div className="col-span-3 text-right">Time</div>
             </div>
             {filtered.slice(0, 50).map((entry, i) => (
               <div key={i} className="grid grid-cols-12 items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="col-span-1 font-bold text-slate-400">{i+1}</div>
                  <div className="col-span-5 font-bold text-slate-700 truncate">{entry.player}</div>
                  <div className="col-span-3 text-center"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">{entry.score}/{entry.total}</span></div>
                  <div className="col-span-3 text-right text-slate-500 text-sm font-mono">{entry.time}s</div>
               </div>
             ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderPlayers = () => (
      <div className="max-w-4xl w-full h-[90vh] flex flex-col">
          <Card className="flex-1 overflow-hidden flex flex-col p-6">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">Player Profiles</h2>
                 <Button variant="secondary" onClick={() => setScreen('home')} className="w-auto px-4 py-2">Back</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                 {Object.entries(playerStats).map(([name, stats]) => (
                    <div key={name} onClick={() => { setSelectedPlayer(name); setScreen('player-profile'); }} className="p-6 border rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all bg-slate-50 hover:bg-white group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">👤</div>
                            <div>
                                <div className="font-bold text-lg text-slate-800">{name}</div>
                                <div className="text-xs text-slate-500">Played {stats.totalGames} games</div>
                            </div>
                        </div>
                    </div>
                 ))}
             </div>
          </Card>
      </div>
  );

  const renderProfile = () => {
    if(!selectedPlayer) return null;
    const stats = playerStats[selectedPlayer];
    return (
      <div className="max-w-3xl w-full">
         <Card className="mb-6">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => setScreen('players')} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1"><Icons.Back /> Back</button>
                <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl mb-2 shadow-inner">👤</div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedPlayer}</h2>
                </div>
                <div className="w-10"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-bold text-indigo-600">{stats.totalGames}</div><div className="text-xs font-bold text-slate-400 uppercase">Games</div></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-bold text-green-600">{stats.bestScore}%</div><div className="text-xs font-bold text-slate-400 uppercase">Best Score</div></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><div className="text-2xl font-bold text-orange-600">{stats.averageTime}s</div><div className="text-xs font-bold text-slate-400 uppercase">Avg Time</div></div>
            </div>
         </Card>
         <Card>
             <h3 className="font-bold text-slate-800 mb-4 text-lg">Recent History</h3>
             <div className="space-y-3">
                 {[...stats.history].reverse().slice(0, 10).map((game, i) => (
                     <div key={i} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50">
                         <div>
                             <div className="font-bold text-slate-700">{game.category}</div>
                             <div className="text-xs text-slate-400">{new Date(game.timestamp).toLocaleDateString()}</div>
                         </div>
                         <div className="text-right">
                             <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${game.percentage > 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{game.percentage}%</span>
                         </div>
                     </div>
                 ))}
             </div>
         </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen professional-bg font-sans text-slate-800 flex flex-col items-center justify-center p-4 md:p-6 transition-all">
      {screen === 'home' && renderHome()}
      {screen === 'category' && renderCategory()}
      {screen === 'quiz' && renderQuiz()}
      {screen === 'results' && renderResults()}
      {screen === 'leaderboard' && renderLeaderboard()}
      {screen === 'players' && renderPlayers()}
      {screen === 'player-profile' && renderProfile()}
    </div>
  );
}