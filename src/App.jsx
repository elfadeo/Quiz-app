import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import VersionReset from './VersionReset';

// --- FIREBASE IMPORTS (Keep your existing config) ---
import { db } from './firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// ==========================================
// ⚙️ GAME SETTINGS
// ==========================================
const QUESTIONS_PER_ROUND = {
    1: 10,  // Level 1: Pick 10
    2: 20,  // Level 2: Pick 20
    3: 13   // Level 3: Pick 13
};

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
// 📚 DATA (Expanded Math Lvl 1 for Demo)
// ==========================================
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
            { q: "5 x 6?", o: ["30","35","25","20"], c: 0, e: "Multiplication table." },
            { q: "10 + 10 + 10?", o: ["20","40","30","100"], c: 2, e: "Sum of three tens." },
            { q: "Half of 12?", o: ["6","5","4","7"], c: 0, e: "Division by 2." },
            { q: "7 x 8?", o: ["54","56","58","64"], c: 1, e: "Times table." },
            { q: "20 - 8?", o: ["11","12","13","14"], c: 1, e: "Basic subtraction." }
        ] 
      },
      { 
        level: 2, 
        title: "Algebra", 
        questions: [ 
            { q: "2x = 20, x=?", o: ["5","10","15","20"], c: 1, e: "Divide by 2." }, 
            { q: "3 squared?", o: ["6","9","12","27"], c: 1, e: "3*3=9" }, 
            { q: "Pi approx?", o: ["3.14","2.14","4.14","3.00"], c: 0, e: "Ratio of circ to diam." }, 
            { q: "10% of 500?", o: ["10","50","100","5"], c: 1, e: "Move decimal once." }, 
            { q: "x + 10 = 25, x=?", o: ["10","15","20","5"], c: 1, e: "Subtract 10." },
            { q: "5x = 35, x=?", o: ["5","6","7","8"], c: 2, e: "Divide both sides by 5." },
            { q: "Square root of 25?", o: ["3","4","5","6"], c: 2, e: "5x5=25" },
            { q: "2^4 equals?", o: ["8","12","16","20"], c: 2, e: "2x2x2x2" },
            { q: "20% of 200?", o: ["20","30","40","50"], c: 2, e: "One fifth." },
            { q: "x - 7 = 12, x=?", o: ["5","17","19","21"], c: 1, e: "Add 7 to both sides." },
            { q: "4 cubed?", o: ["12","16","48","64"], c: 3, e: "4x4x4" },
            { q: "3x + 5 = 20, x=?", o: ["3","5","7","15"], c: 1, e: "Subtract 5, divide by 3." },
            { q: "Square root of 64?", o: ["6","7","8","9"], c: 2, e: "8x8=64" },
            { q: "15% of 80?", o: ["10","12","15","20"], c: 1, e: "Percentage calculation." },
            { q: "2x - 4 = 10, x=?", o: ["3","5","7","9"], c: 2, e: "Add 4, divide by 2." },
            { q: "5^2 equals?", o: ["10","15","20","25"], c: 3, e: "5x5" },
            { q: "x/3 = 9, x=?", o: ["3","12","27","36"], c: 2, e: "Multiply both sides by 3." },
            { q: "25% of 100?", o: ["20","25","30","50"], c: 1, e: "One quarter." },
            { q: "Square root of 36?", o: ["4","5","6","7"], c: 2, e: "6x6=36" },
            { q: "2(x + 3) = 14, x=?", o: ["2","3","4","5"], c: 2, e: "Distribute then solve." }
        ] 
      },
      { 
        level: 3, 
        title: "Geometry", 
        questions: [ 
            { q: "Triangle angles sum?", o: ["180","360","90","270"], c: 0, e: "Sum is 180." }, 
            { q: "Area of circle?", o: ["2πr","πr²","πd","wh"], c: 1, e: "Pi r squared." }, 
            { q: "Sides of octagon?", o: ["6","7","8","10"], c: 2, e: "Octo means 8." }, 
            { q: "Right angle degrees?", o: ["45","90","180","360"], c: 1, e: "90 degrees." }, 
            { q: "Which is prime?", o: ["9","15","17","21"], c: 2, e: "17 has no factors." },
            { q: "Pythagorean theorem?", o: ["a+b=c","a²+b²=c²","ab=c","a+b=c²"], c: 1, e: "Right triangle sides." },
            { q: "Pentagon sides?", o: ["4","5","6","7"], c: 1, e: "Penta means 5." },
            { q: "Volume of cube?", o: ["s²","s³","6s²","4s"], c: 1, e: "Side cubed." },
            { q: "Circumference formula?", o: ["πr²","2πr","πd²","r²"], c: 1, e: "Pi times diameter." },
            { q: "Hexagon sides?", o: ["5","6","7","8"], c: 1, e: "Hex means 6." },
            { q: "Quadrilateral angles?", o: ["180","270","360","450"], c: 2, e: "4 sided shape." },
            { q: "Area of triangle?", o: ["bh","½bh","2bh","b²h"], c: 1, e: "Half base times height." },
            { q: "Diagonal of square?", o: ["s","s√2","2s","s²"], c: 1, e: "Side times root 2." },
            { q: "Sphere volume?", o: ["4πr²","4/3πr³","πr³","2πr³"], c: 1, e: "Four thirds pi r cubed." },
            { q: "Isosceles triangle?", o: ["3 equal sides","2 equal sides","No equal sides","4 sides"], c: 1, e: "Two sides equal." },
            { q: "Trapezoid parallel sides?", o: ["0","1","2","4"], c: 2, e: "One pair parallel." },
            { q: "Rhombus angles opposite?", o: ["Different","Equal","Right","Acute"], c: 1, e: "Opposite angles equal." },
            { q: "Circle sector area?", o: ["πr²","½r²θ","rθ","πrθ"], c: 1, e: "Half r squared theta." },
            { q: "Cone volume?", o: ["πr²h","⅓πr²h","πrh","2πr²h"], c: 1, e: "One third pi r squared h." },
            { q: "Regular polygon?", o: ["Equal sides only","Equal angles only","Equal sides & angles","No equal parts"], c: 2, e: "All sides and angles equal." },
            { q: "Tangent to circle?", o: ["Intersects twice","Touches once","Doesn't touch","Crosses center"], c: 1, e: "Touches at one point." },
            { q: "Complementary angles?", o: ["90°","180°","270°","360°"], c: 0, e: "Add to 90 degrees." },
            { q: "Supplementary angles?", o: ["90°","180°","270°","360°"], c: 1, e: "Add to 180 degrees." },
            { q: "Equilateral triangle angles?", o: ["45°","60°","90°","120°"], c: 1, e: "All 60 degrees." },
            { q: "Cylinder surface area?", o: ["2πrh","2πr(r+h)","πr²h","2πr²+h"], c: 1, e: "Two circles plus side." },
            { q: "Prism volume?", o: ["Base × height","Base + height","Base ÷ height","Base²"], c: 0, e: "Base area times height." },
            { q: "Diagonal of rectangle?", o: ["l+w","lw","√(l²+w²)","l²+w²"], c: 2, e: "Pythagorean theorem." },
            { q: "Heptagon sides?", o: ["5","6","7","8"], c: 2, e: "Hepta means 7." },
            { q: "Arc length formula?", o: ["rθ","r²θ","2πrθ","πrθ"], c: 0, e: "Radius times angle." },
            { q: "Similar triangles?", o: ["Same size","Same shape","Same area","Same perimeter"], c: 1, e: "Same shape, different size." }
        ] 
      }
    ],
    Science: [
      { 
        level: 1, 
        title: "Lab Assistant", 
        questions: [ 
            { q: "Symbol for Water?", o: ["CO2","H2O","O2","H2"], c: 1, e: "2 Hydrogen, 1 Oxygen." }, 
            { q: "Planet with rings?", o: ["Mars","Venus","Saturn","Mercury"], c: 2, e: "Saturn's rings are ice." }, 
            { q: "Plants breathe?", o: ["O2","CO2","N2","He"], c: 1, e: "They need Carbon Dioxide." }, 
            { q: "Center of atom?", o: ["Electron","Nucleus","Proton","Quark"], c: 1, e: "Nucleus." }, 
            { q: "Hardest mineral?", o: ["Gold","Iron","Diamond","Lead"], c: 2, e: "Diamond (Carbon)." },
            { q: "Closest planet to Sun?", o: ["Venus","Mercury","Earth","Mars"], c: 1, e: "Mercury is closest." },
            { q: "Number of continents?", o: ["5","6","7","8"], c: 2, e: "Seven continents." },
            { q: "Boiling point of water?", o: ["90°C","100°C","110°C","120°C"], c: 1, e: "100 degrees Celsius." },
            { q: "Study of plants?", o: ["Zoology","Botany","Geology","Biology"], c: 1, e: "Botany." },
            { q: "Fastest land animal?", o: ["Lion","Cheetah","Leopard","Tiger"], c: 1, e: "Cheetah runs fastest." }
        ] 
      },
      { 
        level: 2, 
        title: "Biologist", 
        questions: [ 
            { q: "Powerhouse of cell?", o: ["Nucleus","Mitochondria","Ribosome","Wall"], c: 1, e: "Makes ATP." }, 
            { q: "Largest organ?", o: ["Liver","Heart","Skin","Lungs"], c: 2, e: "Skin covers the body." }, 
            { q: "Bones in adult?", o: ["206","300","150","500"], c: 0, e: "Babies have more." }, 
            { q: "Universal donor?", o: ["A+","O-","AB+","B-"], c: 1, e: "O Negative." }, 
            { q: "DNA shape?", o: ["Circle","Single Helix","Double Helix","Line"], c: 2, e: "Twisted ladder." },
            { q: "Photosynthesis occurs in?", o: ["Mitochondria","Chloroplast","Nucleus","Vacuole"], c: 1, e: "Chloroplasts make food." },
            { q: "Human heart chambers?", o: ["2","3","4","5"], c: 2, e: "Four chambers." },
            { q: "Smallest bone?", o: ["Stapes","Femur","Radius","Clavicle"], c: 0, e: "In the ear." },
            { q: "Red blood cell shape?", o: ["Round","Biconcave","Square","Triangular"], c: 1, e: "Disc shaped." },
            { q: "Genetic material?", o: ["RNA","DNA","Protein","Lipid"], c: 1, e: "Deoxyribonucleic acid." },
            { q: "Largest artery?", o: ["Aorta","Vena cava","Pulmonary","Carotid"], c: 0, e: "Aorta from heart." },
            { q: "Father of genetics?", o: ["Darwin","Mendel","Watson","Crick"], c: 1, e: "Gregor Mendel." },
            { q: "Longest bone?", o: ["Tibia","Femur","Humerus","Fibula"], c: 1, e: "Thigh bone." },
            { q: "Blood pH?", o: ["6.5","7.4","8.0","9.0"], c: 1, e: "Slightly alkaline." },
            { q: "Protein building blocks?", o: ["Nucleotides","Amino acids","Fatty acids","Sugars"], c: 1, e: "Amino acids." },
            { q: "Brain largest part?", o: ["Cerebellum","Cerebrum","Medulla","Pons"], c: 1, e: "Cerebrum for thinking." },
            { q: "Cell division?", o: ["Mitosis","Meiosis","Both","Neither"], c: 2, e: "Both types exist." },
            { q: "Vitamin for vision?", o: ["A","B","C","D"], c: 0, e: "Vitamin A." },
            { q: "Insulin regulates?", o: ["Blood sugar","Blood pressure","Heart rate","Temperature"], c: 0, e: "Controls glucose." },
            { q: "Plant cell wall made of?", o: ["Cellulose","Chitin","Protein","Starch"], c: 0, e: "Cellulose structure." }
        ] 
      },
      { 
        level: 3, 
        title: "Physicist", 
        questions: [ 
            { q: "Speed of Light?", o: ["300k km/s","Sonic","Mach 1","Instant"], c: 0, e: "299,792 km/s." }, 
            { q: "First element?", o: ["Helium","Hydrogen","Carbon","Lithium"], c: 1, e: "Atomic number 1." }, 
            { q: "Absolute Zero?", o: ["0C","-100C","-273C","-500C"], c: 2, e: "0 Kelvin." }, 
            { q: "Newton's 1st Law?", o: ["Gravity","Inertia","Force","Action"], c: 1, e: "Object at rest..." }, 
            { q: "E = mc² is?", o: ["Newton","Einstein","Tesla","Bohr"], c: 1, e: "Theory of Relativity." },
            { q: "Electron charge?", o: ["Positive","Negative","Neutral","Variable"], c: 1, e: "Negative charge." },
            { q: "Strong nuclear force?", o: ["Weakest","Strongest","Medium","Equal"], c: 1, e: "Strongest of four." },
            { q: "Quantum pioneer?", o: ["Newton","Planck","Galileo","Kepler"], c: 1, e: "Max Planck." },
            { q: "Higgs boson discovered?", o: ["1990","2000","2012","2020"], c: 2, e: "CERN 2012." },
            { q: "Schrödinger equation describes?", o: ["Classical mechanics","Quantum states","Relativity","Thermodynamics"], c: 1, e: "Quantum wave function." },
            { q: "Entropy measures?", o: ["Energy","Disorder","Temperature","Pressure"], c: 1, e: "System disorder." },
            { q: "Doppler effect involves?", o: ["Light only","Sound only","Wave frequency","Particle spin"], c: 2, e: "Frequency shift." },
            { q: "Pauli exclusion principle?", o: ["Electrons","Protons","Neutrons","Photons"], c: 0, e: "No two identical electrons." },
            { q: "Dark matter is?", o: ["Visible","Invisible","Theoretical","Proven"], c: 1, e: "Cannot be seen directly." },
            { q: "Superconductor temperature?", o: ["Room temp","Very cold","Very hot","Any temp"], c: 1, e: "Near absolute zero." },
            { q: "Gravitational waves detected?", o: ["1915","1950","2015","2020"], c: 2, e: "LIGO 2015." },
            { q: "Fermions vs Bosons?", o: ["Spin ½ vs 1","Mass","Charge","Speed"], c: 0, e: "Different spins." },
            { q: "Heisenberg uncertainty principle?", o: ["Position & momentum","Energy & time","Both","Neither"], c: 2, e: "Cannot know both precisely." },
            { q: "Antimatter meets matter?", o: ["Combine","Annihilate","Repel","Nothing"], c: 1, e: "Annihilation releases energy." },
            { q: "Quarks in proton?", o: ["2","3","4","6"], c: 1, e: "Three quarks." },
            { q: "Black hole escape velocity?", o: ["Light speed","Less than light","More than light","Zero"], c: 2, e: "Exceeds light speed." },
            { q: "Standard Model particles?", o: ["12","17","24","31"], c: 1, e: "17 fundamental particles." },
            { q: "Neutrino mass?", o: ["Zero","Very small","Large","Variable"], c: 1, e: "Nearly massless." },
            { q: "Cosmic microwave background?", o: ["Big Bang remnant","Star light","Galaxy radiation","Solar wind"], c: 0, e: "Early universe radiation." },
            { q: "String theory dimensions?", o: ["3","4","10 or 11","26"], c: 2, e: "10 or 11 dimensions." },
            { q: "Beta decay releases?", o: ["Proton","Neutron","Electron","Photon"], c: 2, e: "Electron emission." },
            { q: "Casimir effect involves?", o: ["Vacuum energy","Gravity","Magnetism","Heat"], c: 0, e: "Quantum vacuum." },
            { q: "CP violation?", o: ["Charge-Parity","Computer-Physics","Constant-Pressure","Current-Power"], c: 0, e: "Matter-antimatter asymmetry." },
            { q: "Planck length?", o: ["1mm","1μm","10^-35 m","10^-20 m"], c: 2, e: "Smallest meaningful length." },
            { q: "Bose-Einstein condensate?", o: ["Hot gas","Cold matter state","Plasma","Liquid"], c: 1, e: "Ultra-cold quantum state." }
        ] 
      }
    ],
    Technology: [
      { 
        level: 1, 
        title: "User", 
        questions: [ 
            { q: "Meaning of PC?", o: ["Personal Computer","Public Computer","Private Center","Power Cell"], c: 0, e: "Personal Computer." }, 
            { q: "Brain of computer?", o: ["RAM","CPU","HDD","GPU"], c: 1, e: "Central Processing Unit." }, 
            { q: "Common OS?", o: ["Doors","Windows","Gates","Portal"], c: 1, e: "Microsoft Windows." }, 
            { q: "WiFi stands for?", o: ["Wireless Fidelity","Wire Fix","Wide Field","Web Fit"], c: 0, e: "Marketing term." }, 
            { q: "Input device?", o: ["Monitor","Speaker","Mouse","Printer"], c: 2, e: "Mouse sends data in." },
            { q: "Internet browser?", o: ["Word","Chrome","Excel","Paint"], c: 1, e: "Google Chrome." },
            { q: "Email provider?", o: ["Facebook","Instagram","Gmail","TikTok"], c: 2, e: "Gmail by Google." },
            { q: "Computer memory unit?", o: ["Byte","Inch","Gram","Volt"], c: 0, e: "Byte stores data." },
            { q: "USB stands for?", o: ["Universal Serial Bus","United System Board","Ultra Speed Box","User Service Base"], c: 0, e: "Universal Serial Bus." },
            { q: "Search engine?", o: ["Windows","Google","Chrome","Firefox"], c: 1, e: "Google searches web." }
        ] 
      },
      { 
        level: 2, 
        title: "Coder", 
        questions: [ 
            { q: "Web language?", o: ["HTML","Snake","C++","Swift"], c: 0, e: "HyperText Markup Language." }, 
            { q: "Binary is?", o: ["0-9","0 & 1","A-Z","1-10"], c: 1, e: "Base 2 system." }, 
            { q: "Bug means?", o: ["Insect","Feature","Error","Virus"], c: 2, e: "A flaw in code." }, 
            { q: "Meaning of RAM?", o: ["Read Access Memory","Random Access Memory","Run All Memory","Real Area Map"], c: 1, e: "Volatile memory." }, 
            { q: "Founder of Apple?", o: ["Gates","Bezos","Jobs","Musk"], c: 2, e: "Steve Jobs." },
            { q: "JavaScript file extension?", o: [".java",".js",".jsx",".jav"], c: 1, e: "Dot js extension." },
            { q: "Python named after?", o: ["Snake","Monty Python","City","Language"], c: 1, e: "British comedy group." },
            { q: "Git is for?", o: ["Graphics","Version control","Gaming","Networking"], c: 1, e: "Tracks code changes." },
            { q: "CSS stands for?", o: ["Computer Style Sheets","Cascading Style Sheets","Creative Style System","Code Style Syntax"], c: 1, e: "Styles web pages." },
            { q: "Array index starts at?", o: ["0","1","2","-1"], c: 0, e: "Zero-indexed." },
            { q: "JSON stands for?", o: ["JavaScript Object Notation","Java Standard Object Name","Just Simple Object Network","JavaScript Online Node"], c: 0, e: "Data format." },
            { q: "API means?", o: ["Application Programming Interface","Advanced Program Integration","Automated Process Interface","Application Protocol Internet"], c: 0, e: "Software intermediary." },
            { q: "HTTP status 404?", o: ["Success","Not Found","Error","Redirect"], c: 1, e: "Page not found." },
            { q: "Boolean values?", o: ["0 & 1","True & False","Yes & No","On & Off"], c: 1, e: "True or False." },
            { q: "OOP stands for?", o: ["Object Oriented Programming","Online Open Platform","Optimal Operation Process","Output Order Protocol"], c: 0, e: "Programming paradigm." },
            { q: "Variable stores?", o: ["Code","Data","Functions","Classes"], c: 1, e: "Holds data values." },
            { q: "Loop repeats?", o: ["Once","Code","Functions","Variables"], c: 1, e: "Executes code repeatedly." },
            { q: "Function returns?", o: ["Nothing","Value","Error","Loop"], c: 1, e: "Outputs a value." },
            { q: "IDE stands for?", o: ["Internet Data Exchange","Integrated Development Environment","Internal Debug Engine","Interface Design Editor"], c: 1, e: "Coding software." },
            { q: "Front-end framework?", o: ["React","MySQL","MongoDB","Django"], c: 0, e: "UI library." }
        ] 
      },
      { 
        level: 3, 
        title: "Hacker", 
        questions: [ 
            { q: "Linux mascot?", o: ["Dog","Cat","Penguin","Bird"], c: 2, e: "Tux the Penguin." }, 
            { q: "HTTP 'S' means?", o: ["Speed","Secure","Site","Server"], c: 1, e: "Secure (Encryption)." }, 
            { q: "Database language?", o: ["SQL","NoVar","DB++","QueryX"], c: 0, e: "Structured Query Language." }, 
            { q: "First programmer?", o: ["Ada Lovelace","Alan Turing","Bill Gates","Grace Hopper"], c: 0, e: "Wrote algorithm for Engine." }, 
            { q: "1024 bytes?", o: ["Megabyte","Kilobyte","Gigabyte","Bit"], c: 1, e: "1 KB." },
            { q: "TCP/IP layer model?", o: ["3 layers","4 layers","5 layers","7 layers"], c: 1, e: "Four layer model." },
            { q: "RSA encryption type?", o: ["Symmetric","Asymmetric","Hash","Stream"], c: 1, e: "Public-key cryptography." },
            { q: "Docker is for?", o: ["Databases","Containerization","Testing","Networking"], c: 1, e: "Application containers." },
            { q: "Kubernetes manages?", o: ["Containers","Databases","Networks","Files"], c: 0, e: "Container orchestration." },
            { q: "SHA-256 is?", o: ["Encryption","Hash function","Protocol","Database"], c: 1, e: "Cryptographic hash." },
            { q: "REST API uses?", o: ["SOAP","HTTP","FTP","SMTP"], c: 1, e: "HTTP requests." },
            { q: "NoSQL example?", o: ["MySQL","PostgreSQL","MongoDB","Oracle"], c: 2, e: "Document database." },
            { q: "Kernel mode vs?", o: ["User mode","Admin mode","Root mode","System mode"], c: 0, e: "Operating system layers." },
            { q: "IPv6 address length?", o: ["32 bits","64 bits","128 bits","256 bits"], c: 2, e: "128-bit addresses." },
            { q: "Zero-day exploit?", o: ["Old vulnerability","Unknown vulnerability","Fixed bug","Known issue"], c: 1, e: "Undiscovered flaw." },
            { q: "Blockchain consensus?", o: ["Proof of Work","Proof of Stake","Both","Neither"], c: 2, e: "Multiple methods exist." },
            { q: "XSS attack targets?", o: ["Servers","Databases","Web browsers","Networks"], c: 2, e: "Cross-site scripting." },
            { q: "Man-in-the-middle attack?", o: ["DDoS","Intercepts communication","Virus","Phishing"], c: 1, e: "Eavesdropping attack." },
            { q: "SSH port number?", o: ["21","22","80","443"], c: 1, e: "Secure shell port." },
            { q: "Big O notation measures?", o: ["Speed","Complexity","Size","Memory"], c: 1, e: "Algorithm efficiency." },
            { q: "Turing completeness means?", o: ["Fast","Can compute anything","Secure","Simple"], c: 1, e: "Universal computation." },
            { q: "Quantum computing uses?", o: ["Bits","Qubits","Bytes","Nibbles"], c: 1, e: "Quantum bits." },
            { q: "DNS port?", o: ["21","53","80","443"], c: 1, e: "Domain name system." },
            { q: "SQL injection targets?", o: ["UI","Database","Network","Files"], c: 1, e: "Database vulnerability." },
            { q: "Microservices architecture?", o: ["Monolithic","Distributed","Centralized","Linear"], c: 1, e: "Decoupled services." },
            { q: "WebAssembly runs?", o: ["Server only","Browser only","Both","Neither"], c: 2, e: "Near-native browser speed." },
            { q: "GraphQL alternative to?", o: ["REST","SOAP","Both","Neither"], c: 0, e: "Query language for APIs." },
            { q: "CI/CD stands for?", o: ["Computer Interface/Database","Continuous Integration/Deployment","Code Input/Debug","Central Internet/Data"], c: 1, e: "DevOps practice." },
            { q: "CSRF attack?", o: ["Cross-Site Request Forgery","Code Script Random Failure","Client Server Request Format","Central System Resource Fault"], c: 0, e: "Unauthorized commands." },
            { q: "Mutex prevents?", o: ["Deadlock","Race condition","Memory leak","Stack overflow"], c: 1, e: "Mutual exclusion." }
        ] 
      }
    ],
    Geography: [
        { 
            level: 1, 
            title: "Tourist", 
            questions: [
                {q:"Capital of France?",o:["Paris","Rome","Berlin","Madrid"],c:0,e:"City of Light."},
                {q:"Largest Ocean?",o:["Atlantic","Indian","Pacific","Arctic"],c:2,e:"Pacific Ocean."},
                {q:"Shape of Earth?",o:["Flat","Sphere","Cube","Pyramid"],c:1,e:"Oblate spheroid."},
                {q:"Pyramids are in?",o:["Egypt","China","USA","UK"],c:0,e:"Giza, Egypt."},
                {q:"Continent with kangaroos?",o:["Africa","Asia","Australia","Europe"],c:2,e:"Australia."},
                {q:"Eiffel Tower location?",o:["London","Paris","Rome","Berlin"],c:1,e:"Paris landmark."},
                {q:"Great Wall location?",o:["Japan","China","Korea","India"],c:1,e:"China."},
                {q:"Statue of Liberty location?",o:["USA","France","UK","Canada"],c:0,e:"New York."},
                {q:"Big Ben location?",o:["Paris","London","Dublin","Edinburgh"],c:1,e:"London, England."},
                {q:"Colosseum location?",o:["Greece","Italy","Spain","Turkey"],c:1,e:"Rome, Italy."}
            ] 
        },
        { 
            level: 2, 
            title: "Pilot", 
            questions: [
                {q:"Longest River?",o:["Nile","Amazon","Yangtze","Seine"],c:0,e:"Nile (approx 6650km)."},
                {q:"Capital of Japan?",o:["Seoul","Beijing","Tokyo","Bangkok"],c:2,e:"Tokyo."}, 
                {q:"Mount Everest loc?",o:["Nepal/China","USA/Canada","Swiss/Italy","Peru"],c:0,e:"Himalayas."}, 
                {q:"Largest Desert?",o:["Sahara","Gobi","Arabian","Antarctic"],c:3,e:"Antarctica is a desert."}, 
                {q:"Canal in Panama?",o:["Suez","Panama","Erie","Grand"],c:1,e:"Connects Atlantic/Pacific."},
                {q:"Capital of Australia?",o:["Sydney","Melbourne","Canberra","Brisbane"],c:2,e:"Canberra is capital."},
                {q:"Amazon River location?",o:["Africa","South America","Asia","Europe"],c:1,e:"Through Brazil."},
                {q:"Sahara Desert location?",o:["Asia","Africa","Australia","America"],c:1,e:"North Africa."},
                {q:"Grand Canyon location?",o:["USA","Mexico","Canada","Peru"],c:0,e:"Arizona, USA."},
                {q:"Niagara Falls between?",o:["USA/Canada","USA/Mexico","Canada/UK","France/Spain"],c:0,e:"Border of two nations."},
                {q:"Dead Sea location?",o:["Egypt","Jordan/Israel","Saudi Arabia","Turkey"],c:1,e:"Lowest elevation."},
                {q:"Victoria Falls location?",o:["Zambia/Zimbabwe","Egypt","South Africa","Kenya"],c:0,e:"Southern Africa."},
                {q:"Andes Mountains location?",o:["North America","South America","Asia","Europe"],c:1,e:"Longest mountain range."},
                {q:"Strait of Gibraltar connects?",o:["Atlantic/Pacific","Atlantic/Mediterranean","Pacific/Indian","Arctic/Atlantic"],c:1,e:"Spain and Morocco."},
                {q:"Lake Superior location?",o:["USA/Canada","USA/Mexico","Europe","Asia"],c:0,e:"Great Lakes."},
                {q:"Gobi Desert location?",o:["Africa","China/Mongolia","Australia","Arabia"],c:1,e:"Central Asia."},
                {q:"Fjords famous in?",o:["Spain","Norway","Italy","Greece"],c:1,e:"Norwegian coastline."},
                {q:"Danube River flows to?",o:["Atlantic","Mediterranean","Black Sea","North Sea"],c:2,e:"Eastern Europe."},
                {q:"Island nation?",o:["Switzerland","Austria","Iceland","Mongolia"],c:2,e:"Iceland is an island."},
                {q:"Tropic of Cancer latitude?",o:["23.5°N","45°N","0°","23.5°S"],c:0,e:"Northern hemisphere."}
            ]
        },
        { 
            level: 3, 
            title: "Cartographer", 
            questions: [
                {q:"Capital of Canada?",o:["Toronto","Vancouver","Ottawa","Montreal"],c:2,e:"Chosen by Queen Victoria."}, 
                {q:"Smallest Country?",o:["Monaco","Vatican","Malta","Nauru"],c:1,e:"Vatican City."}, 
                {q:"Most islands?",o:["Sweden","Philippines","Indonesia","Japan"],c:0,e:"Sweden (~267k)."}, 
                {q:"River in London?",o:["Thames","Seine","Danube","Rhine"],c:0,e:"The Thames."}, 
                {q:"Machu Picchu loc?",o:["Peru","Chile","Brazil","Mexico"],c:0,e:"Incan citadel."},
                {q:"Highest capital city?",o:["Quito","La Paz","Bogota","Kathmandu"],c:1,e:"Bolivia's capital."},
                {q:"Driest place on Earth?",o:["Sahara","Atacama","Death Valley","Gobi"],c:1,e:"Atacama Desert, Chile."},
                {q:"Country with most time zones?",o:["Russia","USA","France","China"],c:2,e:"France (territories included)."},
                {q:"Landlocked country?",o:["Chile","Ethiopia","Norway","Philippines"],c:1,e:"No coastline."},
                {q:"Ring of Fire location?",o:["Atlantic","Pacific","Indian","Arctic"],c:1,e:"Volcanic Pacific rim."},
                {q:"Karst topography feature?",o:["Volcanoes","Caves/sinkholes","Glaciers","Deserts"],c:1,e:"Limestone erosion."},
                {q:"Pampas grasslands?",o:["Africa","Argentina","Australia","Asia"],c:1,e:"South American plains."},
                {q:"Steppes are in?",o:["Central Asia","South America","Africa","Australia"],c:0,e:"Eurasian grasslands."},
                {q:"Tundra climate zone?",o:["Tropical","Temperate","Polar","Desert"],c:2,e:"Cold treeless plain."},
                {q:"Fjord formation?",o:["Volcanic","Glacial","Erosion","Tectonic"],c:1,e:"Glacier carved valleys."},
                {q:"Continental drift theory?",o:["Darwin","Wegener","Newton","Einstein"],c:1,e:"Alfred Wegener."},
                {q:"Pangaea was?",o:["Ocean","Supercontinent","Mountain","Desert"],c:1,e:"Ancient landmass."},
                {q:"Mediterranean climate?",o:["Wet summers","Dry summers","No seasons","Always cold"],c:1,e:"Hot dry summers."},
                {q:"Doldrums location?",o:["Poles","Equator","Tropics","Temperate"],c:1,e:"Low pressure belt."},
                {q:"Monsoon climate region?",o:["Europe","South Asia","North America","Australia"],c:1,e:"Seasonal winds."},
                {q:"Isthmus connects?",o:["Two islands","Two landmasses","Two oceans","Two rivers"],c:1,e:"Narrow land bridge."},
                {q:"Antipodes of London?",o:["New York","Sydney","Pacific Ocean","South Africa"],c:2,e:"Opposite side of Earth."},
                {q:"Midnight sun occurs?",o:["Equator","Arctic Circle","Tropics","Temperate"],c:1,e:"Polar summer phenomenon."},
                {q:"Rift valley formation?",o:["Volcanic","Tectonic plates diverging","Erosion","Glacial"],c:1,e:"Plates pulling apart."},
                {q:"Oxbow lake formed by?",o:["Glacier","River meander","Volcano","Sinkhole"],c:1,e:"Cutoff river bend."},
                {q:"Exclaves are?",o:["Islands","Detached territory","Colonies","Border zones"],c:1,e:"Separated land."},
                {q:"Geoid represents?",o:["Perfect sphere","Earth's shape","Flat map","Magnetic field"],c:1,e:"True Earth shape."},
                {q:"Mercator projection distorts?",o:["Direction","Size at poles","Colors","Nothing"],c:1,e:"High latitude areas."},
                {q:"Geodesy studies?",o:["Weather","Earth's shape","Rocks","Oceans"],c:1,e:"Earth measurement."},
                {q:"International Date Line?",o:["Prime Meridian","180° meridian","Equator","Tropic"],c:1,e:"Pacific dateline."}
            ]
        }
    ],
    History: [
        { 
            level: 1, 
            title: "Student", 
            questions: [
                {q:"First US President?",o:["Lincoln","Washington","JFK","Trump"],c:1,e:"George Washington."}, 
                {q:"Titanic year?",o:["1912","1900","1920","1899"],c:0,e:"April 1912."}, 
                {q:"Discovered America?",o:["Columbus","Cook","Drake","Magellan"],c:0,e:"1492."}, 
                {q:"Who wrote Romeo?",o:["Shakespeare","Dickens","Twain","Poe"],c:0,e:"The Bard."}, 
                {q:"Wall in China?",o:["Great Wall","Big Wall","Red Wall","Long Wall"],c:0,e:"Visible from space (myth)."},
                {q:"Declaration of Independence year?",o:["1776","1787","1800","1812"],c:0,e:"July 4, 1776."},
                {q:"First moon landing?",o:["1969","1959","1979","1989"],c:0,e:"Apollo 11."},
                {q:"Fall of Berlin Wall?",o:["1989","1979","1990","1985"],c:0,e:"November 1989."},
                {q:"World War II ended?",o:["1945","1944","1946","1943"],c:0,e:"1945."},
                {q:"Renaissance started in?",o:["England","France","Italy","Spain"],c:2,e:"Italian city-states."}
            ]
        },
        { 
            level: 2, 
            title: "Scholar", 
            questions: [
                {q:"WW2 End Year?",o:["1945","1939","1918","1950"],c:0,e:"Ended Sep 1945."}, 
                {q:"First Man on Moon?",o:["Armstrong","Aldrin","Collins","Gagarin"],c:0,e:"Neil Armstrong."}, 
                {q:"Julius Caesar?",o:["Roman","Greek","Egyptian","Persian"],c:0,e:"Roman Dictator."}, 
                {q:"Iron Lady?",o:["Thatcher","Merkel","May","Queen"],c:0,e:"Margaret Thatcher."}, 
                {q:"Ancient Greek city?",o:["Athens","Rome","Cairo","Paris"],c:0,e:"Birthplace of democracy."},
                {q:"French Revolution started?",o:["1789","1776","1800","1812"],c:0,e:"Storming of Bastille."},
                {q:"Black Death occurred?",o:["14th century","15th century","16th century","13th century"],c:0,e:"Bubonic plague."},
                {q:"Industrial Revolution began?",o:["Britain","France","Germany","USA"],c:0,e:"18th century Britain."},
                {q:"Roman Empire fell?",o:["476 AD","500 AD","400 AD","600 AD"],c:0,e:"Western Empire."},
                {q:"Cold War ended?",o:["1989-1991","1985","1995","2000"],c:0,e:"Soviet dissolution."},
                {q:"Pearl Harbor attack?",o:["1941","1942","1940","1943"],c:0,e:"December 7, 1941."},
                {q:"D-Day invasion?",o:["1944","1943","1945","1942"],c:0,e:"June 6, 1944."},
                {q:"Cuban Missile Crisis?",o:["1962","1960","1965","1970"],c:0,e:"Cold War standoff."},
                {q:"Martin Luther King Jr. speech?",o:["1963","1960","1965","1968"],c:0,e:"I Have a Dream."},
                {q:"Vietnam War ended?",o:["1975","1973","1980","1970"],c:0,e:"Fall of Saigon."},
                {q:"Gutenberg printing press?",o:["1440","1500","1400","1550"],c:0,e:"Movable type."},
                {q:"Silk Road connected?",o:["Europe-Asia","Asia-Africa","Europe-America","Africa-America"],c:0,e:"Trade route."},
                {q:"Byzantine Empire capital?",o:["Constantinople","Rome","Athens","Alexandria"],c:0,e:"Modern Istanbul."},
                {q:"Crusades were?",o:["Religious wars","Trade wars","Civil wars","Colonial wars"],c:0,e:"Holy Land campaigns."},
                {q:"Ottoman Empire ended?",o:["1922","1918","1900","1945"],c:0,e:"After WWI."}
            ]
        },
        { 
            level: 3, 
            title: "Professor", 
            questions: [
                {q:"Start of WWI?",o:["1914","1918","1939","1900"],c:0,e:"Archduke assassination."}, 
                {q:"Magna Carta year?",o:["1215","1066","1492","1776"],c:0,e:"Signed by King John."}, 
                {q:"Napoleon defeated at?",o:["Waterloo","Austerlitz","Paris","Berlin"],c:0,e:"1815 Battle."}, 
                {q:"Nelson Mandela country?",o:["South Africa","Kenya","Nigeria","Egypt"],c:0,e:"Anti-apartheid leader."}, 
                {q:"Aztec capital?",o:["Tenochtitlan","Cusco","Maya","Lima"],c:0,e:"Modern Mexico City."},
                {q:"Treaty of Westphalia?",o:["1648","1648","1700","1600"],c:0,e:"Ended 30 Years War."},
                {q:"Code of Hammurabi?",o:["Babylonian law","Egyptian law","Greek law","Roman law"],c:0,e:"Ancient legal code."},
                {q:"Rosetta Stone language?",o:["3 scripts","2 scripts","4 scripts","1 script"],c:0,e:"Hieroglyphic, Demotic, Greek."},
                {q:"Hundred Years War duration?",o:["116 years","100 years","150 years","90 years"],c:0,e:"1337-1453."},
                {q:"Peloponnesian War?",o:["Athens vs Sparta","Rome vs Carthage","Persia vs Greece","Egypt vs Hittites"],c:0,e:"Greek city-states."},
                {q:"Pax Romana period?",o:["Roman peace","Roman war","Roman expansion","Roman decline"],c:0,e:"200 years of stability."},
                {q:"Congress of Vienna?",o:["1815","1800","1820","1789"],c:0,e:"Post-Napoleonic Europe."},
                {q:"Meiji Restoration?",o:["Japan","China","Korea","Vietnam"],c:0,e:"Japanese modernization."},
                {q:"Boxer Rebellion?",o:["China","Japan","India","Philippines"],c:0,e:"Anti-foreign uprising."},
                {q:"Treaty of Versailles?",o:["1919","1918","1920","1945"],c:0,e:"Ended WWI."},
                {q:"Spanish Armada defeated?",o:["1588","1600","1550","1620"],c:0,e:"England vs Spain."},
                {q:"Scramble for Africa?",o:["1880s-1900s","1800s-1820s","1920s-1940s","1850s-1870s"],c:0,e:"European colonization."},
                {q:"Opium Wars involved?",o:["Britain-China","France-Vietnam","USA-Japan","Spain-Philippines"],c:0,e:"Trade conflict."},
                {q:"Taiping Rebellion?",o:["China","India","Japan","Korea"],c:0,e:"19th century civil war."},
                {q:"Congress of Berlin?",o:["1878","1890","1860","1900"],c:0,e:"Redrew Balkans."},
                {q:"Sykes-Picot Agreement?",o:["Middle East division","Africa division","Asia division","Europe division"],c:0,e:"Secret WWI pact."},
                {q:"Young Turk Revolution?",o:["1908","1900","1920","1890"],c:0,e:"Ottoman Empire."},
                {q:"Zulu Wars?",o:["Britain-Zulu","France-Algeria","Spain-Morocco","Portugal-Angola"],c:0,e:"Southern Africa."},
                {q:"Investiture Controversy?",o:["Pope vs Emperor","King vs Parliament","Church vs State","East vs West"],c:0,e:"Medieval power struggle."},
                {q:"Defenestration of Prague?",o:["1618","1600","1650","1700"],c:0,e:"Sparked 30 Years War."},
                {q:"Peace of Augsburg?",o:["1555","1500","1600","1650"],c:0,e:"Religious settlement."},
                {q:"Fourth Crusade sacked?",o:["Constantinople","Jerusalem","Cairo","Damascus"],c:0,e:"1204 Christian city."},
                {q:"Reconquista ended?",o:["1492","1400","1500","1450"],c:0,e:"Granada fell."},
                {q:"Battle of Tours?",o:["732","700","800","650"],c:0,e:"Stopped Muslim advance."},
                {q:"Schism of 1054?",o:["East-West split","Protestant split","Anglican split","Orthodox split"],c:0,e:"Catholic-Orthodox divide."}
            ]
        }
    ],
    Entertainment: [
        { 
            level: 1, 
            title: "Fan", 
            questions: [
                {q:"Simba's dad?",o:["Mufasa","Scar","Timon","Nala"],c:0,e:"The Lion King."}, 
                {q:"Batman's city?",o:["Metropolis","Gotham","Star City","New York"],c:1,e:"Gotham City."}, 
                {q:"Wizard Harry?",o:["Potter","Houdini","Merlin","Gandalf"],c:0,e:"The Boy Who Lived."}, 
                {q:"James Bond code?",o:["007","777","001","911"],c:0,e:"License to Kill."}, 
                {q:"Shrek is a?",o:["Ogre","Goblin","Elf","Human"],c:0,e:"Layers like an onion."},
                {q:"Mickey Mouse creator?",o:["Disney","Warner","Pixar","Universal"],c:0,e:"Walt Disney."},
                {q:"Superman's weakness?",o:["Kryptonite","Gold","Silver","Iron"],c:0,e:"Green rock."},
                {q:"Finding Nemo fish?",o:["Clownfish","Goldfish","Shark","Whale"],c:0,e:"Orange and white."},
                {q:"Frozen main character?",o:["Anna","Elsa","Both","Olaf"],c:2,e:"Two sisters."},
                {q:"Spider-Man's real name?",o:["Peter Parker","Bruce Wayne","Clark Kent","Tony Stark"],c:0,e:"Friendly neighborhood."}
            ]
        },
        { 
            level: 2, 
            title: "Critic", 
            questions: [
                {q:"Played Iron Man?",o:["Downey Jr","Evans","Hemsworth","Pratt"],c:0,e:"RDJ started the MCU."}, 
                {q:"King of Pop?",o:["Elvis","MJ","Prince","Bowie"],c:1,e:"Michael Jackson."}, 
                {q:"Director of Titanic?",o:["Cameron","Spielberg","Nolan","Lucas"],c:0,e:"James Cameron."}, 
                {q:"Friends Coffee Shop?",o:["Central Perk","Starbucks","Joes","Beans"],c:0,e:"The orange couch."}, 
                {q:"Star Wars villain?",o:["Vader","Joker","Thanos","Sauron"],c:0,e:"Darth Vader."},
                {q:"Breaking Bad protagonist?",o:["Walter White","Jesse Pinkman","Saul Goodman","Hank Schrader"],c:0,e:"Chemistry teacher."},
                {q:"Game of Thrones author?",o:["R.R. Martin","Tolkien","Rowling","King"],c:0,e:"George R.R. Martin."},
                {q:"The Godfather actor?",o:["Brando","Pacino","De Niro","Both A&B"],c:3,e:"Father and son roles."},
                {q:"Pixar first movie?",o:["Toy Story","Cars","Nemo","Monsters Inc"],c:0,e:"1995 film."},
                {q:"Matrix protagonist?",o:["Neo","Morpheus","Trinity","Smith"],c:0,e:"The One."},
                {q:"Stranger Things setting?",o:["1970s","1980s","1990s","2000s"],c:1,e:"Hawkins, Indiana."},
                {q:"The Office setting?",o:["Dunder Mifflin","Initech","Sterling Cooper","Pied Piper"],c:0,e:"Paper company."},
                {q:"Pulp Fiction director?",o:["Tarantino","Scorsese","Coppola","Nolan"],c:0,e:"Quentin Tarantino."},
                {q:"Harry Potter houses?",o:["3","4","5","6"],c:1,e:"Four houses."},
                {q:"Inception plot device?",o:["Dreams","Time travel","Space","Memory"],c:0,e:"Dream within dream."},
                {q:"Avengers first movie?",o:["2008","2010","2012","2015"],c:2,e:"2012 ensemble."},
                {q:"Simpsons town?",o:["Springfield","Shelbyville","Capital City","Ogdenville"],c:0,e:"Yellow family."},
                {q:"Black Panther nation?",o:["Wakanda","Zamunda","Genovia","Latveria"],c:0,e:"Fictional African nation."},
                {q:"Mandalorian's species?",o:["Human","Yoda's species","Wookiee","Twi'lek"],c:0,e:"Not revealed."},
                {q:"Shawshank Redemption based on?",o:["King story","True story","Original","Play"],c:0,e:"Stephen King novella."}
            ]
        },
        { 
            level: 3, 
            title: "Producer", 
            questions: [
                {q:"Most Oscars movie?",o:["LOTR: ROTK","Star Wars","Avatar","Jaws"],c:0,e:"Won 11 Oscars."}, 
                {q:"First Disney movie?",o:["Snow White","Cinderella","Fantasia","Bambi"],c:0,e:"1937."}, 
                {q:"Beatles drummer?",o:["Ringo","Paul","John","George"],c:0,e:"Ringo Starr."}, 
                {q:"Highest grossing movie?",o:["Avatar","Endgame","Titanic","Star Wars"],c:0,e:"Avatar (2009)."}, 
                {q:"Netflix started as?",o:["DVD Rental","Streaming","Cable","Production"],c:0,e:"Mail order DVDs."},
                {q:"Citizen Kane director?",o:["Orson Welles","Hitchcock","Ford","Hawks"],c:0,e:"Debut masterpiece."},
                {q:"Method acting pioneer?",o:["Stanislavski","Strasberg","Meisner","Adler"],c:0,e:"Russian system."},
                {q:"French New Wave started?",o:["1950s","1960s","1970s","1940s"],c:0,e:"Late 1950s movement."},
                {q:"Kurosawa's masterpiece?",o:["Seven Samurai","Rashomon","Ran","Yojimbo"],c:0,e:"1954 epic."},
                {q:"First talkie movie?",o:["Jazz Singer","Birth of Nation","Metropolis","Cabinet"],c:0,e:"1927 film."},
                {q:"Longest film ever?",o:["Modern Times","Cure for Insomnia","Logistics","Ambiancé"],c:1,e:"87 hours long."},
                {q:"Cannes Palm d'Or?",o:["French festival","Italian festival","German festival","British festival"],c:0,e:"Top film prize."},
                {q:"Bollywood location?",o:["Mumbai","Delhi","Bangalore","Kolkata"],c:0,e:"Indian film industry."},
                {q:"Silent film star?",o:["Chaplin","Bogart","Cary Grant","James Dean"],c:0,e:"Charlie Chaplin."},
                {q:"Spaghetti Western?",o:["Italian Westerns","French Westerns","Spanish Westerns","American Westerns"],c:0,e:"Leone's films."},
                {q:"Dogme 95 movement?",o:["Danish","Swedish","Norwegian","Finnish"],c:0,e:"Minimalist filmmaking."},
                {q:"First Best Picture Oscar?",o:["Wings","Sunrise","The Racket","7th Heaven"],c:0,e:"1927 ceremony."},
                {q:"Longest running Broadway?",o:["Phantom","Cats","Les Mis","Chicago"],c:0,e:"Phantom of the Opera."},
                {q:"MTV launched?",o:["1981","1985","1990","1975"],c:0,e:"Music Television."},
                {q:"Woodstock year?",o:["1969","1970","1968","1971"],c:0,e:"Music festival."},
                {q:"Studio Ghibli founder?",o:["Miyazaki","Takahata","Anno","Oshii"],c:0,e:"Hayao Miyazaki."},
                {q:"Expressionist film?",o:["Caligari","Nosferatu","Metropolis","All three"],c:3,e:"German movement."},
                {q:"Neorealism country?",o:["Italy","France","Germany","Spain"],c:0,e:"Post-war Italian."},
                {q:"First CGI character?",o:["Young Sherlock","Tron","Jurassic Park","Toy Story"],c:0,e:"Stained glass knight."},
                {q:"Sundance founder?",o:["Redford","Spielberg","Lucas","Coppola"],c:0,e:"Robert Redford."},
                {q:"Blaxploitation era?",o:["1970s","1960s","1980s","1950s"],c:0,e:"African American genre."},
                {q:"Film noir period?",o:["1940s-50s","1930s-40s","1950s-60s","1960s-70s"],c:0,e:"Dark crime films."},
                {q:"Auteur theory?",o:["Director as author","Writer primary","Actor focused","Producer driven"],c:0,e:"Director's vision."},
                {q:"Giallo films from?",o:["Italy","Spain","France","Germany"],c:0,e:"Italian thrillers."},
                {q:"First feature film?",o:["The Story of Kelly Gang","Birth of Nation","Trip to Moon","Great Train"],c:0,e:"1906 Australian film."}
            ]
        }
    ],
    Sports: [
        { 
            level: 1, 
            title: "Rookie", 
            questions: [
                {q:"Soccer players?",o:["11","10","9","12"],c:0,e:"11 per side."}, 
                {q:"NBA sport?",o:["Basketball","Baseball","Football","Hockey"],c:0,e:"National Basketball Assoc."}, 
                {q:"Super Bowl sport?",o:["Football","Soccer","Tennis","Golf"],c:0,e:"American Football."}, 
                {q:"Usain Bolt sport?",o:["Sprinting","Swimming","Judo","Boxing"],c:0,e:"Fastest man."}, 
                {q:"Tiger Woods sport?",o:["Golf","Tennis","F1","NFL"],c:0,e:"Golf legend."},
                {q:"Wimbledon sport?",o:["Tennis","Badminton","Squash","Table Tennis"],c:0,e:"Tennis championship."},
                {q:"Stanley Cup sport?",o:["Hockey","Football","Baseball","Basketball"],c:0,e:"Ice hockey."},
                {q:"World Series sport?",o:["Baseball","Football","Basketball","Soccer"],c:0,e:"MLB championship."},
                {q:"Rings in Olympics logo?",o:["4","5","6","7"],c:1,e:"Five continents."},
                {q:"Michael Jordan sport?",o:["Basketball","Baseball","Football","Golf"],c:0,e:"Chicago Bulls legend."}
            ]
        },
        { 
            level: 2, 
            title: "Pro", 
            questions: [
                {q:"Olympics rings?",o:["5","4","6","3"],c:0,e:"5 continents."}, 
                {q:"World Cup frequency?",o:["4 Years","2 Years","1 Year","5 Years"],c:0,e:"Quadrennial."}, 
                {q:"Tour de France?",o:["Cycling","Running","Driving","Sailing"],c:0,e:"Bicycle race."}, 
                {q:"Home of Tennis?",o:["Wimbledon","Paris","New York","Melbourne"],c:0,e:"Oldest tournament."}, 
                {q:"Muhammed Ali sport?",o:["Boxing","MMA","Wrestling","Karate"],c:0,e:"The Greatest."},
                {q:"Formula 1 races?",o:["~20","~10","~30","~50"],c:0,e:"Annual calendar."},
                {q:"Cricket World Cup?",o:["4 years","2 years","1 year","5 years"],c:0,e:"ODI tournament."},
                {q:"Grand Slam tennis events?",o:["3","4","5","6"],c:1,e:"Four majors."},
                {q:"NBA teams?",o:["30","28","32","26"],c:0,e:"Thirty teams."},
                {q:"NFL teams?",o:["30","32","28","36"],c:1,e:"Thirty-two teams."},
                {q:"Soccer World Cup host 2022?",o:["Qatar","Russia","Brazil","USA"],c:0,e:"Middle East first."},
                {q:"Marathon distance?",o:["42.195 km","40 km","45 km","50 km"],c:0,e:"26.2 miles."},
                {q:"Triple Crown sports?",o:["Horse racing","Baseball","Basketball","Football"],c:0,e:"Three prestigious races."},
                {q:"Decathlon events?",o:["8","10","12","15"],c:1,e:"Ten track and field events."},
                {q:"Pele's country?",o:["Brazil","Argentina","Portugal","Spain"],c:0,e:"Brazilian legend."},
                {q:"Green jacket award?",o:["Masters Golf","Wimbledon","Super Bowl","World Cup"],c:0,e:"Augusta National."},
                {q:"Michael Phelps medals?",o:["23","20","28","18"],c:0,e:"Most decorated Olympian."},
                {q:"Serena Williams slams?",o:["23","20","24","19"],c:0,e:"Open era record."},
                {q:"Boxing weight classes?",o:["8","12","17","20"],c:2,e:"Multiple divisions."},
                {q:"MMA octagon sides?",o:["6","8","10","12"],c:1,e:"Eight-sided cage."}
            ]
        },
        { 
            level: 3, 
            title: "Hall of Famer", 
            questions: [
                {q:"Most Olympics golds?",o:["Phelps","Latynina","Bjørndalen","Nurmi"],c:0,e:"Michael Phelps, 23."}, 
                {q:"Fastest 100m time?",o:["9.58s","9.69s","9.72s","9.79s"],c:0,e:"Bolt's world record."}, 
                {q:"Most Tour de France wins?",o:["7","6","5","8"],c:0,e:"Seven wins (multiple riders)."}, 
                {q:"First modern Olympics?",o:["1896","1900","1888","1904"],c:0,e:"Athens, Greece."}, 
                {q:"Babe Ruth's nickname?",o:["Sultan of Swat","Iron Horse","Say Hey Kid","Splendid Splinter"],c:0,e:"Home run king."},
                {q:"Wilt Chamberlain 100-point game?",o:["1962","1960","1965","1968"],c:0,e:"NBA record."},
                {q:"Miracle on Ice year?",o:["1980","1976","1984","1972"],c:0,e:"USA vs USSR hockey."},
                {q:"Jesse Owens Olympics?",o:["1936","1932","1948","1940"],c:0,e:"Berlin Olympics."},
                {q:"First $100M athlete contract?",o:["Strawberry","Rodriguez","Jordan","Woods"],c:0,e:"Darryl Strawberry, 1990."},
                {q:"Fosbury Flop sport?",o:["High jump","Pole vault","Long jump","Triple jump"],c:0,e:"Revolutionary technique."},
                {q:"Most consecutive MLB games?",o:["2130","2632","2000","2500"],c:1,e:"Cal Ripken Jr."},
                {q:"Perfect 10 gymnast?",o:["Comaneci","Retton","Biles","Miller"],c:0,e:"Nadia Comaneci, 1976."},
                {q:"Bradman's batting average?",o:["99.94","95.50","100.00","89.78"],c:0,e:"Cricket's greatest."},
                {q:"Original Dream Team?",o:["1992","1988","1996","2000"],c:0,e:"Barcelona Olympics."},
                {q:"Most goals one World Cup?",o:["13","11","12","10"],c:0,e:"Just Fontaine, 1958."},
                {q:"Longest tennis match?",o:["8 hours","11 hours","15 hours","18 hours"],c:1,e:"Isner vs Mahut, 11:05."},
                {q:"First athlete billionaire?",o:["Jordan","Woods","Schumacher","Mayweather"],c:0,e:"Michael Jordan."},
                {q:"Rumble in the Jungle?",o:["Ali vs Foreman","Ali vs Frazier","Tyson vs Holyfield","Lewis vs Tyson"],c:0,e:"Zaire, 1974."},
                {q:"Most consecutive Grand Slams?",o:["3","4","5","6"],c:1,e:"Four in a row (multiple players)."},
                {q:"Secretariat's Belmont margin?",o:["20 lengths","31 lengths","15 lengths","25 lengths"],c:1,e:"Triple Crown record."},
                {q:"First woman to run Boston?",o:["Switzer","Gibb","Benoit","Kristiansen"],c:0,e:"Kathrine Switzer, 1967."},
                {q:"Most Super Bowl rings player?",o:["6","7","5","8"],c:1,e:"Tom Brady, 7."},
                {q:"Hank Aaron career HRs?",o:["755","714","762","660"],c:0,e:"MLB home run record."},
                {q:"Four-minute mile breaker?",o:["Bannister","Landy","Snell","Elliott"],c:0,e:"Roger Bannister, 1954."},
                {q:"Most Ballon d'Or awards?",o:["7","6","5","8"],c:0,e:"Lionel Messi."},
                {q:"Youngest heavyweight champ?",o:["Tyson","Ali","Patterson","Foreman"],c:0,e:"Mike Tyson, 20 years old."},
                {q:"Bill Russell NBA titles?",o:["11","10","9","12"],c:0,e:"Celtics dynasty."},
                {q:"First perfect NCAA bracket odds?",o:["1 in 9.2 quintillion","1 in billion","1 in trillion","1 in million"],c:0,e:"Mathematically impossible."},
                {q:"Most PGA Tour wins?",o:["82","73","64","88"],c:0,e:"Sam Snead & Tiger Woods."},
                {q:"Gretzky's famous number?",o:["99","66","88","33"],c:0,e:"The Great One."}
            ]
        }
    ]
  };
