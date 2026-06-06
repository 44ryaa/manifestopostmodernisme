// =======================================================
// GLOBAL STATE & SYSTEM INITIALIZATION
// =======================================================

// Active tab
let activeTab = 'orbit';

// YouTube Player
let ytPlayer = null;
let isPlayingAudio = false;
const YT_VIDEO_ID = 'HxR32xRuLM0';

// Web Audio API (masih dipakai untuk efek suara UI kecil)
let audioCtx = null;

// Custom transmission variables
let customDecryptionKey = null;
let customDecryptionMessage = null;

// Love Lasers variables
let lasersList = [];
let laserCooldown = 0;

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

// Run customizations and bindings
setupPlanetCustomizer();
setupMobileGameControls();
parseSharedTransmission();

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
// YOUTUBE MUSIC PLAYER
// =======================================================

// Callback dipanggil otomatis saat YouTube IFrame API siap
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayer', {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      loop: 1,
      playlist: YT_VIDEO_ID,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: onYTPlayerReady,
      onStateChange: onYTPlayerStateChange,
    }
  });
}

function onYTPlayerReady(event) {
  // Player siap, set volume ke 70%
  event.target.setVolume(70);
}

function onYTPlayerStateChange(event) {
  const btn = document.getElementById('audioBtn');
  if (!btn) return;

  // YT.PlayerState.PLAYING = 1
  if (event.data === 1) {
    isPlayingAudio = true;
    btn.classList.add('playing');
    btn.title = 'Pause Musik';
    showMusicToast('Musik sedang diputar 🎶');
  } else if (event.data === 2 || event.data === 0) {
    // PAUSED = 2, ENDED = 0
    isPlayingAudio = false;
    btn.classList.remove('playing');
    btn.title = 'Putar Musik Latar 🎵';
  }
}

function toggleYTMusic() {
  if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
    showMusicToast('Player belum siap, coba lagi...');
    return;
  }

  const state = ytPlayer.getPlayerState();

  if (state === 1) {
    // Sedang main → pause
    ytPlayer.pauseVideo();
  } else {
    // Tidak main → play
    ytPlayer.playVideo();
  }
  playSynthTone(440, 'sine', 0.05, 0.1);
}

// Pasang event ke tombol audio
const audioBtnEl = document.getElementById('audioBtn');
if (audioBtnEl) {
  audioBtnEl.addEventListener('click', toggleYTMusic);
}

