import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use'; 

// --- FIREBASE IMPORTS (Keep your existing config) ---
import { db } from './firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// ==========================================
// 🔊 AUDIO ENGINE
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playSound = (type) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  const sounds = {
    correct: () => {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4);
    },
    wrong: () => {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    },
    click: () => {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, now); gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05);
    },
    buy: () => {
      osc.type = 'square'; osc.frequency.setValueAtTime(1200, now); osc.frequency.setValueAtTime(1600, now + 0.1); gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2);
    },
    win: () => {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination); o.frequency.value = freq; g.gain.setValueAtTime(0.1, now + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.6); o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6); });
    },
    reward: () => {
       osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3); gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5);
    }
  };
  if(sounds[type]) sounds[type]();
};

// ==========================================
// 🎨 ICONS & ASSETS
// ==========================================
const Icons = {
  Math: () => <span className="text-2xl">📐</span>,
  Science: () => <span className="text-2xl">🧬</span>,
  History: () => <span className="text-2xl">🏛️</span>,
  Geography: () => <span className="text-2xl">🌍</span>,
  Technology: () => <span className="text-2xl">💻</span>,
  Entertainment: () => <span className="text-2xl">🎬</span>,
  Sports: () => <span className="text-2xl">⚽</span>,
  Coin: () => <span className="text-yellow-400 text-lg">🪙</span>,
  Shop: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Back: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
};

const AVATARS = [
  { id: 'robot', icon: '🤖', name: 'Droid', cost: 0 },
  { id: 'fox', icon: '🦊', name: 'Fox', cost: 500 },
  { id: 'alien', icon: '👽', name: 'Alien', cost: 1000 },
  { id: 'ninja', icon: '🥷', name: 'Ninja', cost: 2000 },
  { id: 'king', icon: '👑', name: 'Royal', cost: 5000 },
];

const THEMES = {
  Math: "from-blue-500 to-cyan-500",
  Science: "from-emerald-500 to-teal-500",
  History: "from-amber-500 to-orange-500",
  Geography: "from-green-500 to-lime-500",
  Technology: "from-indigo-500 to-purple-500",
  Entertainment: "from-pink-500 to-rose-500",
  Sports: "from-red-500 to-orange-600"
};

