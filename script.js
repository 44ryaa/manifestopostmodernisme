// =======================================================
// GLOBAL STATE & SYSTEM INITIALIZATION
// =======================================================

// Active tab
let activeTab = 'orbit';

// Initialize audio variables
let audioCtx = null;
let bgSynthNode = null;
let ambientInterval = null;
let isPlayingAudio = false;

// Quotes for Astronaut
const astroQuotes = [
  "Kamu itu mirip lubang hitam (black hole)... Soalnya seluruh atensiku ketarik ke kamu terus! 🕳️💖",
  "Hubungan kita itu kayak gaya gravitasi. Selalu menarik kita berdua buat deketan. 🌌🔭",
  "Aku rela jadi astronot, asal tujuan akhir pendaratannya di planet hatimu. 🚀💓",
  "Kenapa sih di luar angkasa gak ada udara? Soalnya semua oksigennya udah kesedot pesona senyummu! 💨🥰",
  "Aku gak butuh teleskop Hubble buat nyari bintang tercantik, kan bintangnya udah ada di depanku sekarang. ⭐👀",
  "I love you to the moon and back... plus 10x orbit Jupiter! 🌙🛸",
  "Meskipun tata surya punya 8 planet, bagiku cuma ada 1 planet tempatku bernaung: Kamu. 🌍💘",
  "Kamu tahu bedanya kamu sama asteroid? Asteroid merusak bumi, kalau kamu memperindah duniaku. ☄️🌸"
];

// Load Anniversary Date from Local Storage or set default
let anniversaryDate = new Date("2025-06-06T00:00:00");
const storedDate = localStorage.getItem("cosmic_love_date");
if (storedDate) {
  anniversaryDate = new Date(storedDate);
} else {
  localStorage.setItem("cosmic_love_date", anniversaryDate.toISOString().split('T')[0]);
}

// Set initial value in date picker
document.getElementById('anniversary-date').value = anniversaryDate.toISOString().split('T')[0];

// Handle anniversary date change
document.getElementById('anniversary-date').addEventListener('change', (e) => {
  if (e.target.value) {
    anniversaryDate = new Date(e.target.value + "T00:00:00");
    localStorage.setItem("cosmic_love_date", e.target.value);
    playSynthTone(330, 'triangle', 0.1, 0.2); // play small feedback beep
    updateTimer();
  }
});

// Switch Tabs
function switchTab(tabId) {
  if (tabId === activeTab) return;
  
  // Play tab switch sound
  playSynthTone(440, 'sine', 0.05, 0.15);
  setTimeout(() => playSynthTone(660, 'sine', 0.05, 0.15), 60);

  // Remove active classes
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

  // Add active classes to selected
  const btns = document.querySelectorAll('.tab-btn');
  const indexMap = { 'orbit': 0, 'radar': 1, 'secret': 2, 'arcade': 3 };
  btns[indexMap[tabId]].classList.add('active');
  document.getElementById(`panel-${tabId}`).classList.add('active');

  activeTab = tabId;

  // If entering game tab, stop background loop if necessary, but keep it clean.
  if (tabId === 'arcade') {
    initGame();
  } else {
    stopGameLoop();
  }
}

// =======================================================
// STARFIELD CANVAS BACKGROUND
// =======================================================
const starCanvas = document.getElementById('starCanvas');
const starCtx = starCanvas.getContext('2d');
let stars = [];
let meteors = [];

function resizeStarCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeStarCanvas);
resizeStarCanvas();

// Initialize Stars
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.05 + 0.01,
    twinkle: Math.random(),
    color: Math.random() > 0.45 ? '#ffffff' : (Math.random() > 0.5 ? '#ff79c6' : '#8be9fd')
  });
}