function showMusicToast(msg) {
  const toast = document.getElementById('musicToast');
  const sub   = document.getElementById('musicToastSub');
  if (!toast) return;
  if (sub) sub.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// iOS Safari: pastikan audio bisa jalan setelah interaksi pertama
['click', 'touchstart'].forEach(type => {
  window.addEventListener(type, () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
});

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
  
  let isCorrect = false;
  let textToDisplay = letterText;

  if (customDecryptionKey) {
    if (input === customDecryptionKey) {
      isCorrect = true;
      textToDisplay = `TRANSMISI KHUSUS DEKRIPSI BERHASIL... 📡💚\n\n=========================================\nSENDER: PASANGAN SPESIALMU\nRECEIVER: BELAHAN JIWAKU\nSTATUS: TERKONEKSI PENUH\n=========================================\n\n${customDecryptionMessage}`;
    }
  } else {
    if (validPasswords.includes(input)) {
      isCorrect = true;
    }
  }
  
  if (isCorrect) {
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
      if (charIdx < textToDisplay.length) {
        const char = textToDisplay.charAt(charIdx);
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
// WEB AUDIO API — Hanya untuk efek UI kecil (bukan musik latar)
// =======================================================

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}

function playSynthTone(freq, type = 'sine', vol = 0.07, duration = 0.3) {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc      = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {}
}

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
  lasersList = [];
  laserCooldown = 0;
  
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
  
  // Spawn Automatic Love Lasers
  if (gameRunning) {
    laserCooldown++;
    if (laserCooldown >= 22) { // fire every ~0.36 seconds
      laserCooldown = 0;
      lasersList.push({
        x: playerX,
        y: gameCanvas.height - 35 - 12,
        speed: 6,
        size: 5
      });
      playSynthTone(550 + Math.random() * 150, 'sine', 0.03, 0.08);
    }
  }

  // Update Lasers
  lasersList.forEach((l, lIdx) => {
    l.y -= l.speed;
    
    // Check Collision with Asteroids
    asteroidsList.forEach((a, aIdx) => {
      const distX = Math.abs(l.x - a.x);
      const distY = Math.abs(l.y - a.y);
      
      if (distX < (a.size / 2 + l.size) && distY < (a.size / 2 + l.size)) {
        lasersList.splice(lIdx, 1);
        asteroidsList.splice(aIdx, 1);
        gameScore += 5;
        
        // Blast sound
        playSynthTone(220 + Math.random() * 110, 'triangle', 0.12, 0.15);
        
        // Spawn particles
        spawnParticles(a.x, a.y, '#bd93f9');
      }
    });
    
    // Out of bounds
    if (l.y < -10) {
      lasersList.splice(lIdx, 1);
    }
  });

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
  
  // Draw Lasers
  lasersList.forEach(l => {
    drawLaser(l.x, l.y, l.size);
  });

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

function drawLaser(x, y, size) {
  gameCtx.save();
  gameCtx.translate(x, y);
  
  // Glowing cyan energy orb
  gameCtx.fillStyle = '#8be9fd';
  gameCtx.shadowColor = '#8be9fd';
  gameCtx.shadowBlur = 8;
  gameCtx.beginPath();
  gameCtx.arc(0, 0, size, 0, Math.PI * 2);
  gameCtx.fill();
  
  gameCtx.restore();
}

// =======================================================
// CUSTOM PLANET BUILDER & COLOR MAPS
// =======================================================
const colorPresets = {
  pink: { color: '#d90368', light: '#ffb8d1', glow: 'rgba(217, 3, 104, 0.8)' },
  blue: { color: '#0077b6', light: '#a1fffe', glow: 'rgba(0, 119, 182, 0.8)' },
  purple: { color: '#8a2be2', light: '#d8b4fe', glow: 'rgba(138, 43, 226, 0.8)' },
  green: { color: '#00f5d4', light: '#cafff0', glow: 'rgba(0, 245, 212, 0.8)' },
  gold: { color: '#ff9f1c', light: '#ffdfa1', glow: 'rgba(255, 159, 28, 0.8)' }
};

function applyPlanetColor(planetNum, colorKey) {
  const preset = colorPresets[colorKey];
  if (!preset) return;
  document.documentElement.style.setProperty(`--planet-${planetNum}-color`, preset.color);
  document.documentElement.style.setProperty(`--planet-${planetNum}-light`, preset.light);
  document.documentElement.style.setProperty(`--planet-${planetNum}-glow`, preset.glow);
}

function applyOrbitSpeed(speedVal) {
  let speed1 = '7s';
  let speed2 = '12s';
  if (speedVal === 'slow') {
    speed1 = '14s';
    speed2 = '24s';
  } else if (speedVal === 'fast') {
    speed1 = '3.5s';
    speed2 = '6s';
  }
  document.documentElement.style.setProperty('--orbit-1-speed', speed1);
  document.documentElement.style.setProperty('--orbit-2-speed', speed2);
}

function updateOrbitText(name1, name2) {
  const p1Label = document.getElementById('planet1-label');
  const p2Label = document.getElementById('planet2-label');
  if (p1Label) p1Label.innerText = name1;
  if (p2Label) p2Label.innerText = name2;
}

function setupPlanetCustomizer() {
  const customizerToggle = document.getElementById('customizerToggle');
  const customizerBox = document.getElementById('customizerBox');
  if (customizerToggle && customizerBox) {
    customizerToggle.addEventListener('click', () => {
      customizerBox.classList.toggle('open');
      playSynthTone(400, 'sine', 0.05, 0.1);
    });
  }

  // Bind Name Input
  const p1Input = document.getElementById('planet1Name');
  const p2Input = document.getElementById('planet2Name');
  const p1Planet = document.getElementById('orbitPlanet1');
  const p2Planet = document.getElementById('orbitPlanet2');

  const savedP1Name = localStorage.getItem('planet1_name') || 'Kamu';
  const savedP2Name = localStorage.getItem('planet2_name') || 'Aku';

  if (p1Input && p2Input) {
    p1Input.value = savedP1Name;
    p2Input.value = savedP2Name;
    if (p1Planet) p1Planet.setAttribute('title', savedP1Name);
    if (p2Planet) p2Planet.setAttribute('title', savedP2Name);
    updateOrbitText(savedP1Name, savedP2Name);

    p1Input.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Kamu';
      if (p1Planet) p1Planet.setAttribute('title', val);
      localStorage.setItem('planet1_name', val);
      updateOrbitText(val, p2Input.value.trim() || 'Aku');
    });

    p2Input.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Aku';
      if (p2Planet) p2Planet.setAttribute('title', val);
      localStorage.setItem('planet2_name', val);
      updateOrbitText(p1Input.value.trim() || 'Kamu', val);
    });
  }

  // Setup Presets
  const setupPresets = (planetNum) => {
    const container = document.getElementById(`planet${planetNum}Presets`);
    if (!container) return;
    const dots = container.querySelectorAll('.color-preset-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        const colorKey = dot.getAttribute('data-color');
        applyPlanetColor(planetNum, colorKey);
        localStorage.setItem(`planet${planetNum}_color`, colorKey);
        playSynthTone(500 + (planetNum * 100), 'sine', 0.05, 0.15);
      });
    });
  };
  setupPresets(1);
  setupPresets(2);

  // Bind Speed Select
  const speedSelect = document.getElementById('orbitSpeedSelect');
  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      applyOrbitSpeed(e.target.value);
      localStorage.setItem('orbit_speed', e.target.value);
      playSynthTone(440, 'sine', 0.05, 0.15);
    });
  }

  // Load Saved customizations
  const savedP1Color = localStorage.getItem('planet1_color') || 'pink';
  const savedP2Color = localStorage.getItem('planet2_color') || 'blue';
  applyPlanetColor(1, savedP1Color);
  applyPlanetColor(2, savedP2Color);

  const selectPresetDot = (planetNum, colorKey) => {
    const dots = document.querySelectorAll(`#planet${planetNum}Presets .color-preset-dot`);
    dots.forEach(dot => {
      if (dot.getAttribute('data-color') === colorKey) dot.classList.add('selected');
      else dot.classList.remove('selected');
    });
  };
  selectPresetDot(1, savedP1Color);
  selectPresetDot(2, savedP2Color);

  const savedSpeed = localStorage.getItem('orbit_speed') || 'medium';
  if (speedSelect) speedSelect.value = savedSpeed;
  applyOrbitSpeed(savedSpeed);
}

