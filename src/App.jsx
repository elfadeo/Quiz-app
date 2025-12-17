import React, { useState, useEffect, useRef } from 'react';
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    },
    wrong: () => {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    },
    click: () => {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    },
    buy: () => {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    },
    win: () => {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.6);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
      });
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
  Shop: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Back: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Trophy: () => <span className="text-2xl">🏆</span>,
  Profile: () => <span className="text-2xl">👤</span>,
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
// 📚 DATA POOL (Expanded for Randomization)
// ==========================================
// Note: I added extra questions to Math Level 1 to demonstrate the random subset logic.
const campaignData = {
  Math: [
    { 
      level: 1, 
      title: "Mental Math", 
      questions: [ 
        { q: "12 + 15?", o: ["25","27","30","22"], c: 1, e: "Simple addition." }, 
        { q: "9 x 9?", o: ["80","81","72","90"], c: 1, e: "Multiplication." }, 
        { q: "50 / 2?", o: ["20","25","30","15"], c: 1, e: "Half of 50." }, 
        { q: "100 - 45?", o: ["55","65","45","35"], c: 0, e: "Subtraction." }, 
        { q: "Square root of 16?", o: ["2","3","4","5"], c: 2, e: "4x4=16" },
        // EXTRA QUESTIONS FOR POOLING
        { q: "5 x 6?", o: ["30","36","25","40"], c: 0, e: "Multiplication." },
        { q: "10 + 20 + 30?", o: ["50","60","70","40"], c: 1, e: "Addition chain." },
        { q: "Half of 12?", o: ["6","5","7","4"], c: 0, e: "Division." },
        { q: "20 - 7?", o: ["13","12","14","11"], c: 0, e: "Subtraction." },
        { q: "10 x 10?", o: ["100","1000","10","50"], c: 0, e: "Powers of 10." }
      ] 
    },
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

// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================
export default function QuizApp() {
  const [screen, setScreen] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  
  // USER STATE
  const [userState, setUserState] = useState(() => {
    const saved = localStorage.getItem('quizGame');
    return saved ? JSON.parse(saved) : {
      name: 'Guest',
      coins: 100, 
      inventory: { fifty: 1, freeze: 1 },
      unlockedLevels: { Math: 1, Science: 1, History: 1, Geography: 1, Technology: 1, Entertainment: 1, Sports: 1 },
      mastery: {}, 
      avatar: 'robot',
      unlockedAvatars: ['robot']
    };
  });

  useEffect(() => { localStorage.setItem('quizGame', JSON.stringify(userState)); }, [userState]);

  // GAME SESSION STATE
  const [game, setGame] = useState({
    category: null,
    levelIdx: 0,
    questions: [],
    qIndex: 0,
    score: 0,
    streak: 0,
    timeLeft: 30,
    frozen: false,
    activeLifelines: { fifty: true, freeze: true }, 
    hiddenOptions: []
  });

  const [feedback, setFeedback] = useState(null); 
  const timerRef = useRef(null);
  
  // --- LEADERBOARD SYNC ---
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    if(db) {
      try {
        const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
        return onSnapshot(q, s => setLeaderboard(s.docs.map(d => ({...d.data(), id:d.id}))));
      } catch(e) {}
    }
  }, []);

  // --- TIMER ---
  useEffect(() => {
    if (screen === 'quiz' && !feedback && !game.frozen) {
      timerRef.current = setInterval(() => {
        setGame(prev => {
          if (prev.timeLeft <= 1) { clearInterval(timerRef.current); handleAnswer(-1); return prev; }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [screen, game.qIndex, feedback, game.frozen]);

  // ==========================================
  // 🎮 ACTIONS
  // ==========================================

  const startGame = (cat, lvlIdx) => {
    // 1. Check Level Lock
    const unlocked = userState.unlockedLevels[cat] || 1;
    if (lvlIdx + 1 > unlocked) { playSound('wrong'); return; }

    // 2. Get the "Pool" of questions for this level
    const rawQs = campaignData[cat][lvlIdx].questions;
    
    // 3. Process them (shuffle the options)
    const processedQs = rawQs.map(q => {
      const originalOpts = q.o;
      const correctTxt = originalOpts[q.c];
      const shuffled = shuffleArray([...originalOpts]);
      return { ...q, o: shuffled, c: shuffled.indexOf(correctTxt) };
    });

    // 4. RANDOMIZATION FIX:
    // Shuffle the ENTIRE pool first, then pick the first 5.
    // This ensures if Player A and B both hit start, they get different orders 
    // and likely different questions if the pool is > 5.
    const fullDeck = shuffleArray(processedQs);
    const gameDeck = fullDeck.slice(0, 5); // Take top 5 cards

    setGame({
      category: cat,
      levelIdx: lvlIdx,
      questions: gameDeck,
      qIndex: 0,
      score: 0,
      streak: 0,
      timeLeft: 30,
      frozen: false,
      activeLifelines: { fifty: true, freeze: true },
      hiddenOptions: []
    });
    setFeedback(null);
    setScreen('quiz');
    playSound('click');
  };

  const handleAnswer = (selIdx) => {
    clearInterval(timerRef.current);
    const currQ = game.questions[game.qIndex];
    const isCorrect = selIdx === currQ.c;
    
    setFeedback({
      type: isCorrect ? 'correct' : 'wrong',
      correctIdx: currQ.c,
      selectedIdx: selIdx,
      expl: currQ.e
    });

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
        setGame(p => ({ 
          ...p, qIndex: p.qIndex + 1, timeLeft: 30, frozen: false, hiddenOptions: [] 
        }));
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
    
    if (percent >= 70 && currLevel === unlocked && currLevel < 3) {
       newUnlocked = unlocked + 1;
       playSound('win');
    } else if (percent >= 70) {
       playSound('win');
    }

    const isMastered = percent === 100;
    const masterKey = `${game.category}_${currLevel}`;
    
    setUserState(prev => ({
      ...prev,
      unlockedLevels: { ...prev.unlockedLevels, [game.category]: newUnlocked },
      mastery: isMastered ? { ...prev.mastery, [masterKey]: true } : prev.mastery
    }));

    if(db && userState.name !== 'Guest') {
      addDoc(collection(db, "scores"), {
        player: userState.name,
        score: finalScore * 100,
        category: game.category,
        level: currLevel,
        avatar: userState.avatar,
        timestamp: new Date().toISOString()
      }).catch(e=>console.log(e));
    }

    setScreen('results');
  };

  const useLifeline = (type) => {
    if (!game.activeLifelines[type] || userState.inventory[type] <= 0 || feedback) return;

    setUserState(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [type]: prev.inventory[type] - 1 }
    }));
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
        if(type === 'lifeline') {
          return {
             ...prev, coins: prev.coins - cost,
             inventory: { ...prev.inventory, [item]: prev.inventory[item] + 1 }
          };
        } else {
          return {
            ...prev, coins: prev.coins - cost,
            unlockedAvatars: [...prev.unlockedAvatars, item],
            avatar: item
          }
        }
      });
    } else {
      playSound('wrong');
    }
  };

  // ==========================================
  // 🖥️ RENDERERS (Vibrant Game Style)
  // ==========================================

  const renderLeaderboard = () => (
    <div className="max-w-2xl w-full animate-fade-in pb-20">
      <div className="flex items-center mb-8">
        <button onClick={() => setScreen('home')} className="p-2 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 transition hover:bg-white dark:hover:bg-slate-600 shadow-sm"><Icons.Back /></button>
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Global Rankings</h2>
      </div>

      <div className={`rounded-3xl border overflow-hidden shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="grid grid-cols-4 p-4 font-bold border-b text-sm opacity-50 dark:border-slate-700">
          <span>Rank</span>
          <span className="col-span-2">Player</span>
          <span className="text-right">Score</span>
        </div>
        
        {leaderboard.map((entry, i) => {
             const isMe = entry.player === userState.name;
             return (
              <div key={i} className={`grid grid-cols-4 p-4 items-center border-b last:border-0 transition ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''} ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm 
                    ${i === 0 ? 'bg-yellow-400 text-yellow-900 shadow-md' : 
                      i === 1 ? 'bg-slate-300 text-slate-800' : 
                      i === 2 ? 'bg-orange-300 text-orange-900' : 
                      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <span className="text-xl">{AVATARS.find(a => a.id === entry.avatar)?.icon || '🤖'}</span>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${darkMode?'text-white':'text-slate-800'}`}>{entry.player}</span>
                    <span className="text-[10px] uppercase opacity-50">{entry.category} • Lvl {entry.level}</span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-indigo-500 dark:text-indigo-400">{entry.score.toLocaleString()}</div>
              </div>
            );
        })}
      </div>
    </div>
  );

  const renderProfile = () => {
    const currentAvatar = AVATARS.find(a => a.id === userState.avatar);
    return (
      <div className="max-w-2xl w-full animate-fade-in pb-20">
        <div className="flex items-center mb-6">
          <button onClick={() => setScreen('home')} className="p-2 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-white transition"><Icons.Back /></button>
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Player Profile</h2>
        </div>

        <div className={`p-8 rounded-3xl mb-6 text-center relative overflow-hidden shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20"></div>
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-5xl shadow-xl ring-4 ring-white dark:ring-slate-800 mb-4">{currentAvatar.icon}</div>
            <h2 className={`text-3xl font-bold mb-1 ${darkMode?'text-white':'text-slate-800'}`}>{userState.name}</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <div className="text-2xl mb-1">🪙</div>
              <div className="font-bold text-lg dark:text-white">{userState.coins}</div>
              <div className="text-xs text-slate-400 uppercase font-bold">Wealth</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
               <div className="text-2xl mb-1">⭐</div>
               <div className="font-bold text-lg dark:text-white">{Object.keys(userState.mastery).length}</div>
               <div className="text-xs text-slate-400 uppercase font-bold">Mastery</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
               <div className="text-2xl mb-1">🎒</div>
               <div className="font-bold text-lg dark:text-white">{userState.unlockedAvatars.length}</div>
               <div className="text-xs text-slate-400 uppercase font-bold">Avatars</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDashboard = () => {
    const currentAvatar = AVATARS.find(a => a.id === userState.avatar);
    
    return (
      <div className="w-full max-w-5xl animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-slate-700 shadow-xl">
          <button onClick={() => setScreen('profile')} className="flex items-center gap-3 group text-left">
             <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-blue-300 transition group-hover:scale-105">{currentAvatar.icon}</div>
             <div className="hidden sm:block">
               <h2 className={`font-bold text-lg leading-tight ${darkMode?'text-white':'text-slate-800'}`}>{userState.name}</h2>
               <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">View Profile</div>
             </div>
          </button>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-900/80 dark:bg-black/50 px-4 py-2 rounded-full border border-yellow-500/30 shadow-sm">
                <Icons.Coin />
                <span className="font-mono font-bold text-yellow-400 text-lg">{userState.coins}</span>
             </div>
             {/* Vibrant Buttons restored */}
             <button onClick={() => setScreen('leaderboard')} className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-400 transition shadow-lg ring-2 ring-orange-500/30 active:scale-95"><Icons.Trophy /></button>
             <button onClick={() => setScreen('shop')} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-400 transition shadow-lg ring-2 ring-green-500/30 active:scale-95"><Icons.Shop /></button>
          </div>
        </div>

        <h3 className={`text-2xl font-bold mb-6 ${darkMode?'text-white':'text-slate-800'}`}>Campaigns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(campaignData).map(cat => {
            const unlocked = userState.unlockedLevels[cat] || 1;
            const theme = THEMES[cat];
            
            return (
              <div key={cat} className={`relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] hover:shadow-2xl shadow-xl group ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-white/60'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme} opacity-10 rounded-bl-full -mr-8 -mt-8 transition duration-500 group-hover:opacity-20 group-hover:scale-110`}></div>
                
                <div className="flex items-start justify-between mb-4 relative">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${theme} text-white shadow-lg transition group-hover:rotate-3`}>{Icons[cat] ? Icons[cat]() : '📚'}</div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Lvl {unlocked}</span>
                </div>

                <h4 className={`text-xl font-bold mb-4 ${darkMode?'text-white':'text-slate-800'}`}>{cat}</h4>

                <div className="space-y-2 relative">
                  {[0,1,2].map(idx => {
                    const lvlNum = idx + 1;
                    const isLocked = lvlNum > unlocked;
                    const isMastered = userState.mastery[`${cat}_${lvlNum}`];
                    
                    return (
                      <button 
                        key={idx}
                        disabled={isLocked}
                        onClick={() => startGame(cat, idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all duration-300
                          ${isLocked 
                            ? 'opacity-40 grayscale bg-slate-50 dark:bg-slate-800/50 border-transparent cursor-not-allowed' 
                            : `hover:pl-5 hover:shadow-md ${isMastered ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-300'}`
                          }
                        `}
                      >
                          <span className="flex items-center gap-3">{isLocked ? '🔒' : (isMastered ? '⭐' : <span className="text-blue-200 dark:text-blue-800">●</span>)} Level {lvlNum}</span>
                          {!isLocked && <span className={`text-xs font-bold opacity-0 transition-all duration-300 ${isLocked ? '' : 'group-hover/btn:opacity-100 group-hover/btn:translate-x-0 -translate-x-2'}`}>Play →</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        
          <div className="mt-12 flex justify-center gap-4 opacity-50 hover:opacity-100 transition">
              <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition">{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
              <button onClick={() => { const name = prompt("Enter Profile Name:", userState.name); if(name) setUserState(p => ({...p, name})); }} className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition">✏️ Edit Name</button>
          </div>
      </div>
    );
  };

  const renderShop = () => (
    <div className="max-w-2xl w-full animate-fade-in">
       <div className="flex items-center mb-6">
         <button onClick={() => setScreen('home')} className="p-2 mr-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-white transition"><Icons.Back /></button>
         <h2 className={`text-3xl font-bold ${darkMode?'text-white':'text-slate-800'}`}>Item Shop</h2>
         <div className="ml-auto flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full text-yellow-400 font-mono font-bold shadow-md"><Icons.Coin /> {userState.coins}</div>
       </div>

       <div className={`p-6 rounded-3xl border mb-6 shadow-lg ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200'}`}>
         <h3 className="text-xl font-bold mb-4 text-blue-500">Power-Ups</h3>
         <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-2xl flex flex-col items-center text-center dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-4xl mb-2">✂️</div>
                <div className={`font-bold ${darkMode?'text-white':'text-slate-800'}`}>50:50</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">Owned: <span className="text-blue-500">{userState.inventory.fifty}</span></div>
                <button onClick={() => buyItem('fifty', 100, 'lifeline')} className="w-full py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-400 active:scale-95 transition">Buy (100 🪙)</button>
            </div>
            <div className="p-4 border rounded-2xl flex flex-col items-center text-center dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-4xl mb-2">❄️</div>
                <div className={`font-bold ${darkMode?'text-white':'text-slate-800'}`}>Freeze</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-bold">Owned: <span className="text-blue-500">{userState.inventory.freeze}</span></div>
                <button onClick={() => buyItem('freeze', 150, 'lifeline')} className="w-full py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-400 active:scale-95 transition">Buy (150 🪙)</button>
            </div>
         </div>
       </div>

       <div className={`p-6 rounded-3xl border shadow-lg ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200'}`}>
         <h3 className="text-xl font-bold mb-4 text-purple-500">Avatars</h3>
         <div className="grid grid-cols-3 gap-4">
            {AVATARS.map(av => {
               const owned = userState.unlockedAvatars.includes(av.id);
               const selected = userState.avatar === av.id;
               return (
                 <div key={av.id} className={`p-3 rounded-2xl border flex flex-col items-center transition-all duration-300 ${selected ? 'border-green-500 ring-2 ring-green-500/30 bg-green-50 dark:bg-green-900/20 scale-105 shadow-md' : 'dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                    <div className="text-3xl mb-2">{av.icon}</div>
                    <div className={`text-sm font-bold mb-2 ${darkMode?'text-white':'text-slate-800'}`}>{av.name}</div>
                    {owned ? (
                      <button disabled={selected} onClick={() => setUserState(p => ({...p, avatar: av.id}))} className={`w-full text-xs px-3 py-1.5 rounded-lg font-bold transition ${selected ? 'bg-green-600 text-white cursor-default' : 'bg-slate-200 text-slate-600 hover:bg-green-100 hover:text-green-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {selected ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => buyItem(av.id, av.cost, 'avatar')} className="w-full text-xs px-3 py-1.5 rounded-lg bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-300 transition shadow-sm">{av.cost} 🪙</button>
                    )}
                 </div>
               )
            })}
         </div>
       </div>
    </div>
  );

  const renderQuiz = () => {
    const q = game.questions[game.qIndex];
    if(!q) return null;

    return (
      <div className="max-w-2xl w-full animate-fade-in pb-10">
          <div className="flex justify-between items-center mb-6">
             <div className={`text-sm font-bold uppercase tracking-widest ${darkMode?'text-slate-400':'text-slate-500'}`}>{game.category}</div>
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                     <button disabled={!game.activeLifelines.fifty} onClick={() => useLifeline('fifty')} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 text-xl transition shadow-sm ${!game.activeLifelines.fifty ? 'opacity-30 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' : 'hover:scale-105 hover:-translate-y-1 bg-white border-blue-200 text-blue-600'}`}>✂️</button>
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500">x{userState.inventory.fifty}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <button disabled={!game.activeLifelines.freeze} onClick={() => useLifeline('freeze')} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 text-xl transition shadow-sm ${!game.activeLifelines.freeze ? 'opacity-30 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' : 'hover:scale-105 hover:-translate-y-1 bg-white border-sky-200 text-sky-600'}`}>❄️</button>
                     <span className="text-xs font-bold text-slate-400 dark:text-slate-500">x{userState.inventory.freeze}</span>
                 </div>
             </div>
          </div>

          <div className="h-3 w-full bg-slate-200 rounded-full mb-8 overflow-hidden dark:bg-slate-700 shadow-inner">
             <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 ease-out" style={{width: `${((game.qIndex)/game.questions.length)*100}%`}}></div>
          </div>

          <div className={`p-8 rounded-[2rem] shadow-2xl border-2 relative overflow-hidden min-h-[450px] flex flex-col justify-between transition-colors duration-300 ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-white'}`}>
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900">
                  <div className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_aaa] ${game.timeLeft < 10 ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50'}`} style={{width: `${(game.timeLeft/30)*100}%`}}></div>
              </div>

              <div className="relative z-10">
                  <h2 className={`text-2xl md:text-3xl font-bold mb-8 mt-6 leading-tight ${darkMode?'text-white':'text-slate-800'}`}>{q.q}</h2>
                  <div className="grid grid-cols-1 gap-4">
                      {q.o.map((opt, i) => {
                          const isHidden = game.hiddenOptions.includes(i);
                          if(isHidden) return <div key={i} className="h-16 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-transparent animate-pulse"></div>;

                          let btnClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 hover:pl-8 hover:shadow-md";
                          
                          if(feedback) {
                              if(i === feedback.correctIdx) btnClass = "!bg-green-500 text-white border-green-500 pl-8 shadow-lg shadow-green-500/30 scale-105";
                              else if(i === feedback.selectedIdx) btnClass = "!bg-red-500 text-white border-red-500 opacity-60 pl-4";
                              else btnClass = "opacity-30 border-transparent bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed";
                          }
                          return (
                              <button key={i} disabled={!!feedback} onClick={() => handleAnswer(i)} className={`w-full text-left p-4 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${btnClass}`}>
                                  <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
                              </button>
                          )
                      })}
                  </div>
              </div>

              {feedback && (
                  <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-700 animate-fade-in relative z-10">
                      <div className={`font-bold text-xl mb-2 flex items-center gap-2 ${feedback.type === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                          {feedback.type === 'correct' ? <span>🎉 Correct!</span> : <span>❌ Incorrect</span>}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-md font-medium leading-relaxed">{feedback.expl}</div>
                  </div>
              )}
          </div>
      </div>
    );
  };

  const renderResults = () => {
    const total = game.questions.length;
    const percent = Math.round((game.score / total) * 100);
    let title = "Nice Try!";
    let emoji = "😅";
    let titleColor = "text-slate-800 dark:text-white";
    if(percent >= 100) { title = "PERFECT!"; emoji = "🏆"; titleColor="text-yellow-500"; }
    else if(percent >= 70) { title = "Well Done!"; emoji = "⭐"; titleColor="text-blue-500"; }

    return (
       <div className="max-w-md w-full animate-fade-in text-center pt-10 pb-20">
           <div className="text-7xl mb-4 animate-bounce">{emoji}</div>
           <h2 className={`text-5xl font-bold mb-2 ${titleColor}`}>{title}</h2>
           <p className="text-slate-500 dark:text-slate-400 text-xl mb-10 font-bold">You scored {percent}%</p>
           
           <div className={`p-8 rounded-[2rem] border-2 mb-10 flex justify-between items-center shadow-xl ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-white'}`}>
               <div className="text-left">
                   <div className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-1">Correct</div>
                   <div className={`text-4xl font-bold ${darkMode?'text-white':'text-slate-800'}`}>{game.score}<span className="text-lg text-slate-400">/{total}</span></div>
               </div>
               <div className="text-right">
                   <div className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-1">Earned</div>
                   <div className="text-4xl font-bold text-yellow-400 flex items-center justify-end gap-1">+{10 * game.score} <Icons.Coin /></div>
               </div>
           </div>

           <div className="space-y-4">
               <button onClick={() => startGame(game.category, game.levelIdx)} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-xl shadow-lg hover:bg-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-95">Replay Level</button>
               <button onClick={() => setScreen('home')} className="w-full py-4 rounded-2xl bg-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all duration-300 active:scale-95">Back to Dashboard</button>
           </div>
       </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 selection:bg-blue-500 selection:text-white
      ${darkMode ? 'bg-slate-900 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black' : 'bg-slate-50 text-slate-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white'} 
      flex flex-col items-center pt-8 px-4`}>
      {screen === 'home' && renderDashboard()}
      {screen === 'shop' && renderShop()}
      {screen === 'leaderboard' && renderLeaderboard()}
      {screen === 'profile' && renderProfile()}
      {screen === 'quiz' && renderQuiz()}
      {screen === 'results' && renderResults()}
    </div>
  );
}