// Animation loop for starfield
function drawStarfield() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  
  // Draw Stars
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > starCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starCanvas.width;
    }
    
    // Twinkle effect
    star.twinkle += 0.01;
    const alpha = 0.3 + Math.abs(Math.sin(star.twinkle)) * 0.7;
    
    starCtx.fillStyle = star.color;
    starCtx.globalAlpha = alpha;
    starCtx.beginPath();
    starCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    starCtx.fill();
  });
  
  // Draw Meteors (Shooting stars)
  if (Math.random() < 0.005 && meteors.length < 2) {
    meteors.push({
      x: Math.random() * starCanvas.width,
      y: 0,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 12 + 6,
      angle: Math.PI / 4 + (Math.random() * 0.1 - 0.05),
      opacity: 1
    });
  }
  
  meteors.forEach((m, idx) => {
    m.x += Math.cos(m.angle) * m.speed;
    m.y += Math.sin(m.angle) * m.speed;
    m.opacity -= 0.02;
    
    if (m.opacity <= 0 || m.x > starCanvas.width || m.y > starCanvas.height) {
      meteors.splice(idx, 1);
    } else {
      starCtx.strokeStyle = `rgba(255, 121, 198, ${m.opacity})`;
      starCtx.lineWidth = 2;
      starCtx.beginPath();
      starCtx.moveTo(m.x, m.y);
      starCtx.lineTo(m.x - Math.cos(m.angle) * m.length, m.y - Math.sin(m.angle) * m.length);
      starCtx.stroke();
    }
  });
  
  starCtx.globalAlpha = 1.0;
  requestAnimationFrame(drawStarfield);
}
drawStarfield();

// =======================================================
// ANNIVERSARY COUNTER (ORBIT KITA)
// =======================================================
function updateTimer() {
  const diff = Date.now() - anniversaryDate.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  
  document.getElementById('val-days').innerText = days;
  document.getElementById('val-hours').innerText = hours;
  document.getElementById('val-mins').innerText = mins;
  document.getElementById('val-secs').innerText = secs;
  
  document.getElementById('days-summary').innerText = days;
}
setInterval(updateTimer, 1000);
updateTimer();

// =======================================================
// LOVE RADAR CALCULATOR
// =======================================================
let scanning = false;
function calculateAttraction() {
  if (scanning) return;
  const name1 = document.getElementById('name1').value.trim();
  const name2 = document.getElementById('name2').value.trim();
  
  if (!name1 || !name2) {
    alert("Silakan isi nama kamu dan nama pacar kamu dulu ya!");
    return;
  }
  
  scanning = true;
  const resultDiv = document.getElementById('radarResult');
  const radarHeart = document.getElementById('radarHeart');
  
  resultDiv.classList.add('show');
  radarHeart.classList.add('active');
  radarHeart.innerText = "❤️";
  
  const scanMessages = [
    "Menghubungkan satelit cinta kosmik...",
    "Menganalisis kecocokan orbit energi...",
    "Mengukur tarikan gravitasi batin...",
    "Menghitung densitas lubang hitam asmara..."
  ];
  
  let step = 0;
  playSynthTone(150, 'sawtooth', 0.2, 0.4); // Start scanning noise
  
  const scanInterval = setInterval(() => {
    if (step < scanMessages.length) {
      resultDiv.innerHTML = `<span style="color:#8be9fd;">[SCANNING]</span> ${scanMessages[step]}`;
      playSynthTone(200 + (step * 80), 'sine', 0.1, 0.2);
      step++;
    } else {
      clearInterval(scanInterval);
      
      // Output Result
      resultDiv.innerHTML = `
        Gaya tarik gravitasi cinta antara <span style="color:#8be9fd;">${name1}</span> & <span style="color:#ff79c6;">${name2}</span> adalah:
        <span class="radar-result-val">1000% (MUTLAK)</span>
        <span style="font-size:0.85rem; color:#a9b1d6; display:block; margin-top:8px;">
          Dua planet telah terikat orbit permanen. Gravitasi kalian terlalu padat, bahkan cahaya pun gak bisa lolos dari pesona cinta kalian! 🌌💖
        </span>
      `;
      
      // Big result sound
      playSynthTone(523.25, 'sine', 0.2, 0.4); // C5
      setTimeout(() => playSynthTone(659.25, 'sine', 0.2, 0.4), 150); // E5
      setTimeout(() => playSynthTone(783.99, 'sine', 0.2, 0.5), 300); // G5
      setTimeout(() => playSynthTone(1046.50, 'sine', 0.3, 0.8), 450); // C6
      
      // Confetti burst
      createCosmicConfetti();
      
      scanning = false;
      radarHeart.classList.remove('active');
    }
  }, 600);
}