// ==========================================
// 📚 DATA
// ==========================================
const campaignData = {
    Math: [
      { level: 1, title: "Mental Math", questions: [ { q: "12 + 15?", o: ["25","27","30","22"], c: 1, e: "Simple addition." }, { q: "9 x 9?", o: ["80","81","72","90"], c: 1, e: "Multiplication." }, { q: "50 / 2?", o: ["20","25","30","15"], c: 1, e: "Half of 50." }, { q: "100 - 45?", o: ["55","65","45","35"], c: 0, e: "Subtraction." }, { q: "Square root of 16?", o: ["2","3","4","5"], c: 2, e: "4x4=16" } ] },
      { level: 2, title: "Algebra", questions: [ { q: "2x = 20, x=?", o: ["5","10","15","20"], c: 1, e: "Divide by 2." }, { q: "3 squared?", o: ["6","9","12","27"], c: 1, e: "3*3=9" }, { q: "Pi approx?", o: ["3.14","2.14","4.14","3.00"], c: 0, e: "Ratio of circ to diam." }, { q: "10% of 500?", o: ["10","50","100","5"], c: 1, e: "Move decimal once." }, { q: "x + 10 = 25", o: ["10","15","20","5"], c: 1, e: "Subtract 10." } ] },
      { level: 3, title: "Geometry", questions: [ { q: "Triangle angles?", o: ["180","360","90","270"], c: 0, e: "Sum is 180." }, { q: "Area of circle?", o: ["2πr","πr²","πd","wh"], c: 1, e: "Pi r squared." }, { q: "Sides of octagon?", o: ["6","7","8","10"], c: 2, e: "Octo means 8." }, { q: "Right angle?", o: ["45","90","180","360"], c: 1, e: "90 degrees." }, { q: "Prime number?", o: ["9","15","17","21"], c: 2, e: "17 has no factors." } ] }
    ],
    Science: [
      { level: 1, title: "Lab Assistant", questions: [ { q: "Symbol for Water?", o: ["CO2","H2O","O2","H2"], c: 1, e: "2 Hydrogen, 1 Oxygen." }, { q: "Planet with rings?", o: ["Mars","Venus","Saturn","Mercury"], c: 2, e: "Saturn's rings are ice." }, { q: "Plants breathe?", o: ["O2","CO2","N2","He"], c: 1, e: "They need Carbon Dioxide." }, { q: "Center of atom?", o: ["Electron","Nucleus","Proton","Quark"], c: 1, e: "Nucleus." }, { q: "Hardest mineral?", o: ["Gold","Iron","Diamond","Lead"], c: 2, e: "Diamond (Carbon)." } ] },
      { level: 2, title: "Biologist", questions: [ { q: "Powerhouse of cell?", o: ["Nucleus","Mitochondria","Ribosome","Wall"], c: 1, e: "Makes ATP." }, { q: "Largest organ?", o: ["Liver","Heart","Skin","Lungs"], c: 2, e: "Skin covers the body." }, { q: "Bones in adult?", o: ["206","300","150","500"], c: 0, e: "Babies have more." }, { q: "Universal donor?", o: ["A+","O-","AB+","B-"], c: 1, e: "O Negative." }, { q: "DNA shape?", o: ["Circle","Single Helix","Double Helix","Line"], c: 2, e: "Twisted ladder." } ] },
      { level: 3, title: "Physicist", questions: [ { q: "Speed of Light?", o: ["300k km/s","Sonic","Mach 1","Instant"], c: 0, e: "299,792 km/s." }, { q: "First element?", o: ["Helium","Hydrogen","Carbon","Lithium"], c: 1, e: "Atomic number 1." }, { q: "Absolute Zero?", o: ["0C","-100C","-273C","-500C"], c: 2, e: "0 Kelvin." }, { q: "Newton's 1st Law?", o: ["Gravity","Inertia","Force","Action"], c: 1, e: "Object at rest..." }, { q: "E = mc^2 is?", o: ["Newton","Einstein","Tesla","Bohr"], c: 1, e: "Theory of Relativity." } ] }
    ],
    Technology: [
      { level: 1, title: "User", questions: [ { q: "Meaning of PC?", o: ["Personal Computer","Public Computer","Private Center","Power Cell"], c: 0, e: "Personal Computer." }, { q: "Brain of computer?", o: ["RAM","CPU","HDD","GPU"], c: 1, e: "Central Processing Unit." }, { q: "Common OS?", o: ["Doors","Windows","Gates","Portal"], c: 1, e: "Microsoft Windows." }, { q: "WiFi stands for?", o: ["Wireless Fidelity","Wire Fix","Wide Field","Web Fit"], c: 0, e: "Marketing term." }, { q: "Input device?", o: ["Monitor","Speaker","Mouse","Printer"], c: 2, e: "Mouse sends data in." } ] },
      { level: 2, title: "Coder", questions: [ { q: "Web language?", o: ["HTML","Snake","C++","Swift"], c: 0, e: "HyperText Markup Language." }, { q: "Binary is?", o: ["0-9","0 & 1","A-Z","1-10"], c: 1, e: "Base 2 system." }, { q: "Bug means?", o: ["Insect","Feature","Error","Virus"], c: 2, e: "A flaw in code." }, { q: "Meaning of RAM?", o: ["Read Access Memory","Random Access Memory","Run All Memory","Real Area Map"], c: 1, e: "Volatile memory." }, { q: "Founder of Apple?", o: ["Gates","Bezos","Jobs","Musk"], c: 2, e: "Steve Jobs." } ] },
      { level: 3, title: "Hacker", questions: [ { q: "Linux mascot?", o: ["Dog","Cat","Penguin","Bird"], c: 2, e: "Tux the Penguin." }, { q: "HTTP 'S' means?", o: ["Speed","Secure","Site","Server"], c: 1, e: "Secure (Encryption)." }, { q: "Database language?", o: ["SQL","NoVar","DB++","QueryX"], c: 0, e: "Structured Query Language." }, { q: "First programmer?", o: ["Ada Lovelace","Alan Turing","Bill Gates","Grace Hopper"], c: 0, e: "Wrote algorithm for Engine." }, { q: "1024 bytes?", o: ["Megabyte","Kilobyte","Gigabyte","Bit"], c: 1, e: "1 KB." } ] }
    ],
    Geography: [
        { level: 1, title: "Tourist", questions: [{q:"Capital of France?",o:["Paris","Rome","Berlin","Madrid"],c:0,e:"City of Light."},{q:"Largest Ocean?",o:["Atlantic","Indian","Pacific","Arctic"],c:2,e:"Pacific Ocean."},{q:"Shape of Earth?",o:["Flat","Sphere","Cube","Pyramid"],c:1,e:"Oblate spheroid."},{q:"Pyramids are in?",o:["Egypt","China","USA","UK"],c:0,e:"Giza, Egypt."},{q:"Continent with kangaroos?",o:["Africa","Asia","Australia","Europe"],c:2,e:"Australia."}] },
        { level: 2, title: "Pilot", questions: [{q:"Longest River?",o:["Nile","Amazon","Yangtze","Seine"],c:0,e:"Nile (approx 6650km)."},{q:"Capital of Japan?",o:["Seoul","Beijing","Tokyo","Bangkok"],c:2,e:"Tokyo."}, {q:"Mount Everest loc?",o:["Nepal/China","USA/Canada","Swiss/Italy","Peru"],c:0,e:"Himalayas."}, {q:"Largest Desert?",o:["Sahara","Gobi","Arabian","Antarctic"],c:3,e:"Antarctica is a desert."}, {q:"Canal in Panama?",o:["Suez","Panama","Erie","Grand"],c:1,e:"Connects Atlantic/Pacific."}] },
        { level: 3, title: "Cartographer", questions: [{q:"Capital of Canada?",o:["Toronto","Vancouver","Ottawa","Montreal"],c:2,e:"Chosen by Queen Victoria."}, {q:"Smallest Country?",o:["Monaco","Vatican","Malta","Nauru"],c:1,e:"Vatican City."}, {q:"Most islands?",o:["Sweden","Philippines","Indonesia","Japan"],c:0,e:"Sweden (~267k)."}, {q:"River in London?",o:["Thames","Seine","Danube","Rhine"],c:0,e:"The Thames."}, {q:"Machu Picchu loc?",o:["Peru","Chile","Brazil","Mexico"],c:0,e:"Incan citadel."}] }
    ],
    History: [
        { level: 1, title: "Student", questions: [{q:"First US President?",o:["Lincoln","Washington","JFK","Trump"],c:1,e:"George Washington."}, {q:"Titanic year?",o:["1912","1900","1920","1899"],c:0,e:"April 1912."}, {q:"Discovered America?",o:["Columbus","Cook","Drake","Magellan"],c:0,e:"1492."}, {q:"Who wrote Romeo?",o:["Shakespeare","Dickens","Twain","Poe"],c:0,e:"The Bard."}, {q:"Wall in China?",o:["Great Wall","Big Wall","Red Wall","Long Wall"],c:0,e:"Visible from space (myth)."}] },
        { level: 2, title: "Scholar", questions: [{q:"WW2 End Year?",o:["1945","1939","1918","1950"],c:0,e:"Ended Sep 1945."}, {q:"First Man on Moon?",o:["Armstrong","Aldrin","Collins","Gagarin"],c:0,e:"Neil Armstrong."}, {q:"Julius Caesar?",o:["Roman","Greek","Egyptian","Persian"],c:0,e:"Roman Dictator."}, {q:"Iron Lady?",o:["Thatcher","Merkel","May","Queen"],c:0,e:"Margaret Thatcher."}, {q:"Ancient Greek city?",o:["Athens","Rome","Cairo","Paris"],c:0,e:"Birthplace of democracy."}] },
        { level: 3, title: "Professor", questions: [{q:"Start of WWI?",o:["1914","1918","1939","1900"],c:0,e:"Archduke assassination."}, {q:"Magna Carta year?",o:["1215","1066","1492","1776"],c:0,e:"Signed by King John."}, {q:"Napoleon defeated at?",o:["Waterloo","Austerlitz","Paris","Berlin"],c:0,e:"1815 Battle."}, {q:"Nelson Mandela country?",o:["South Africa","Kenya","Nigeria","Egypt"],c:0,e:"Anti-apartheid leader."}, {q:"Aztec capital?",o:["Tenochtitlan","Cusco","Maya","Lima"],c:0,e:"Modern Mexico City."}] }
    ],
    Entertainment: [
        { level: 1, title: "Fan", questions: [{q:"Simba's dad?",o:["Mufasa","Scar","Timon","Nala"],c:0,e:"The Lion King."}, {q:"Batman's city?",o:["Metropolis","Gotham","Star City","New York"],c:1,e:"Gotham City."}, {q:"Wizard Harry?",o:["Potter","Houdini","Merlin","Gandalf"],c:0,e:"The Boy Who Lived."}, {q:"James Bond code?",o:["007","777","001","911"],c:0,e:"License to Kill."}, {q:"Shrek is a?",o:["Ogre","Goblin","Elf","Human"],c:0,e:"Layers like an onion."}] },
        { level: 2, title: "Critic", questions: [{q:"Played Iron Man?",o:["Downey Jr","Evans","Hemsworth","Pratt"],c:0,e:"RDJ started the MCU."}, {q:"King of Pop?",o:["Elvis","MJ","Prince","Bowie"],c:1,e:"Michael Jackson."}, {q:"Director of Titanic?",o:["Cameron","Spielberg","Nolan","Lucas"],c:0,e:"James Cameron."}, {q:"Friends Coffee Shop?",o:["Central Perk","Starbucks","Joes","Beans"],c:0,e:"The orange couch."}, {q:"Star Wars villain?",o:["Vader","Joker","Thanos","Sauron"],c:0,e:"Darth Vader."}] },
        { level: 3, title: "Producer", questions: [{q:"Most Oscars movie?",o:["LOTR: ROTK","Star Wars","Avatar","Jaws"],c:0,e:"Won 11 Oscars."}, {q:"First Disney movie?",o:["Snow White","Cinderella","Fantasia","Bambi"],c:0,e:"1937."}, {q:"Beatles drummer?",o:["Ringo","Paul","John","George"],c:0,e:"Ringo Starr."}, {q:"Highest grossing movie?",o:["Avatar","Endgame","Titanic","Star Wars"],c:0,e:"Avatar (2009)."}, {q:"Netflix started as?",o:["DVD Rental","Streaming","Cable","Production"],c:0,e:"Mail order DVDs."}] }
    ],
    Sports: [
        { level: 1, title: "Rookie", questions: [{q:"Soccer players?",o:["11","10","9","12"],c:0,e:"11 per side."}, {q:"NBA sport?",o:["Basketball","Baseball","Football","Hockey"],c:0,e:"National Basketball Assoc."}, {q:"Super Bowl sport?",o:["Football","Soccer","Tennis","Golf"],c:0,e:"American Football."}, {q:"Usain Bolt sport?",o:["Sprinting","Swimming","Judo","Boxing"],c:0,e:"Fastest man."}, {q:"Tiger Woods sport?",o:["Golf","Tennis","F1","NFL"],c:0,e:"Golf legend."}] },
        { level: 2, title: "Pro", questions: [{q:"Olympics rings?",o:["5","4","6","3"],c:0,e:"5 continents."}, {q:"World Cup frequency?",o:["4 Years","2 Years","1 Year","5 Years"],c:0,e:"Quadrennial."}, {q:"Tour de France?",o:["Cycling","Running","Driving","Sailing"],c:0,e:"Bicycle race."}, {q:"Home of Tennis?",o:["Wimbledon","Paris","New York","Melbourne"],c:0,e:"Oldest tournament."}, {q:"Muhammed Ali sport?",o:["Boxing","MMA","Wrestling","Karate"],c:0,e:"The Greatest."}] },
        { level: 3, title: "Legend", questions: [{q:"Most F1 titles?",o:["Hamilton/Schumacher","Vettel","Senna","Verstappen"],c:0,e:"7 titles each."}, {q:"First modern Olympics?",o:["1896","1900","1924","1800"],c:0,e:"Athens, Greece."}, {q:"FIFA HQ?",o:["Zurich","Paris","London","Madrid"],c:0,e:"Switzerland."}, {q:"Marathon distance?",o:["42.195 km","40 km","50 km","26 km"],c:0,e:"26.2 miles."}, {q:"Michael Phelps medals?",o:["28","20","15","30"],c:0,e:"Most decorated Olympian."}] }
    ]
  };