// ==========================================
// 🕹️ HELPER FUNCTIONS (Shuffle)
// ==========================================
// Fisher-Yates Shuffle - Ensures pure randomness
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

    // 1. Get ALL available questions for this level
    const allQuestions = campaignData[cat][lvlIdx].questions;
    
    // 2. Shuffle ALL questions first (Crucial for randomness)
    const shuffledQuestions = shuffleArray([...allQuestions]);

    // 3. Slice only the amount needed for this round (Pool Logic)
    // Get the question count for the current level (1, 2, or 3)
    const levelNumber = lvlIdx + 1;
    const questionCount = QUESTIONS_PER_ROUND[levelNumber] || 10;
    const selectedQuestions = shuffledQuestions.slice(0, questionCount);

    // 4. Process options (shuffle options inside the question)
    const processedQs = selectedQuestions.map(q => {
      const originalOpts = q.o;
      const correctTxt = originalOpts[q.c];
      const shuffledOpts = shuffleArray([...originalOpts]);
      return { ...q, o: shuffledOpts, c: shuffledOpts.indexOf(correctTxt) };
    });

    setGame({
      category: cat, levelIdx: lvlIdx, questions: processedQs, qIndex: 0, score: 0, streak: 0, timeLeft: 30, frozen: false, activeLifelines: { fifty: true, freeze: true }, hiddenOptions: []
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
            {/* Remove the Confetti from inside the emoji div - it's already at the app root */}
            <motion.div initial={{scale:0, rotate: -10}} animate={{scale:1, rotate: 0}} transition={{delay:0.2, type:'spring', bounce: 0.5}} className="text-7xl md:text-8xl mb-4 md:mb-6 filter drop-shadow-2xl">
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
      
      {/* 👇 ADD THIS LINE HERE 👇 */}
      <VersionReset />
      {/* 👆 IT RUNS SILENTLY IN THE BACKGROUND 👆 */}

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