// Particle effect for Radar Result
function createCosmicConfetti() {
  const colors = ['#ff79c6', '#8be9fd', '#bd93f9', '#ffb8d1', '#f1fa8c'];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'cosmic-confetti';
    
    const size = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 180 + 80;
    
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background = color;
    el.style.left = `${centerX}px`;
    el.style.top = `${centerY}px`;
    el.style.boxShadow = `0 0 10px ${color}`;
    el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

// =======================================================
// DECRYPTION TERMINAL (TRANSMISI RAHASIA)
// =======================================================
let decrypting = false;
const letterText = `TRANSMISI DEKRIPSI BERHASIL... 📡💚

=========================================
SENDER: PENGENDALI MISI CINTA
RECEIVER: BINTANG UTAMAKU
STATUS: TERKONEKSI PENUH
=========================================

Halo Sayang! ✨
Ini adalah transmisi rahasia langsung dari pusat kendali hatiku. 

Aku cuma mau bilang... meskipun alam semesta ini luasnya minta ampun, lengkap dengan miliaran gugusan bintang, galaksi raksasa, dan nebula yang indah, mataku dan hatiku cuma mau mengunci satu koordinat saja: KAMU. 🌌

Kamu itu ibarat cahaya nebula pink tercantik—selalu berhasil memukau dan menghangatkan duniaku yang sebelumnya sedingin luar angkasa. Keberadaan kamu memberi gaya gravitasi yang bikin orbit hidupku jadi stabil dan bahagia. 🚀

Terima kasih ya sudah menemani perjalanan luar angkasa ini. Aku sayang kamu sampai ke batas terjauh cakrawala peristiwa (event horizon) dan kembali lagi! 🪐🛸💖`;

function decryptMessage(e) {
  e.preventDefault();
  if (decrypting) return;
  
  const input = document.getElementById('decryptPass').value.trim().toLowerCase();
  const form = document.getElementById('decryptForm');
  const output = document.getElementById('consoleOutput');
  const consoleBody = document.getElementById('consoleBody');
  
  const validPasswords = ['sayang', 'nana', 'cinta', 'love', 'manis', 'ayang', 'pacar', 'cantik', 'chubby', 'gemes'];
  
  if (validPasswords.includes(input)) {
    decrypting = true;
    form.style.display = 'none';
    output.classList.add('show');
    output.innerHTML = '';
    
    playSynthTone(100, 'sawtooth', 0.2, 0.5); // decryption hum
    
    let charIdx = 0;
    const typeSpeed = 25; // ms per char
    
    // Auto scroll console
    const scrollInterval = setInterval(() => {
      consoleBody.scrollTop = consoleBody.scrollHeight;
    }, 100);

    function type() {
      if (charIdx < letterText.length) {
        const char = letterText.charAt(charIdx);
        output.innerHTML += char;
        
        // Soft keyboard tick sound occasionally
        if (charIdx % 3 === 0 && char !== ' ' && char !== '\n') {
          playSynthTone(800 + Math.random() * 400, 'sine', 0.01, 0.05);
        }
        
        charIdx++;
        setTimeout(type, typeSpeed);
      } else {
        clearInterval(scrollInterval);
        output.innerHTML += '<span class="cursor"></span>';
        decrypting = false;
        createCosmicConfetti(); // celebration splash!
      }
    }
    
    type();
  } else {
    // Fail sound
    playSynthTone(120, 'sawtooth', 0.3, 0.3);
    const failLine = document.createElement('div');
    failLine.className = 'console-line';
    failLine.style.color = '#ff5555';
    failLine.innerText = `DECRYPTION ERROR: Sandi "${input}" ditolak oleh protokol keamanan cinta.`;
    consoleBody.insertBefore(failLine, form);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }
}

// =======================================================
// INTERACTIVE ASTRONAUT
// =======================================================
let isFlipping = false;
const astroBubble = document.getElementById('astroBubble');
let bubbleTimeout = null;

function clickAstro() {
  if (isFlipping) return;
  isFlipping = true;
  
  const astro = document.getElementById('astro');
  astro.classList.add('flip');
  
  // Jump laser SFX
  playSynthTone(300, 'sine', 0.2, 0.3);
  setTimeout(() => playSynthTone(600, 'sine', 0.1, 0.2), 100);
  setTimeout(() => playSynthTone(1200, 'sine', 0.05, 0.15), 200);

  // Pick random quote
  const randomQuote = astroQuotes[Math.floor(Math.random() * astroQuotes.length)];
  
  // Display quote in bubble with typewriter style or immediate
  astroBubble.innerHTML = '';
  astroBubble.style.opacity = 1;
  astroBubble.style.transform = 'scale(1) translateY(0)';
  
  let qIdx = 0;
  function typeQuote() {
    if (qIdx < randomQuote.length) {
      astroBubble.innerHTML += randomQuote.charAt(qIdx);
      qIdx++;
      setTimeout(typeQuote, 20);
    }
  }
  typeQuote();

  // Reset bounce/flip class
  setTimeout(() => {
    astro.classList.remove('flip');
    isFlipping = false;
  }, 600);
  
  // Clear existing bubble timeout
  if (bubbleTimeout) clearTimeout(bubbleTimeout);
  
  // Hide bubble after 6 seconds
  bubbleTimeout = setTimeout(() => {
    astroBubble.style.opacity = 0;
    astroBubble.style.transform = 'scale(0.8) translateY(10px)';
  }, 6500);
}

// =======================================================
// WEB AUDIO API SYNTHESIZER
// =======================================================

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Play procedurally generated beep/tone
function playSynthTone(freq, type = 'sine', vol = 0.1, duration = 0.5) {
  try {
    initAudio();
    if (!audioCtx) return;
    
    // Create nodes
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Filter out harsh highs for space aesthetic
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    // Connect
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.error("Audio synth error:", err);
  }
}

// Background space music chords generator
function startAmbientMusic() {
  initAudio();
  if (!audioCtx) return;
  
  isPlayingAudio = true;
  document.getElementById('audioBtn').classList.add('playing');
  document.getElementById('audioIcon').innerHTML = `
    <!-- Unmute Wave icon -->
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-6z" fill="#ff79c6"/>
  `;

  // Chords progression (Frequencies): Cmaj7, Am9, Fmaj7, G11
  const progressions = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
    [110.00, 146.83, 164.81, 220.00], // Am9 (A2, D3, E3, A3)
    [87.31, 130.81, 174.61, 220.00],  // Fmaj7 (F2, C3, F3, A3)
    [98.00, 146.83, 196.00, 246.94]   // G11 (G2, D3, G3, B3)
  ];
  
  let chordIndex = 0;
  
  function playNextChord() {
    if (!isPlayingAudio) return;
    const chord = progressions[chordIndex];
    
    chord.forEach((noteFreq, idx) => {
      // Stagger notes slightly for arpeggio feel
      setTimeout(() => {
        if (!isPlayingAudio) return;
        playCosmicPadNote(noteFreq, 4.0);
      }, idx * 150);
    });
    
    chordIndex = (chordIndex + 1) % progressions.length;
  }
  
  playNextChord();
  ambientInterval = setInterval(playNextChord, 6000);
}