// ==========================================
// 🕹️ HELPER FUNCTIONS
// ==========================================
function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -20, scale: 0.98 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================
export default function QuizApp() {
  const [screen, setScreen] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  // Optional for responsive confetti
  const { width, height } = useWindowSize(); 
  
  // USER STATE (Persisted)
  const [userState, setUserState] = useState(() => {
    const saved = localStorage.getItem('quizUltraPro_v2'); 
    return saved ? JSON.parse(saved) : {
      name: 'Guest',
      coins: 100,
      inventory: { fifty: 1, freeze: 1 },
      unlockedLevels: { Math: 1, Science: 1, History: 1, Geography: 1, Technology: 1, Entertainment: 1, Sports: 1 },
      mastery: {},
      avatar: 'robot',
      unlockedAvatars: ['robot'],
      lastRewardDate: null
    };
  });

  useEffect(() => { localStorage.setItem('quizUltraPro_v2', JSON.stringify(userState)); }, [userState]);

  // DAILY REWARD
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toDateString(); 
    if (userState.lastRewardDate !== todayStr && screen === 'home') {
        setShowRewardModal(true);
        playSound('reward');
    }
  }, []);

  const claimDailyReward = () => {
      setUserState(prev => ({
          ...prev,
          coins: prev.coins + 50,
          lastRewardDate: new Date().toDateString()
      }));
      setShowRewardModal(false);
      playSound('buy');
  };

  // GAME SESSION STATE
  const [game, setGame] = useState({
    category: null, levelIdx: 0, questions: [], qIndex: 0, score: 0, streak: 0, timeLeft: 30, frozen: false, activeLifelines: { fifty: true, freeze: true }, hiddenOptions: []
  });

  const [feedback, setFeedback] = useState(null);
  const timerRef = useRef(null);
  
  // LEADERBOARD SYNC
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    if(db) {
      try {
        const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
      } catch(e) { console.log("Firebase error:", e); }
    }
  }, []);

  // TIMER LOGIC
  useEffect(() => {
    if (screen === 'quiz' && !feedback && !game.frozen) {
      timerRef.current = setInterval(() => {
        setGame(prev => {
          if (prev.timeLeft <= 0.1) { clearInterval(timerRef.current); handleAnswer(-1); return prev; }
          return { ...prev, timeLeft: prev.timeLeft - 0.1 }; 
        });
      }, 100); 
      return () => clearInterval(timerRef.current);
    }
  }, [screen, game.qIndex, feedback, game.frozen]);

  // ==========================================
  // 🎮 ACTIONS
  // ==========================================

  const startGame = (cat, lvlIdx) => {
    const unlocked = userState.unlockedLevels[cat] || 1;
    if (lvlIdx + 1 > unlocked) { playSound('wrong'); return; }

    const rawQs = campaignData[cat][lvlIdx].questions;
    const processedQs = rawQs.map(q => {
      const originalOpts = q.o;
      const correctTxt = originalOpts[q.c];
      const shuffled = shuffleArray([...originalOpts]);
      return { ...q, o: shuffled, c: shuffled.indexOf(correctTxt) };
    });

    setGame({
      category: cat, levelIdx: lvlIdx, questions: shuffleArray(processedQs), qIndex: 0, score: 0, streak: 0, timeLeft: 30, frozen: false, activeLifelines: { fifty: true, freeze: true }, hiddenOptions: []
    });
    setFeedback(null);
    setShowConfetti(false);
    setScreen('quiz');
    playSound('click');
  };

  const handleAnswer = (selIdx) => {
    clearInterval(timerRef.current);
    const currQ = game.questions[game.qIndex];
    const isCorrect = selIdx === currQ.c;
    
    setFeedback({ type: isCorrect ? 'correct' : 'wrong', correctIdx: currQ.c, selectedIdx: selIdx, expl: currQ.e });

    if (isCorrect) {
      playSound('correct');
      const earnedCoins = 10 + (game.streak * 2);
      setUserState(prev => ({ ...prev, coins: prev.coins + earnedCoins }));
      setGame(p => ({ ...p, score: p.score + 1, streak: p.streak + 1 }));
    } else {
      playSound('wrong');
      setGame(p => ({ ...p, streak: 0 }));
    }

    setTimeout(() => {
      if (game.qIndex + 1 >= game.questions.length) {
        finishGame(isCorrect);
      } else {
        setGame(p => ({ ...p, qIndex: p.qIndex + 1, timeLeft: 30, frozen: false, hiddenOptions: [] }));
        setFeedback(null);
      }
    }, 2500);
  };

  const finishGame = (lastCorrect) => {
    const finalScore = game.score + (lastCorrect ? 1 : 0);
    const total = game.questions.length;
    const percent = (finalScore / total) * 100;
    const currLevel = game.levelIdx + 1;
    const unlocked = userState.unlockedLevels[game.category] || 1;
    let newUnlocked = unlocked;
    
    if (percent >= 70 && currLevel === unlocked && currLevel < 3) newUnlocked = unlocked + 1;

    const isMastered = percent === 100;
    if (isMastered) {
        setShowConfetti(true);
        playSound('win');
    } else if (percent >= 70) {
        playSound('win');
    }

    setUserState(prev => ({
      ...prev,
      unlockedLevels: { ...prev.unlockedLevels, [game.category]: newUnlocked },
      mastery: isMastered ? { ...prev.mastery, [`${game.category}_${currLevel}`]: true } : prev.mastery
    }));

    if(db && userState.name !== 'Guest') {
      addDoc(collection(db, "scores"), {
        player: userState.name, score: finalScore * 100, category: game.category, level: currLevel, avatar: userState.avatar, timestamp: new Date().toISOString()
      }).catch(e => console.error(e));
    }
    setScreen('results');
  };

  const useLifeline = (type) => {
    if (!game.activeLifelines[type] || userState.inventory[type] <= 0 || feedback) return;
    setUserState(prev => ({ ...prev, inventory: { ...prev.inventory, [type]: prev.inventory[type] - 1 } }));
    setGame(prev => ({ ...prev, activeLifelines: { ...prev.activeLifelines, [type]: false } }));

    if (type === 'fifty') {
      playSound('click');
      const currQ = game.questions[game.qIndex];
      let wrong = currQ.o.map((_, i) => i).filter(i => i !== currQ.c);
      setGame(prev => ({ ...prev, hiddenOptions: shuffleArray(wrong).slice(0, 2) }));
    } else if (type === 'freeze') {
      playSound('buy');
      setGame(prev => ({ ...prev, frozen: true }));
      clearInterval(timerRef.current);
    }
  };

  const buyItem = (item, cost, type) => {
    if (userState.coins >= cost) {
      playSound('buy');
      setUserState(prev => {
        if(type === 'lifeline') return { ...prev, coins: prev.coins - cost, inventory: { ...prev.inventory, [item]: prev.inventory[item] + 1 } };
        else return { ...prev, coins: prev.coins - cost, unlockedAvatars: [...prev.unlockedAvatars, item], avatar: item }
      });
    } else { playSound('wrong'); }
  };

  // ==========================================
  // 🖥️ RENDERERS (RESPONSIVE UPDATES)
  // ==========================================

  const renderDailyRewardModal = () => (
      <AnimatePresence>
        {showRewardModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <motion.div initial={{scale:0.8, y: 50}} animate={{scale:1, y:0}} exit={{scale:0.8, y:50}} className={`w-full max-w-sm p-6 md:p-8 rounded-3xl text-center shadow-2xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
                    <div className="text-5xl md:text-6xl mb-4">🎁</div>
                    <h2 className="text-xl md:text-2xl font-black mb-2">Daily Login Bonus!</h2>
                    <p className="mb-6 opacity-70 text-sm md:text-base">Thanks for coming back today.</p>
                    <div className="flex justify-center items-center gap-2 text-2xl md:text-3xl font-black text-yellow-500 mb-8 bg-yellow-500/10 py-3 md:py-4 rounded-xl">
                        <Icons.Coin /> +50
                    </div>
                    <button onClick={claimDailyReward} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition">
                        Claim Reward
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
  
  const renderDashboard = () => {
    const currentAvatar = AVATARS.find(a => a.id === userState.avatar);
    
    return (
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="w-full max-w-5xl pb-20">
        {/* RESPONSIVE TOP BAR */}
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-center mb-6 md:mb-8 bg-white/10 backdrop-blur-md p-4 rounded-3xl border shadow-xl ${darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/60 border-white/50'}`}>
          
          <button onClick={() => setScreen('profile')} className="flex items-center gap-3 hover:opacity-80 transition text-left group w-full md:w-auto">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-lg border-4 border-indigo-400 group-hover:scale-105 transition">
               {currentAvatar.icon}
             </div>
             <div>
               <h2 className={`font-bold text-lg md:text-xl leading-tight ${darkMode?'text-white':'text-slate-800'}`}>{userState.name}</h2>
               <div className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${darkMode?'text-indigo-300':'text-indigo-500'}`}>Lv. {Object.values(userState.unlockedLevels).reduce((a,b)=>a+b,0)} Explorer</div>
             </div>
          </button>

          <div className="flex items-center justify-between w-full md:w-auto gap-3">
             <button onClick={() => setScreen('leaderboard')} className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 text-yellow-600 border border-yellow-500/30 hover:scale-105 transition shadow-sm">
                <span className="text-xl md:text-2xl">🏆</span>
             </button>

             <div className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-md pl-4 pr-6 py-3 rounded-full border border-slate-700/50 shadow-inner">
                <Icons.Coin />
                <span className="font-mono font-black text-yellow-400 text-lg md:text-xl">{userState.coins}</span>
             </div>
             <button onClick={() => setScreen('shop')} className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl hover:scale-105 transition shadow-lg ring-4 ring-indigo-600/20"><Icons.Shop /></button>
          </div>
        </div>

        {/* CAMPAIGN GRID */}
        <h3 className={`text-2xl md:text-3xl font-black mb-6 md:mb-8 ${darkMode?'text-white':'text-slate-800'}`}>Campaigns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Object.keys(campaignData).map(cat => {
            const unlocked = userState.unlockedLevels[cat] || 1;
            const theme = THEMES[cat];
            
            return (
              <motion.div whileHover={{ y: -5, scale: 1.02 }} key={cat} className={`relative overflow-hidden rounded-[2rem] p-5 md:p-6 border-2 transition-all shadow-2xl group ${darkMode?'bg-slate-800 border-slate-700/60':'bg-white border-white/80'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br ${theme} opacity-20 rounded-bl-[3rem] -mr-8 -mt-8 md:-mr-10 md:-mt-10 transition group-hover:opacity-40 group-hover:scale-110 duration-500`}></div>
                
                <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
                  <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${theme} text-white shadow-lg text-2xl md:text-3xl`}>
                    {Icons[cat] ? Icons[cat]() : '📚'}
                  </div>
                  <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    Level {unlocked}
                  </span>
                </div>

                <h4 className={`text-xl md:text-2xl font-black mb-4 md:mb-6 relative z-10 ${darkMode?'text-white':'text-slate-800'}`}>{cat}</h4>

                <div className="space-y-2 md:space-y-3 relative z-10">
                  {[0,1,2].map(idx => {
                    const lvlNum = idx + 1;
                    const isLocked = lvlNum > unlocked;
                    const isMastered = userState.mastery[`${cat}_${lvlNum}`];
                    
                    return (
                      <button 
                        key={idx}
                        disabled={isLocked}
                        onClick={() => startGame(cat, idx)}
                        className={`w-full flex items-center justify-between p-3 md:p-4 rounded-2xl border-2 text-xs md:text-sm font-bold transition-all group/btn
                          ${isLocked 
                            ? 'opacity-50 grayscale bg-slate-100/50 dark:bg-slate-900/50 border-transparent cursor-not-allowed' 
                            : `hover:pl-6 bg-transparent ${isMastered ? 'border-yellow-400/60 text-yellow-600 dark:text-yellow-400 bg-yellow-50/10' : 'border-slate-200 dark:border-slate-700/60 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`
                          }
                        `}
                      >
                          <span className="flex items-center gap-3">
                            <span className="text-base md:text-lg">{isLocked ? '🔒' : (isMastered ? '⭐' : '🟢')}</span> Level {lvlNum}
                          </span>
                          {!isLocked && <span className="hidden md:inline text-xs opacity-50 group-hover/btn:opacity-100 transition-opacity">Play Now →</span>}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* SETTINGS AREA */}
          <div className="mt-12 flex justify-center gap-4">
              <button onClick={() => setDarkMode(!darkMode)} className="px-6 py-3 md:px-8 md:py-3 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-sm md:text-base text-slate-600 dark:text-slate-300 hover:scale-105 transition shadow-sm">
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
          </div>
      </motion.div>
    );
  };

  const renderShop = () => (
    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="max-w-2xl w-full">
       <div className="flex flex-col md:flex-row items-center mb-8 gap-4">
         <div className="flex items-center w-full md:w-auto">
            <button onClick={() => setScreen('home')} className="p-3 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:scale-110 transition"><Icons.Back /></button>
            <h2 className={`text-3xl md:text-4xl font-black ${darkMode?'text-white':'text-slate-800'}`}>Item Shop</h2>
         </div>
         <div className="ml-auto w-full md:w-auto flex justify-center items-center gap-2 bg-slate-900 px-5 py-3 rounded-full text-yellow-400 font-mono font-black text-xl shadow-inner">
            <Icons.Coin /> {userState.coins}
         </div>
       </div>

       {/* LIFELINES */}
       <div className={`p-6 md:p-8 rounded-[2rem] border-2 mb-8 shadow-xl ${darkMode?'bg-slate-800/50 border-slate-700/50':'bg-white border-slate-200/80'}`}>
         <h3 className="text-xl md:text-2xl font-black mb-6 text-indigo-500 uppercase tracking-wider">Power-Ups</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {[{id:'fifty', icon:'✂️', name:'50:50', cost:100, color:'bg-blue-500'}, {id:'freeze', icon:'❄️', name:'Freeze', cost:150, color:'bg-cyan-500'}].map(item => (
                <div key={item.id} className="p-4 md:p-6 border-2 rounded-3xl flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center dark:border-slate-600/60 hover:scale-105 transition bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/30">
                    <div className="flex items-center sm:block gap-4">
                        <div className={`text-3xl md:text-5xl mb-0 md:mb-3 p-3 md:p-4 rounded-full text-white shadow-lg ${item.color}`}>{item.icon}</div>
                        <div className="text-left sm:text-center">
                            <div className={`font-bold text-lg md:text-xl ${darkMode?'text-white':'text-slate-800'}`}>{item.name}</div>
                            <div className="text-xs md:text-sm text-slate-500 font-bold">Owned: {userState.inventory[item.id]}</div>
                        </div>
                    </div>
                    <button onClick={() => buyItem(item.id, item.cost, 'lifeline')} className="px-4 py-2 md:px-6 bg-green-500 text-white rounded-full font-bold text-xs md:text-sm shadow-md hover:bg-green-400 transition flex items-center gap-2">
                        Buy <span className="bg-black/20 px-2 rounded-full">{item.cost} 🪙</span>
                    </button>
                </div>
            ))}
         </div>
       </div>

       {/* AVATARS */}
       <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-xl ${darkMode?'bg-slate-800/50 border-slate-700/50':'bg-white border-slate-200/80'}`}>
         <h3 className="text-xl md:text-2xl font-black mb-6 text-purple-500 uppercase tracking-wider">Avatars</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {AVATARS.map(av => {
               const owned = userState.unlockedAvatars.includes(av.id);
               const selected = userState.avatar === av.id;
               return (
                 <motion.div whileHover={{scale:1.05}} key={av.id} className={`p-4 rounded-3xl border-2 flex flex-col items-center transition cursor-pointer ${selected ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 ring-4 ring-green-500/20' : 'dark:border-slate-600/60 hover:border-purple-400'}`}>
                    <div className="text-4xl md:text-5xl mb-2 filter drop-shadow-md">{av.icon}</div>
                    <div className={`text-sm font-bold mb-3 ${darkMode?'text-white':'text-slate-800'}`}>{av.name}</div>
                    {owned ? (
                      <button disabled={selected} onClick={() => setUserState(p => ({...p, avatar: av.id}))} className={`text-xs px-3 py-2 rounded-full font-bold transition w-full ${selected ? 'bg-green-500 text-white shadow-inner' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {selected ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => buyItem(av.id, av.cost, 'avatar')} className="text-xs px-3 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black shadow-md hover:from-yellow-300 hover:to-orange-400 transition w-full flex justify-center items-center gap-1">
                        {av.cost} 🪙
                      </button>
                    )}
                 </motion.div>
               )
            })}
         </div>
       </div>
    </motion.div>
  );

  const renderQuiz = () => {
    const q = game.questions[game.qIndex];
    if(!q) return null;

    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = ((30 - game.timeLeft) / 30) * circumference;
    const timerColor = game.timeLeft > 15 ? 'text-green-500' : game.timeLeft > 7 ? 'text-yellow-500' : 'text-red-500';

    return (
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="max-w-2xl w-full pb-10">
         {/* HEADER */}
         <div className="flex justify-between items-center mb-6 md:mb-8">
            <button onClick={() => {clearInterval(timerRef.current); setScreen('home')}} className={`text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition ${darkMode?'text-slate-400':'text-slate-500'}`}>
                <Icons.Back /> {game.category}
            </button>
            <div className="flex gap-2 md:gap-3">
               <div className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-orange-100 text-orange-600 font-black text-xs md:text-sm shadow-sm flex items-center gap-1">🔥 {game.streak}</div>
               <div className="px-3 py-1 md:px-4 md:py-2 rounded-full bg-indigo-100 text-indigo-600 font-black text-xs md:text-sm shadow-sm flex items-center gap-1">⭐ {game.score}</div>
            </div>
         </div>

         {/* TIMER & QUESTION */}
         <div className="relative mb-6 md:mb-10">
             <div className="absolute -top-10 md:-top-12 left-1/2 transform -translate-x-1/2 z-20 bg-white dark:bg-slate-800 rounded-full p-1.5 md:p-2 shadow-2xl">
                 <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 70 70">
                        <circle cx="35" cy="35" r={radius} stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200 dark:text-slate-700" />
                        <circle cx="35" cy="35" r={radius} stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round" className={`transition-all duration-100 ease-linear ${timerColor}`} />
                    </svg>
                    <span className={`absolute text-xl md:text-2xl font-black ${timerColor}`}>{Math.ceil(game.timeLeft)}</span>
                 </div>
             </div>

             <div className={`pt-12 md:pt-16 pb-8 px-6 rounded-[2rem] md:rounded-[2.5rem] border-2 shadow-2xl text-center min-h-[180px] md:min-h-[220px] flex items-center justify-center relative z-10 ${darkMode?'bg-slate-800/90 border-slate-700/50 text-white backdrop-blur-md':'bg-white/90 border-slate-200/80 text-slate-900 backdrop-blur-md'}`}>
                <h2 className="text-xl md:text-3xl font-bold leading-tight">{q.q}</h2>
             </div>
         </div>

         {/* OPTIONS */}
         <div className="grid grid-cols-1 gap-3 md:gap-4 mb-6 md:mb-10">
            {q.o.map((opt, i) => {
               if(game.hiddenOptions.includes(i)) return <div key={i} className="h-14 md:h-16 opacity-0 pointer-events-none"></div>;

               let stateStyle = "";
               if (feedback) {
                  if (i === feedback.correctIdx) stateStyle = "bg-green-500 text-white border-green-500 shadow-green-200 dark:shadow-none scale-105";
                  else if (i === feedback.selectedIdx) stateStyle = "bg-red-500 text-white border-red-500 shadow-red-200 dark:shadow-none shake";
                  else stateStyle = "opacity-40 grayscale scale-95";
               } else {
                  stateStyle = darkMode ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:border-indigo-500 hover:shadow-indigo-500/20" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-indigo-400 hover:shadow-indigo-200";
               }

               return (
                 <button key={i} disabled={!!feedback} onClick={() => handleAnswer(i)} className={`p-4 md:p-5 rounded-2xl border-2 font-bold text-lg md:text-xl transition-all transform active:scale-95 shadow-md ${stateStyle}`}>
                   {opt}
                 </button>
               )
            })}
         </div>

         {/* LIFELINES */}
         <div className="flex justify-center gap-4 md:gap-6">
             {[{id:'fifty', icon:'✂️', bg:'bg-blue-500'}, {id:'freeze', icon:'❄️', bg:'bg-cyan-500'}].map(l => (
                <button key={l.id} onClick={() => useLifeline(l.id)} disabled={!game.activeLifelines[l.id] || userState.inventory[l.id] <= 0 || !!feedback} className="flex flex-col items-center gap-2 disabled:opacity-40 disabled:grayscale transition group">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${l.bg} text-white flex items-center justify-center text-2xl md:text-3xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition border-4 border-white/20`}>{l.icon}</div>
                    <span className="px-2 py-1 md:px-3 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-300 shadow-sm">{userState.inventory[l.id]} Left</span>
                </button>
             ))}
         </div>

         {/* EXPLANATION POPUP */}
         <AnimatePresence>
            {feedback && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className={`mt-6 md:mt-8 p-4 md:p-6 rounded-2xl text-center border-2 shadow-xl ${feedback.type === 'correct' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="text-3xl md:text-4xl mb-2">{feedback.type === 'correct' ? '🎉' : '💡'}</div>
                <span className="font-bold text-base md:text-lg">{feedback.expl}</span>
            </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
    );
  };

  const renderResults = () => {
    const isWin = game.score / game.questions.length >= 0.7;
    return (
        <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="max-w-md w-full text-center pt-6 md:pt-10 relative">
            <motion.div initial={{scale:0}} animate={{scale:1, rotate:[0, -10, 10, 0]}} transition={{delay:0.2, type:'spring'}} className="text-7xl md:text-8xl mb-4 md:mb-6 filter drop-shadow-2xl">
                {showConfetti && <Confetti recycle={false} numberOfPieces={width < 600 ? 200 : 500} gravity={0.2} />}
                {isWin ? '🏆' : '😓'}
            </motion.div>
            <h2 className={`text-4xl md:text-5xl font-black mb-3 ${darkMode?'text-white':'text-slate-800'}`}>
                {isWin ? 'Level Complete!' : 'Try Again!'}
            </h2>
            <p className="text-slate-500 mb-8 md:mb-10 font-bold text-lg md:text-xl">You scored {game.score} / {game.questions.length}</p>

            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                <motion.div initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.4}} className="p-4 md:p-6 rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-200 shadow-lg">
                    <div className="text-3xl md:text-4xl mb-2">🪙</div>
                    <div className="font-black text-xl md:text-2xl text-yellow-700">+{game.score * 10}</div>
                    <div className="text-[10px] md:text-xs font-bold text-yellow-600 uppercase">Coins Earned</div>
                </motion.div>
                <motion.div initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.6}} className="p-4 md:p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg">
                    <div className="text-3xl md:text-4xl mb-2">🔥</div>
                    <div className="font-black text-xl md:text-2xl text-blue-700">{game.score}</div>
                     <div className="text-[10px] md:text-xs font-bold text-blue-600 uppercase">XP Gained</div>
                </motion.div>
            </div>

            <button onClick={() => setScreen('home')} className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg md:text-xl shadow-xl hover:scale-105 transition mb-4">
                Continue
            </button>
            <button onClick={() => startGame(game.category, game.levelIdx)} className="w-full py-4 rounded-2xl border-2 border-slate-300 text-slate-500 font-bold hover:bg-slate-100 transition">
                Replay Level
            </button>
        </motion.div>
    )
  }

  const renderLeaderboard = () => {
    const displayData = leaderboard; 
    return (
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="max-w-2xl w-full pb-10">
        <div className="flex items-center mb-6 md:mb-8">
          <button onClick={() => { playSound('click'); setScreen('home'); }} className="p-3 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 transition hover:scale-110">
            <Icons.Back />
          </button>
          <h2 className={`text-3xl md:text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Global Rankings</h2>
        </div>

        <div className={`rounded-[2rem] md:rounded-[2.5rem] border-2 overflow-hidden shadow-2xl min-h-[400px] ${darkMode ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-md' : 'bg-white/80 border-slate-200/80 backdrop-blur-md'}`}>
          <div className={`grid grid-cols-12 gap-2 md:gap-4 p-4 md:p-6 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 ${darkMode ? 'bg-slate-900/30 border-slate-700/50 text-slate-400' : 'bg-slate-50/50 border-slate-200/50 text-slate-500'}`}>
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-7">Player</div>
            <div className="col-span-3 text-right">Score</div>
          </div>

          {displayData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 opacity-70">
               <div className="text-6xl mb-4 grayscale">💤</div>
               <p className="font-bold text-xl">No champions yet.</p>
               <p className="text-sm mt-2 font-bold uppercase tracking-wider">Be the first!</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {displayData.map((entry, index) => {
                const ava = AVATARS.find(a => a.id === entry.avatar) || AVATARS[0];
                const rankIcons = ['🥇','🥈','🥉'];
                const isTop3 = index < 3;
                
                return (
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: index * 0.05}} key={entry.id || index} className={`grid grid-cols-12 gap-2 md:gap-4 p-4 md:p-5 items-center border-b last:border-0 transition hover:bg-white/10 dark:hover:bg-black/10 ${darkMode ? 'border-slate-700/50 text-white' : 'border-slate-100 text-slate-800'} ${entry.player === userState.name ? (darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50') : ''}`}>
                    <div className="col-span-2 text-center font-black text-xl md:text-2xl flex justify-center">
                      {isTop3 ? rankIcons[index] : <span className="opacity-50 text-sm md:text-lg">#{index + 1}</span>}
                    </div>
                    <div className="col-span-7 flex items-center gap-2 md:gap-4">
                      <div className="text-2xl md:text-3xl filter drop-shadow-sm">{ava.icon}</div>
                      <div className="flex flex-col truncate">
                        <span className={`font-bold text-sm md:text-lg truncate ${entry.player === userState.name ? 'text-indigo-500' : ''}`}>{entry.player} {entry.player === userState.name && '(You)'}</span>
                        <span className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full w-fit mt-1">{entry.category} • Lvl {entry.level}</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-mono font-black text-sm md:text-xl text-indigo-500">
                      {entry.score.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderProfile = () => {
    const currentAvatar = AVATARS.find(a => a.id === userState.avatar);
    const totalLevels = Object.keys(campaignData).length * 3;
    const unlockedCount = Object.values(userState.unlockedLevels).reduce((a, b) => a + b, 0) - Object.keys(campaignData).length;
    const progressPercent = Math.round((unlockedCount / (totalLevels - Object.keys(campaignData).length)) * 100) || 0;
    const masteryCount = Object.keys(userState.mastery).length;

    const handleReset = () => {
        if(window.confirm("Are you sure? This deletes all progress, coins, and items permanently.")) {
            localStorage.removeItem('quizUltraPro_v2'); window.location.reload();
        }
    };

    return (
      <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition} className="max-w-md w-full pb-10">
        <div className="flex items-center mb-6 md:mb-8">
          <button onClick={() => { playSound('click'); setScreen('home'); }} className="p-3 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 transition hover:scale-110">
            <Icons.Back />
          </button>
          <h2 className={`text-3xl md:text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>My Profile</h2>
        </div>

        <div className={`relative p-6 md:p-10 rounded-[2.5rem] border-2 text-center mb-6 md:mb-8 shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20`}></div>
           <div className="relative z-10">
             <motion.div whileHover={{rotate:10, scale:1.05}} className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-6xl md:text-7xl shadow-2xl border-8 border-white dark:border-slate-800 mb-6">
                {currentAvatar.icon}
             </motion.div>
             <h3 className={`text-2xl md:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{userState.name}</h3>
             <div className="text-indigo-500 font-bold uppercase text-xs md:text-sm tracking-widest mt-2 mb-6">Quiz Explorer</div>
             <button onClick={() => { const name = prompt("Enter new name:", userState.name); if(name) setUserState(p => ({...p, name})); }} className="px-6 py-2 text-sm font-bold rounded-full border-2 border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition hover:text-slate-700 dark:hover:text-white">
                Edit Name ✏️
             </button>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
            {[{icon:'⭐', val:masteryCount, label:'Perfect Levels'}, {icon:'🚀', val:`${progressPercent}%`, label:'Game Complete'}, {icon:'🎒', val:Object.values(userState.inventory).reduce((a,b)=>a+b, 0), label:'Items Owned'}, {icon:'🤖', val:`${userState.unlockedAvatars.length}/${AVATARS.length}`, label:'Avatars Unlocked'}].map((stat, i) => (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} key={i} className={`p-4 md:p-6 rounded-3xl border-2 shadow-lg ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200/80'}`}>
                    <div className="text-3xl md:text-4xl mb-2 filter drop-shadow-sm">{stat.icon}</div>
                    <div className={`font-black text-xl md:text-2xl ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stat.val}</div>
                    <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                </motion.div>
            ))}
        </div>
        <button onClick={handleReset} className="w-full py-4 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 font-bold transition uppercase tracking-widest text-sm">
            Reset All Progress
        </button>
      </motion.div>
    );
  };

  // ==========================================
  // 🏁 MAIN RENDER
  // ==========================================
  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-6 font-sans transition-colors duration-500 overflow-x-hidden ${darkMode ? 'bg-slate-900 selection:bg-indigo-500/30' : 'bg-slate-50 selection:bg-indigo-200'}`}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={width < 600 ? 200 : 500} gravity={0.2} />}
      {renderDailyRewardModal()}
      
      <AnimatePresence mode="wait">
        {screen === 'home' && <motion.div key="home" className="w-full flex justify-center">{renderDashboard()}</motion.div>}
        {screen === 'shop' && <motion.div key="shop" className="w-full flex justify-center">{renderShop()}</motion.div>}
        {screen === 'quiz' && <motion.div key="quiz" className="w-full flex justify-center">{renderQuiz()}</motion.div>}
        {screen === 'results' && <motion.div key="results" className="w-full flex justify-center">{renderResults()}</motion.div>}
        {screen === 'leaderboard' && <motion.div key="leaderboard" className="w-full flex justify-center">{renderLeaderboard()}</motion.div>}
        {screen === 'profile' && <motion.div key="profile" className="w-full flex justify-center">{renderProfile()}</motion.div>}
      </AnimatePresence>
    </div>
  );
}