// =======================================================
// CONSOLE MULTI-MODE & ENCRYPTION TERMINAL
// =======================================================
function switchConsoleMode(mode) {
  const btnDecrypt = document.getElementById('btnConsoleDecrypt');
  const btnEncrypt = document.getElementById('btnConsoleEncrypt');
  const decryptContent = document.getElementById('consoleDecryptContent');
  const encryptContent = document.getElementById('consoleEncryptContent');

  if (!btnDecrypt || !btnEncrypt || !decryptContent || !encryptContent) return;

  playSynthTone(500, 'sine', 0.05, 0.1);

  if (mode === 'decrypt') {
    btnDecrypt.classList.add('active');
    btnEncrypt.classList.remove('active');
    decryptContent.style.display = 'flex';
    encryptContent.style.display = 'none';
  } else {
    btnDecrypt.classList.remove('active');
    btnEncrypt.classList.add('active');
    decryptContent.style.display = 'none';
    encryptContent.style.display = 'flex';
  }
}

function generateSecretTransmission() {
  const passInput = document.getElementById('encryptPass');
  const msgInput = document.getElementById('encryptMsg');
  const resultLine = document.getElementById('encryptResultLine');

  if (!passInput || !msgInput || !resultLine) return;

  const pass = passInput.value.trim().toLowerCase();
  const msg = msgInput.value.trim();

  if (!pass || !msg) {
    alert("Silakan tentukan kata sandi dan tulis pesan rahasia kamu!");
    return;
  }

  // Format key|msg
  const combined = pass + "|" + msg;
  const encoded = btoa(encodeURIComponent(combined));
  const link = window.location.origin + window.location.pathname + "?t=" + encoded;

  resultLine.style.display = 'block';
  resultLine.innerHTML = `
    <span style="color:#50fa7b;">SYSTEM: Pesan berhasil dienkripsi! Tautan Anda:</span><br>
    <div style="background:rgba(0,0,0,0.5); padding:8px; border-radius:8px; margin:6px 0; font-size:0.75rem; word-break:break-all; border:1px solid var(--neon-purple);">${link}</div>
    <button class="decrypt-btn" style="margin-top:5px; padding:6px 12px; font-size:0.75rem;" onclick="copyLinkToClipboard('${link}')">Salin Tautan 📋</button>
  `;
  playSynthTone(880, 'sine', 0.1, 0.3);
}

function copyLinkToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Tautan berhasil disalin ke clipboard! Kirimkan ke pacarmu. 🚀🔗");
  }).catch(() => {
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    alert("Tautan berhasil disalin! Kirimkan ke pacarmu. 🚀🔗");
  });
}

function parseSharedTransmission() {
  const urlParams = new URLSearchParams(window.location.search);
  const tParam = urlParams.get('t');
  if (!tParam) return;

  try {
    const decoded = decodeURIComponent(atob(tParam));
    const separatorIdx = decoded.indexOf('|');
    if (separatorIdx > 0) {
      customDecryptionKey = decoded.substring(0, separatorIdx).trim().toLowerCase();
      customDecryptionMessage = decoded.substring(separatorIdx + 1);

      // Update terminal cues
      const hint = document.getElementById('consoleHint');
      const sysLine = document.getElementById('consoleSystemLine');
      const notif = document.getElementById('consoleNotification');

      if (hint) hint.innerHTML = "Petunjuk: Masukkan kata sandi rahasia yang dibuat oleh pengirim pesan.";
      if (sysLine) sysLine.innerHTML = "SYSTEM: Mendeteksi transmisi rahasia kustom dari seseorang...";
      if (notif) notif.innerHTML = "SYSTEM: Diperlukan kata sandi dekripsi kustom.";

      // Smooth switch tab to secret transmission
      setTimeout(() => {
        switchTab('secret');
      }, 1000);
    }
  } catch (err) {
    console.error("Gagal mendecode pesan kustom:", err);
  }
}

// =======================================================
// MOBILE VIRTUAL GAME CONTROLS BINDING
// =======================================================
function setupMobileGameControls() {
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  
  if (!btnLeft || !btnRight) return;
  
  // Left Button
  btnLeft.addEventListener('touchstart', (e) => {
    keyLeft = true;
    e.preventDefault();
  }, { passive: false });
  btnLeft.addEventListener('touchend', (e) => {
    keyLeft = false;
    e.preventDefault();
  }, { passive: false });
  btnLeft.addEventListener('mousedown', (e) => {
    keyLeft = true;
  });
  btnLeft.addEventListener('mouseup', (e) => {
    keyLeft = false;
  });
  btnLeft.addEventListener('mouseleave', (e) => {
    keyLeft = false;
  });
  
  // Right Button
  btnRight.addEventListener('touchstart', (e) => {
    keyRight = true;
    e.preventDefault();
  }, { passive: false });
  btnRight.addEventListener('touchend', (e) => {
    keyRight = false;
    e.preventDefault();
  }, { passive: false });
  btnRight.addEventListener('mousedown', (e) => {
    keyRight = true;
  });
  btnRight.addEventListener('mouseup', (e) => {
    keyRight = false;
  });
  btnRight.addEventListener('mouseleave', (e) => {
    keyRight = false;
  });
}