function playCosmicPadNote(freq, duration) {
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, audioCtx.currentTime);
    
    // Slow attack and decay envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.5);
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime + duration - 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function stopAmbientMusic() {
  isPlayingAudio = false;
  clearInterval(ambientInterval);
  document.getElementById('audioBtn').classList.remove('playing');
  document.getElementById('audioIcon').innerHTML = `
    <!-- Mute Icon -->
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-8 5.77H2v6h4l5 5V4L6 9z" fill="#8be9fd"/>
  `;
}

document.getElementById('audioBtn').addEventListener('click', () => {
  if (isPlayingAudio) {
    stopAmbientMusic();
  } else {
    startAmbientMusic();
  }
});

// =======================================================
// LOVE ROCKET CANVAS 2D MINIGAME
// =======================================================
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc = document.getElementById('overlayDesc');

let gameRunning = false;
let gameLoopId = null;
let gameScore = 0;
let playerHealth = 100;
let playerX = 240;
const playerWidth = 36;
const playerHeight = 44;

let heartsList = [];
let asteroidsList = [];
let particlesList = [];

let keyLeft = false;
let keyRight = false;

// Handle Controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyRight = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyRight = false;
});

// Mouse/Touch controls on Canvas
function handleMove(clientX) {
  const rect = gameCanvas.getBoundingClientRect();
  const scaleX = gameCanvas.width / rect.width;
  const targetX = (clientX - rect.left) * scaleX;
  playerX = Math.max(playerWidth / 2, Math.min(gameCanvas.width - playerWidth / 2, targetX));
}

gameCanvas.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  handleMove(e.clientX);
});

gameCanvas.addEventListener('touchmove', (e) => {
  if (!gameRunning) return;
  if (e.touches.length > 0) {
    handleMove(e.touches[0].clientX);
    e.preventDefault();
  }
}, { passive: false });

function initGame() {
  // Reset elements
  gameScore = 0;
  playerHealth = 100;
  playerX = gameCanvas.width / 2;
  heartsList = [];
  asteroidsList = [];
  particlesList = [];
  
  // Clear canvas
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

function startGame() {
  initGame();
  gameOverlay.classList.add('hidden');
  gameRunning = true;
  
  playSynthTone(261.63, 'sine', 0.2, 0.2); // start match sounds C4
  setTimeout(() => playSynthTone(329.63, 'sine', 0.2, 0.2), 100); // E4
  setTimeout(() => playSynthTone(392.00, 'sine', 0.2, 0.4), 200); // G4
  
  gameLoop();
}

function stopGameLoop() {
  gameRunning = false;
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

function gameOver() {
  stopGameLoop();
  
  // Fail/Explode final SFX
  playSynthTone(100, 'sawtooth', 0.5, 0.8);
  
  gameOverlay.classList.remove('hidden');
  overlayTitle.innerText = "Misi Cinta Selesai! 🚀💔";
  
  let ranking = "Bucin Pemula 🚀";
  if (gameScore >= 300) {
    ranking = "Bucin Legendaris Penguasa Alam Semesta 👑🌌";
  } else if (gameScore >= 120) {
    ranking = "Kapten Cinta Galaksi 🛸";
  }
  
  overlayDesc.innerHTML = `
    Skor Akhir: <strong style="color:var(--neon-pink); font-size:1.3rem;">${gameScore}</strong><br>
    Pangkat Bucin: <strong>${ranking}</strong><br><br>
    Tenang, cinta kita gak bakal hancur cuma gara-gara meteor! Main lagi?
  `;
}

// Spawn engine
let heartSpawnTimer = 0;
let asteroidSpawnTimer = 0;

function gameLoop() {
  if (!gameRunning) return;
  
  updateGame();
  drawGame();
  
  gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame() {
  // Handle keyboard inputs
  if (keyLeft) {
    playerX = Math.max(playerWidth / 2, playerX - 5);
  }
  if (keyRight) {
    playerX = Math.min(gameCanvas.width - playerWidth / 2, playerX + 5);
  }
  
  // Spawn Hearts
  heartSpawnTimer++;
  if (heartSpawnTimer > 35) {
    heartSpawnTimer = 0;
    heartsList.push({
      x: Math.random() * (gameCanvas.width - 20) + 10,
      y: -20,
      speed: Math.random() * 2 + 1.5,
      size: Math.random() * 10 + 10
    });
  }
  
  // Spawn Asteroids
  asteroidSpawnTimer++;
  if (asteroidSpawnTimer > 55) {
    asteroidSpawnTimer = 0;
    asteroidsList.push({
      x: Math.random() * (gameCanvas.width - 20) + 10,
      y: -20,
      speed: Math.random() * 2.5 + 2,
      size: Math.random() * 12 + 10,
      rotation: 0,
      rotSpeed: Math.random() * 0.05 - 0.025
    });
  }
  
  // Update Hearts
  heartsList.forEach((h, hIdx) => {
    h.y += h.speed;
    
    // Check Collision with Ship
    const distX = Math.abs(h.x - playerX);
    const distY = Math.abs(h.y - (gameCanvas.height - 35));
    
    if (distX < (playerWidth / 2 + h.size / 2) && distY < (playerHeight / 2 + h.size / 2)) {
      heartsList.splice(hIdx, 1);
      gameScore += 10;
      
      // Pling sound
      playSynthTone(700 + Math.random() * 300, 'sine', 0.1, 0.15);
      
      // Spawn floating score particles
      spawnParticles(h.x, h.y, '#ff79c6');
    }
    
    // Out of bounds
    if (h.y > gameCanvas.height + 20) {
      heartsList.splice(hIdx, 1);
    }
  });
  
  // Update Asteroids
  asteroidsList.forEach((a, aIdx) => {
    a.y += a.speed;
    a.rotation += a.rotSpeed;
    
    // Check Collision
    const distX = Math.abs(a.x - playerX);
    const distY = Math.abs(a.y - (gameCanvas.height - 35));
    
    if (distX < (playerWidth / 2 + a.size / 2) && distY < (playerHeight / 2 + a.size / 2)) {
      asteroidsList.splice(aIdx, 1);
      playerHealth = Math.max(0, playerHealth - 20);
      
      // Explode sound
      playSynthTone(90, 'triangle', 0.35, 0.4);
      
      spawnParticles(a.x, a.y, '#8be9fd');
      
      if (playerHealth <= 0) {
        gameOver();
      }
    }
    
    if (a.y > gameCanvas.height + 20) {
      asteroidsList.splice(aIdx, 1);
    }
  });
  
  // Update Particles
  particlesList.forEach((p, pIdx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
    if (p.alpha <= 0) {
      particlesList.splice(pIdx, 1);
    }
  });
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particlesList.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      alpha: 1,
      size: Math.random() * 3 + 2
    });
  }
}

function drawGame() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  // Draw Background Grid/Space Dust
  gameCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < gameCanvas.width; i += 40) {
    gameCtx.fillRect(i, 0, 1, gameCanvas.height);
  }
  
  // Draw Rocket (USS Bucin)
  drawRocket(playerX, gameCanvas.height - 35);
  
  // Draw Hearts
  heartsList.forEach(h => {
    drawHeart(h.x, h.y, h.size);
  });
  
  // Draw Asteroids
  asteroidsList.forEach(a => {
    drawAsteroid(a.x, a.y, a.size, a.rotation);
  });
  
  // Draw Particles
  particlesList.forEach(p => {
    gameCtx.save();
    gameCtx.globalAlpha = p.alpha;
    gameCtx.fillStyle = p.color;
    gameCtx.beginPath();
    gameCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    gameCtx.fill();
    gameCtx.restore();
  });
  
  // Draw HUD (Heads-Up Display)
  // Score
  gameCtx.fillStyle = '#fff';
  gameCtx.font = 'bold 12px "Space Grotesk", sans-serif';
  gameCtx.fillText(`SKOR: ${gameScore}`, 15, 25);
  
  // Fuel/Health Bar
  gameCtx.fillText('BAHAN BAKAR CINTA:', 240, 25);
  gameCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  gameCtx.fillRect(360, 14, 100, 12);
  
  const barColor = playerHealth > 40 ? '#ff79c6' : '#ff5555';
  gameCtx.fillStyle = barColor;
  gameCtx.fillRect(360, 14, playerHealth, 12);
}

function drawRocket(x, y) {
  gameCtx.save();
  gameCtx.translate(x, y);
  
  // Fire thruster
  if (Math.random() > 0.3) {
    gameCtx.fillStyle = Math.random() > 0.5 ? '#ff5555' : '#ffb8d1';
    gameCtx.beginPath();
    gameCtx.moveTo(-6, playerHeight / 2 - 4);
    gameCtx.lineTo(0, playerHeight / 2 + 10);
    gameCtx.lineTo(6, playerHeight / 2 - 4);
    gameCtx.closePath();
    gameCtx.fill();
  }
  
  // Rocket Body (Pink cone & cylindrical shell)
  gameCtx.fillStyle = '#ff79c6';
  gameCtx.beginPath();
  gameCtx.moveTo(0, -playerHeight / 2);
  gameCtx.lineTo(playerWidth / 2 - 4, -5);
  gameCtx.lineTo(playerWidth / 2 - 4, playerHeight / 2 - 4);
  gameCtx.lineTo(-playerWidth / 2 + 4, playerHeight / 2 - 4);
  gameCtx.lineTo(-playerWidth / 2 + 4, -5);
  gameCtx.closePath();
  gameCtx.fill();
  
  // Wings (Cyan edges)
  gameCtx.fillStyle = '#8be9fd';
  // Left Wing
  gameCtx.beginPath();
  gameCtx.moveTo(-playerWidth / 2 + 4, 0);
  gameCtx.lineTo(-playerWidth / 2, playerHeight / 2);
  gameCtx.lineTo(-playerWidth / 2 + 4, playerHeight / 2 - 4);
  gameCtx.closePath();
  gameCtx.fill();
  // Right Wing
  gameCtx.beginPath();
  gameCtx.moveTo(playerWidth / 2 - 4, 0);
  gameCtx.lineTo(playerWidth / 2, playerHeight / 2);
  gameCtx.lineTo(playerWidth / 2 - 4, playerHeight / 2 - 4);
  gameCtx.closePath();
  gameCtx.fill();

  // Helmet Window (Cyan circle)
  gameCtx.fillStyle = '#06020f';
  gameCtx.strokeStyle = '#8be9fd';
  gameCtx.lineWidth = 1.5;
  gameCtx.beginPath();
  gameCtx.arc(0, -6, 6, 0, Math.PI * 2);
  gameCtx.fill();
  gameCtx.stroke();
  
  // Little heart on rocket nose
  gameCtx.fillStyle = '#fff';
  gameCtx.font = '8px Arial';
  gameCtx.fillText('♥', -3.5, 6);
  
  gameCtx.restore();
}

function drawHeart(x, y, size) {
  gameCtx.save();
  gameCtx.translate(x, y);
  
  gameCtx.fillStyle = '#ff5555';
  gameCtx.beginPath();
  // Left bulge
  gameCtx.arc(-size/4, 0, size/4, Math.PI, 0, false);
  // Right bulge
  gameCtx.arc(size/4, 0, size/4, Math.PI, 0, false);
  // Bottom point
  gameCtx.lineTo(0, size/2);
  gameCtx.closePath();
  gameCtx.fill();
  
  // Highlight
  gameCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  gameCtx.beginPath();
  gameCtx.arc(-size/4, -size/12, size/12, 0, Math.PI * 2);
  gameCtx.fill();
  
  gameCtx.restore();
}

function drawAsteroid(x, y, size, rotation) {
  gameCtx.save();
  gameCtx.translate(x, y);
  gameCtx.rotate(rotation);
  
  gameCtx.fillStyle = '#718096';
  gameCtx.strokeStyle = '#2d3748';
  gameCtx.lineWidth = 2;
  
  // Draw bumpy circle
  gameCtx.beginPath();
  const points = 7;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // adding noise to radius to make it look jagged
    const radiusNoise = (Math.sin(angle * 3) + Math.cos(angle * 2)) * 2;
    const r = size / 2 + radiusNoise;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) gameCtx.moveTo(px, py);
    else gameCtx.lineTo(px, py);
  }
  gameCtx.closePath();
  gameCtx.fill();
  gameCtx.stroke();
  
  // Draw craters
  gameCtx.fillStyle = '#4a5568';
  gameCtx.beginPath();
  gameCtx.arc(-size/6, -size/6, size/8, 0, Math.PI * 2);
  gameCtx.fill();
  
  gameCtx.beginPath();
  gameCtx.arc(size/5, size/7, size/10, 0, Math.PI * 2);
  gameCtx.fill();

  gameCtx.restore();
}
