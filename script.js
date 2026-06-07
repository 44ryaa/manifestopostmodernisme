// =======================================================
// GLOBAL STATE
// =======================================================
let activeTab = 'orbit';
let audioCtx = null;
let isPlayingAudio = false;
let customDecryptionKey = null;
let customDecryptionMessage = null;
let lasersList = [];
let laserCooldown = 0;

// YouTube player
let ytPlayer = null;
const YT_VIDEO_ID = 'HxR32xRuLM0';

const astroQuotes = [
  "Kamu itu mirip lubang hitam... Seluruh atensiku ketarik ke kamu terus! 🕳️💖",
  "Hubungan kita kayak gaya gravitasi. Selalu menarik kita berdua buat deketan. 🌌🔭",
  "Aku rela jadi astronot, asal tujuan akhir pendaratannya di planet hatimu. 🚀💓",
  "Kenapa di luar angkasa gak ada udara? Karena semua oksigennya udah kesedot pesona senyummu! 💨🥰",
  "Aku gak butuh teleskop Hubble buat nyari bintang tercantik — bintangnya udah ada di depanku. ⭐👀",
  "I love you to the moon and back... plus 10x orbit Jupiter! 🌙🛸",
  "Tata surya punya 8 planet, tapi bagiku cuma ada 1 tempat bernaung: Kamu. 🌍💘",
  "Bedanya kamu sama asteroid? Asteroid merusak bumi, kamu memperindah duniaku. ☄️🌸"
];

// =======================================================
// WEB AUDIO (UI sound effects only)
// =======================================================
function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
}

function playSynthTone(freq, type = 'sine', vol = 0.07, duration = 0.25) {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

// =======================================================
// STARFIELD CANVAS
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

function drawStarfield() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > starCanvas.height) { star.y = 0; star.x = Math.random() * starCanvas.width; }
    star.twinkle += 0.01;
    const alpha = 0.3 + Math.abs(Math.sin(star.twinkle)) * 0.7;
    starCtx.fillStyle = star.color;
    starCtx.globalAlpha = alpha;
    starCtx.beginPath();
    starCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    starCtx.fill();
  });
  if (Math.random() < 0.005 && meteors.length < 2) {
    meteors.push({ x: Math.random() * starCanvas.width, y: 0, length: Math.random() * 80 + 40, speed: Math.random() * 12 + 6, angle: Math.PI / 4, opacity: 1 });
  }
  meteors.forEach((m, idx) => {
    m.x += Math.cos(m.angle) * m.speed;
    m.y += Math.sin(m.angle) * m.speed;
    m.opacity -= 0.02;
    if (m.opacity <= 0 || m.x > starCanvas.width || m.y > starCanvas.height) {
      meteors.splice(idx, 1);
    } else {
      starCtx.strokeStyle = `rgba(255,121,198,${m.opacity})`;
      starCtx.lineWidth = 2;
      starCtx.beginPath();
      starCtx.moveTo(m.x, m.y);
      starCtx.lineTo(m.x - Math.cos(m.angle) * m.length, m.y - Math.sin(m.angle) * m.length);
      starCtx.stroke();
    }
  });
  starCtx.globalAlpha = 1;
  requestAnimationFrame(drawStarfield);
}
drawStarfield();

// =======================================================
// ANNIVERSARY COUNTER
// =======================================================
let anniversaryDate = new Date("2025-06-06T00:00:00");
const storedDate = localStorage.getItem("cosmic_love_date");
if (storedDate) anniversaryDate = new Date(storedDate);
else localStorage.setItem("cosmic_love_date", anniversaryDate.toISOString().split('T')[0]);

const annivInput = document.getElementById('anniversary-date');
if (annivInput) annivInput.value = anniversaryDate.toISOString().split('T')[0];

function updateTimer() {
  const diff = Date.now() - anniversaryDate.getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins  = Math.floor((diff / 60000) % 60);
  const secs  = Math.floor((diff / 1000) % 60);
  const dDays = document.getElementById('val-days');
  const dHours = document.getElementById('val-hours');
  const dMins = document.getElementById('val-mins');
  const dSecs = document.getElementById('val-secs');
  const dSummary = document.getElementById('days-summary');
  if (dDays) dDays.innerText = days;
  if (dHours) dHours.innerText = hours;
  if (dMins) dMins.innerText = mins;
  if (dSecs) dSecs.innerText = secs;
  if (dSummary) dSummary.innerText = days;
}
setInterval(updateTimer, 1000);
updateTimer();

if (annivInput) {
  annivInput.addEventListener('change', (e) => {
    if (!e.target.value) return;
    anniversaryDate = new Date(e.target.value + "T00:00:00");
    localStorage.setItem("cosmic_love_date", e.target.value);
    playSynthTone(330, 'triangle', 0.1, 0.2);
    updateTimer();
  });
}

// =======================================================
// TAB SWITCHING
// =======================================================
function switchTab(tabId) {
  if (tabId === activeTab) return;
  playSynthTone(440, 'sine', 0.05, 0.15);
  setTimeout(() => playSynthTone(660, 'sine', 0.05, 0.15), 60);

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));

  const indexMap = { orbit: 0, radar: 1, secret: 2, arcade: 3 };
  const btns = document.querySelectorAll('.tab-btn');
  if (btns[indexMap[tabId]]) btns[indexMap[tabId]].classList.add('active');

  const panel = document.getElementById(`panel-${tabId}`);
  if (panel) panel.classList.add('active');

  activeTab = tabId;
  if (tabId === 'arcade') initGame();
  else stopGameLoop();
}

// =======================================================
// LOVE RADAR CALCULATOR
// =======================================================
let scanning = false;

function calculateAttraction() {
  if (scanning) return;
  const name1 = (document.getElementById('name1').value || '').trim();
  const name2 = (document.getElementById('name2').value || '').trim();
  if (!name1 || !name2) { alert("Silakan isi nama kamu dan nama pacar kamu dulu ya!"); return; }

  scanning = true;
  const resultDiv  = document.getElementById('radarResult');
  const radarHeart = document.getElementById('radarHeart');
  resultDiv.classList.add('show');
  if (radarHeart) { radarHeart.classList.add('active'); radarHeart.innerText = "❤️"; }

  const msgs = [
    "Menghubungkan satelit cinta kosmik...",
    "Menganalisis kecocokan orbit energi...",
    "Mengukur tarikan gravitasi batin...",
    "Menghitung densitas lubang hitam asmara..."
  ];
  let step = 0;
  playSynthTone(150, 'sawtooth', 0.2, 0.4);

  const interval = setInterval(() => {
    try {
      if (step < msgs.length) {
        resultDiv.innerHTML = `<span style="color:#8be9fd;">[SCANNING]</span> ${msgs[step]}`;
        playSynthTone(200 + step * 80, 'sine', 0.1, 0.2);
        step++;
      } else {
        clearInterval(interval);
        resultDiv.innerHTML = `
          Gaya tarik gravitasi cinta antara <span style="color:#8be9fd;">${name1}</span> & <span style="color:#ff79c6;">${name2}</span> adalah:
          <span class="radar-result-val">1000% (MUTLAK)</span>
          <span style="font-size:0.85rem;color:#a9b1d6;display:block;margin-top:8px;">
            Dua planet terikat orbit permanen. Gravitasi kalian terlalu padat, bahkan cahaya pun gak bisa lolos dari cinta kalian! 🌌💖
          </span>`;
        playSynthTone(523.25, 'sine', 0.2, 0.4);
        setTimeout(() => playSynthTone(659.25, 'sine', 0.2, 0.4), 150);
        setTimeout(() => playSynthTone(783.99, 'sine', 0.2, 0.5), 300);
        setTimeout(() => playSynthTone(1046.50, 'sine', 0.3, 0.8), 450);
        createCosmicConfetti();
        if (radarHeart) radarHeart.classList.remove('active');
        scanning = false;
      }
    } catch(err) {
      clearInterval(interval);
      scanning = false;
    }
  }, 650);
}

function createCosmicConfetti() {
  const colors = ['#ff79c6','#8be9fd','#bd93f9','#ffb8d1','#f1fa8c'];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'cosmic-confetti';
    const size  = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * 180 + 80;
    el.style.cssText = `width:${size}px;height:${size}px;background:${color};left:${cx}px;top:${cy}px;box-shadow:0 0 10px ${color};`;
    el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

// =======================================================
// DECRYPTION TERMINAL
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

Kamu itu ibarat cahaya nebula pink tercantik — selalu berhasil memukau dan menghangatkan duniaku yang sebelumnya sedingin luar angkasa. Keberadaan kamu memberi gaya gravitasi yang bikin orbit hidupku jadi stabil dan bahagia. 🚀

Terima kasih ya sudah menemani perjalanan luar angkasa ini. Aku sayang kamu sampai ke batas terjauh cakrawala peristiwa (event horizon) dan kembali lagi! 🪐🛸💖`;

function decryptMessage(e) {
  if (e) e.preventDefault();
  if (decrypting) return;

  const inputEl = document.getElementById('decryptPass');
  const form    = document.getElementById('decryptForm');
  const output  = document.getElementById('consoleOutput');
  const body    = document.getElementById('consoleBody');
  if (!inputEl) return;

  const input = inputEl.value.trim().toLowerCase();
  if (!input) { inputEl.focus(); return; }

  const validPasswords = ['sayang','nana','cinta','love','manis','ayang','pacar','cantik','chubby','gemes'];

  let isCorrect = false;
  let textToShow = letterText;

  if (customDecryptionKey) {
    if (input === customDecryptionKey) { isCorrect = true; textToShow = `TRANSMISI KHUSUS DEKRIPSI BERHASIL... 📡💚\n\n=========================================\nSENDER: PASANGAN SPESIALMU\nRECEIVER: BELAHAN JIWAKU\nSTATUS: TERKONEKSI PENUH\n=========================================\n\n${customDecryptionMessage}`; }
  } else {
    if (validPasswords.includes(input)) isCorrect = true;
  }

  if (isCorrect) {
    decrypting = true;
    if (form) form.style.display = 'none';
    if (output) { output.classList.add('show'); output.innerHTML = ''; }
    playSynthTone(100, 'sawtooth', 0.2, 0.5);
    let idx = 0;
    const scrollInterval = setInterval(() => { if (body) body.scrollTop = body.scrollHeight; }, 100);
    function type() {
      if (idx < textToShow.length) {
        if (output) output.innerHTML += textToShow.charAt(idx);
        if (idx % 3 === 0 && textToShow.charAt(idx) !== ' ' && textToShow.charAt(idx) !== '\n')
          playSynthTone(800 + Math.random() * 400, 'sine', 0.01, 0.05);
        idx++;
        setTimeout(type, 22);
      } else {
        clearInterval(scrollInterval);
        if (output) output.innerHTML += '<span class="cursor"></span>';
        decrypting = false;
        createCosmicConfetti();
      }
    }
    type();
  } else {
    // Salah sandi — tampilkan error tapi TIDAK ubah decrypting agar bisa coba lagi
    playSynthTone(120, 'sawtooth', 0.3, 0.3);
    // Hapus pesan error lama jika ada
    const oldErr = document.getElementById('decryptErrLine');
    if (oldErr) oldErr.remove();
    const fail = document.createElement('div');
    fail.id = 'decryptErrLine';
    fail.className = 'console-line';
    fail.style.color = '#ff5555';
    fail.style.marginBottom = '8px';
    fail.innerText = `DECRYPTION ERROR: Sandi "${input}" ditolak. Coba lagi!`;
    if (body && form) body.insertBefore(fail, form);
    if (body) body.scrollTop = body.scrollHeight;
    if (inputEl) { inputEl.value = ''; inputEl.focus(); }
  }
}

// =======================================================
// INTERACTIVE ASTRONAUT
// =======================================================
let isFlipping = false;
let bubbleTimeout = null;

function clickAstro() {
  if (isFlipping) return;
  isFlipping = true;
  const astro  = document.getElementById('astro');
  const bubble = document.getElementById('astroBubble');

  if (astro) {
    astro.classList.add('flip');
    setTimeout(() => { astro.classList.remove('flip'); isFlipping = false; }, 650);
  } else {
    isFlipping = false;
  }

  playSynthTone(300, 'sine', 0.2, 0.3);
  setTimeout(() => playSynthTone(600, 'sine', 0.1, 0.2), 100);
  setTimeout(() => playSynthTone(1200, 'sine', 0.05, 0.15), 200);

  if (bubble && astro) {
    const q = astroQuotes[Math.floor(Math.random() * astroQuotes.length)];
    bubble.innerHTML = '';
    // Gunakan class .talk di wrapper supaya CSS transition berjalan
    astro.classList.add('talk');
    let qi = 0;
    function typeQ() {
      if (qi < q.length) { bubble.innerHTML += q.charAt(qi); qi++; setTimeout(typeQ, 22); }
    }
    typeQ();
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => astro.classList.remove('talk'), 7000);
  }
}

// =======================================================
// ENCRYPTION TERMINAL
// =======================================================
function switchConsoleMode(mode) {
  const btnDecrypt = document.getElementById('btnConsoleDecrypt');
  const btnEncrypt = document.getElementById('btnConsoleEncrypt');
  const dec = document.getElementById('consoleDecryptContent');
  const enc = document.getElementById('consoleEncryptContent');
  if (!btnDecrypt || !btnEncrypt || !dec || !enc) return;
  playSynthTone(500, 'sine', 0.05, 0.1);
  if (mode === 'decrypt') {
    btnDecrypt.classList.add('active'); btnEncrypt.classList.remove('active');
    dec.style.display = 'flex'; enc.style.display = 'none';
  } else {
    btnEncrypt.classList.add('active'); btnDecrypt.classList.remove('active');
    enc.style.display = 'flex'; dec.style.display = 'none';
  }
}

function generateSecretTransmission() {
  const passEl   = document.getElementById('encryptPass');
  const msgEl    = document.getElementById('encryptMsg');
  const resultEl = document.getElementById('encryptResultLine');
  if (!passEl || !msgEl || !resultEl) return;
  const pass = passEl.value.trim().toLowerCase();
  const msg  = msgEl.value.trim();
  if (!pass || !msg) { alert("Silakan tentukan kata sandi dan tulis pesan rahasia kamu!"); return; }
  const encoded = btoa(encodeURIComponent(pass + '|' + msg));
  const link = window.location.origin + window.location.pathname + '?t=' + encoded;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <span style="color:#50fa7b;">SYSTEM: Pesan berhasil dienkripsi! Tautan Anda:</span><br>
    <div style="background:rgba(0,0,0,0.5);padding:8px;border-radius:8px;margin:6px 0;font-size:0.75rem;word-break:break-all;border:1px solid var(--neon-purple);">${link}</div>
    <button class="decrypt-btn" style="margin-top:5px;padding:6px 12px;font-size:0.75rem;" onclick="copyLinkToClipboard('${link}')">Salin Tautan 📋</button>`;
  playSynthTone(880, 'sine', 0.1, 0.3);
}

function copyLinkToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Tautan berhasil disalin! Kirimkan ke pacarmu. 🚀🔗");
  }).catch(() => {
    const d = document.createElement('textarea');
    document.body.appendChild(d);
    d.value = text; d.select(); document.execCommand('copy');
    document.body.removeChild(d);
    alert("Tautan berhasil disalin! Kirimkan ke pacarmu. 🚀🔗");
  });
}

function parseSharedTransmission() {
  const p = new URLSearchParams(window.location.search).get('t');
  if (!p) return;
  try {
    const decoded = decodeURIComponent(atob(p));
    const sep = decoded.indexOf('|');
    if (sep > 0) {
      customDecryptionKey     = decoded.substring(0, sep).trim().toLowerCase();
      customDecryptionMessage = decoded.substring(sep + 1);
      const hint  = document.getElementById('consoleHint');
      const sys   = document.getElementById('consoleSystemLine');
      const notif = document.getElementById('consoleNotification');
      if (hint)  hint.innerHTML  = "Petunjuk: Masukkan kata sandi rahasia yang dibuat oleh pengirim pesan.";
      if (sys)   sys.innerHTML   = "SYSTEM: Mendeteksi transmisi rahasia kustom dari seseorang...";
      if (notif) notif.innerHTML = "SYSTEM: Diperlukan kata sandi dekripsi kustom.";
      setTimeout(() => switchTab('secret'), 1000);
    }
  } catch(e) { console.error("Gagal mendecode pesan:", e); }
}

// =======================================================
// YOUTUBE MUSIC PLAYER
// =======================================================
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayer', {
    videoId: YT_VIDEO_ID,
    playerVars: { autoplay: 0, loop: 1, playlist: YT_VIDEO_ID, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0 },
    events: {
      onReady: (e) => e.target.setVolume(70),
      onStateChange: (e) => {
        const btn = document.getElementById('audioBtn');
        if (!btn) return;
        if (e.data === 1) {
          isPlayingAudio = true;
          btn.classList.add('playing');
          btn.title = 'Pause Musik';
          showMusicToast('Musik sedang diputar 🎶');
        } else if (e.data === 2 || e.data === 0) {
          isPlayingAudio = false;
          btn.classList.remove('playing');
          btn.title = 'Putar Musik Latar 🎵';
        }
      }
    }
  });
}

function toggleYTMusic() {
  if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
    showMusicToast('Player belum siap, tunggu sebentar...');
    return;
  }
  if (ytPlayer.getPlayerState() === 1) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
  playSynthTone(440, 'sine', 0.05, 0.1);
}

function showMusicToast(msg) {
  const toast = document.getElementById('musicToast');
  const sub   = document.getElementById('musicToastSub');
  if (!toast) return;
  if (sub) sub.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Event listener hanya satu kali, di sini
document.getElementById('audioBtn').addEventListener('click', toggleYTMusic);

// =======================================================
// PLANET CUSTOMIZER
// =======================================================
const colorPresets = {
  pink:   { color: '#d90368', light: '#ffb8d1', glow: 'rgba(217,3,104,0.8)' },
  blue:   { color: '#0077b6', light: '#a1fffe', glow: 'rgba(0,119,182,0.8)' },
  purple: { color: '#8a2be2', light: '#d8b4fe', glow: 'rgba(138,43,226,0.8)' },
  green:  { color: '#00f5d4', light: '#cafff0', glow: 'rgba(0,245,212,0.8)' },
  gold:   { color: '#ff9f1c', light: '#ffdfa1', glow: 'rgba(255,159,28,0.8)' }
};

function applyPlanetColor(num, key) {
  const p = colorPresets[key]; if (!p) return;
  document.documentElement.style.setProperty(`--planet-${num}-color`, p.color);
  document.documentElement.style.setProperty(`--planet-${num}-light`, p.light);
  document.documentElement.style.setProperty(`--planet-${num}-glow`,  p.glow);
}

function applyOrbitSpeed(val) {
  const speeds = { slow: ['14s','24s'], medium: ['7s','12s'], fast: ['3.5s','6s'] };
  const [s1, s2] = speeds[val] || speeds.medium;
  document.documentElement.style.setProperty('--orbit-1-speed', s1);
  document.documentElement.style.setProperty('--orbit-2-speed', s2);
}

function updateOrbitText(n1, n2) {
  const l1 = document.getElementById('planet1-label');
  const l2 = document.getElementById('planet2-label');
  if (l1) l1.innerText = n1;
  if (l2) l2.innerText = n2;
}

function setupPlanetCustomizer() {
  const toggle = document.getElementById('customizerToggle');
  const box    = document.getElementById('customizerBox');
  if (toggle && box) toggle.addEventListener('click', () => { box.classList.toggle('open'); playSynthTone(400,'sine',0.05,0.1); });

  const p1In = document.getElementById('planet1Name');
  const p2In = document.getElementById('planet2Name');
  const p1Pl = document.getElementById('orbitPlanet1');
  const p2Pl = document.getElementById('orbitPlanet2');

  const savedP1 = localStorage.getItem('planet1_name') || 'Kamu';
  const savedP2 = localStorage.getItem('planet2_name') || 'Aku';

  if (p1In) { p1In.value = savedP1; if (p1Pl) p1Pl.setAttribute('title', savedP1); }
  if (p2In) { p2In.value = savedP2; if (p2Pl) p2Pl.setAttribute('title', savedP2); }
  updateOrbitText(savedP1, savedP2);

  if (p1In) p1In.addEventListener('input', (e) => {
    const v = e.target.value.trim() || 'Kamu';
    if (p1Pl) p1Pl.setAttribute('title', v);
    localStorage.setItem('planet1_name', v);
    updateOrbitText(v, p2In ? p2In.value.trim() || 'Aku' : 'Aku');
  });
  if (p2In) p2In.addEventListener('input', (e) => {
    const v = e.target.value.trim() || 'Aku';
    if (p2Pl) p2Pl.setAttribute('title', v);
    localStorage.setItem('planet2_name', v);
    updateOrbitText(p1In ? p1In.value.trim() || 'Kamu' : 'Kamu', v);
  });

  [1, 2].forEach(num => {
    const container = document.getElementById(`planet${num}Presets`);
    if (!container) return;
    container.querySelectorAll('.color-preset-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        container.querySelectorAll('.color-preset-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        applyPlanetColor(num, dot.getAttribute('data-color'));
        localStorage.setItem(`planet${num}_color`, dot.getAttribute('data-color'));
        playSynthTone(500 + num * 100, 'sine', 0.05, 0.15);
      });
    });
  });

  const speedSel = document.getElementById('orbitSpeedSelect');
  if (speedSel) speedSel.addEventListener('change', (e) => {
    applyOrbitSpeed(e.target.value);
    localStorage.setItem('orbit_speed', e.target.value);
    playSynthTone(440, 'sine', 0.05, 0.15);
  });

  // Load saved
  const c1 = localStorage.getItem('planet1_color') || 'pink';
  const c2 = localStorage.getItem('planet2_color') || 'blue';
  applyPlanetColor(1, c1); applyPlanetColor(2, c2);
  document.querySelectorAll('#planet1Presets .color-preset-dot').forEach(d => d.classList.toggle('selected', d.getAttribute('data-color') === c1));
  document.querySelectorAll('#planet2Presets .color-preset-dot').forEach(d => d.classList.toggle('selected', d.getAttribute('data-color') === c2));

  const savedSpeed = localStorage.getItem('orbit_speed') || 'medium';
  if (speedSel) speedSel.value = savedSpeed;
  applyOrbitSpeed(savedSpeed);
}

// =======================================================
// LOVE ROCKET MINIGAME
// =======================================================
const gameCanvas  = document.getElementById('gameCanvas');
const gameCtx     = gameCanvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc  = document.getElementById('overlayDesc');

let gameRunning = false;
let gameLoopId  = null;
let gameScore   = 0;
let playerHealth = 100;
let playerX     = 240;
const playerWidth  = 36;
const playerHeight = 44;

let heartsList    = [];
let asteroidsList = [];
let particlesList = [];
let keyLeft  = false;
let keyRight = false;

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keyLeft  = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyRight = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keyLeft  = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyRight = false;
});

function handleMove(clientX) {
  const rect   = gameCanvas.getBoundingClientRect();
  const scaleX = gameCanvas.width / rect.width;
  const tx     = (clientX - rect.left) * scaleX;
  playerX = Math.max(playerWidth / 2, Math.min(gameCanvas.width - playerWidth / 2, tx));
}
gameCanvas.addEventListener('mousemove', (e) => { if (gameRunning) handleMove(e.clientX); });
gameCanvas.addEventListener('touchmove', (e) => { if (gameRunning && e.touches.length > 0) { handleMove(e.touches[0].clientX); e.preventDefault(); } }, { passive: false });

function initGame() {
  gameScore = 0; playerHealth = 100; playerX = gameCanvas.width / 2;
  heartsList = []; asteroidsList = []; particlesList = []; lasersList = []; laserCooldown = 0;
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

function startGame() {
  initGame();
  if (gameOverlay) gameOverlay.classList.add('hidden');
  gameRunning = true;
  playSynthTone(261.63, 'sine', 0.2, 0.2);
  setTimeout(() => playSynthTone(329.63, 'sine', 0.2, 0.2), 100);
  setTimeout(() => playSynthTone(392.00, 'sine', 0.2, 0.4), 200);
  gameLoop();
}

function stopGameLoop() {
  gameRunning = false;
  if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
}

function gameOver() {
  stopGameLoop();
  playSynthTone(100, 'sawtooth', 0.5, 0.8);
  if (gameOverlay) gameOverlay.classList.remove('hidden');
  if (overlayTitle) overlayTitle.innerText = "Misi Cinta Selesai! 🚀💔";
  let rank = "Bucin Pemula 🚀";
  if (gameScore >= 300) rank = "Bucin Legendaris Penguasa Alam Semesta 👑🌌";
  else if (gameScore >= 120) rank = "Kapten Cinta Galaksi 🛸";
  if (overlayDesc) overlayDesc.innerHTML = `Skor Akhir: <strong style="color:var(--neon-pink);font-size:1.3rem;">${gameScore}</strong><br>Pangkat Bucin: <strong>${rank}</strong><br><br>Tenang, cinta kita gak bakal hancur gara-gara meteor! Main lagi?`;
}

let heartSpawnTimer = 0, asteroidSpawnTimer = 0;

function gameLoop() {
  if (!gameRunning) return;
  updateGame(); drawGame();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame() {
  if (keyLeft)  playerX = Math.max(playerWidth / 2, playerX - 5);
  if (keyRight) playerX = Math.min(gameCanvas.width - playerWidth / 2, playerX + 5);

  heartSpawnTimer++;
  if (heartSpawnTimer > 35) {
    heartSpawnTimer = 0;
    heartsList.push({ x: Math.random() * (gameCanvas.width - 20) + 10, y: -20, speed: Math.random() * 2 + 1.5, size: Math.random() * 10 + 10 });
  }
  asteroidSpawnTimer++;
  if (asteroidSpawnTimer > 55) {
    asteroidSpawnTimer = 0;
    asteroidsList.push({ x: Math.random() * (gameCanvas.width - 20) + 10, y: -20, speed: Math.random() * 2.5 + 2, size: Math.random() * 12 + 10, rotation: 0, rotSpeed: Math.random() * 0.05 - 0.025 });
  }

  laserCooldown++;
  if (laserCooldown >= 22) {
    laserCooldown = 0;
    lasersList.push({ x: playerX, y: gameCanvas.height - 35 - 12, speed: 6, size: 5 });
    playSynthTone(550 + Math.random() * 150, 'sine', 0.03, 0.08);
  }

  for (let li = lasersList.length - 1; li >= 0; li--) {
    const l = lasersList[li];
    l.y -= l.speed;
    let hit = false;
    for (let ai = asteroidsList.length - 1; ai >= 0; ai--) {
      const a = asteroidsList[ai];
      if (Math.abs(l.x - a.x) < (a.size / 2 + l.size) && Math.abs(l.y - a.y) < (a.size / 2 + l.size)) {
        lasersList.splice(li, 1); asteroidsList.splice(ai, 1); gameScore += 5;
        playSynthTone(220 + Math.random() * 110, 'triangle', 0.12, 0.15);
        spawnParticles(a.x, a.y, '#bd93f9'); hit = true; break;
      }
    }
    if (!hit && l.y < -10) lasersList.splice(li, 1);
  }

  for (let hi = heartsList.length - 1; hi >= 0; hi--) {
    const h = heartsList[hi];
    h.y += h.speed;
    if (Math.abs(h.x - playerX) < (playerWidth / 2 + h.size / 2) && Math.abs(h.y - (gameCanvas.height - 35)) < (playerHeight / 2 + h.size / 2)) {
      heartsList.splice(hi, 1); gameScore += 10;
      playSynthTone(700 + Math.random() * 300, 'sine', 0.1, 0.15);
      spawnParticles(h.x, h.y, '#ff79c6');
    } else if (h.y > gameCanvas.height + 20) {
      heartsList.splice(hi, 1);
    }
  }

  for (let ai = asteroidsList.length - 1; ai >= 0; ai--) {
    const a = asteroidsList[ai];
    a.y += a.speed; a.rotation += a.rotSpeed;
    if (Math.abs(a.x - playerX) < (playerWidth / 2 + a.size / 2) && Math.abs(a.y - (gameCanvas.height - 35)) < (playerHeight / 2 + a.size / 2)) {
      asteroidsList.splice(ai, 1);
      playerHealth = Math.max(0, playerHealth - 20);
      playSynthTone(90, 'triangle', 0.35, 0.4);
      spawnParticles(a.x, a.y, '#8be9fd');
      if (playerHealth <= 0) gameOver();
    } else if (a.y > gameCanvas.height + 20) {
      asteroidsList.splice(ai, 1);
    }
  }

  for (let pi = particlesList.length - 1; pi >= 0; pi--) {
    const p = particlesList[pi];
    p.x += p.vx; p.y += p.vy; p.alpha -= 0.03;
    if (p.alpha <= 0) particlesList.splice(pi, 1);
  }
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 2 + 1;
    particlesList.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, color, alpha: 1, size: Math.random()*3+2 });
  }
}

function drawGame() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameCtx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < gameCanvas.width; i += 40) gameCtx.fillRect(i, 0, 1, gameCanvas.height);
  drawRocket(playerX, gameCanvas.height - 35);
  lasersList.forEach(l => drawLaser(l.x, l.y, l.size));
  heartsList.forEach(h => drawHeart(h.x, h.y, h.size));
  asteroidsList.forEach(a => drawAsteroid(a.x, a.y, a.size, a.rotation));
  particlesList.forEach(p => {
    gameCtx.save(); gameCtx.globalAlpha = p.alpha; gameCtx.fillStyle = p.color;
    gameCtx.beginPath(); gameCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); gameCtx.fill(); gameCtx.restore();
  });
  gameCtx.fillStyle = '#fff';
  gameCtx.font = 'bold 12px "Space Grotesk",sans-serif';
  gameCtx.fillText(`SKOR: ${gameScore}`, 15, 25);
  gameCtx.fillText('BAHAN BAKAR CINTA:', 230, 25);
  gameCtx.fillStyle = 'rgba(255,255,255,0.15)';
  gameCtx.fillRect(370, 14, 100, 12);
  gameCtx.fillStyle = playerHealth > 40 ? '#ff79c6' : '#ff5555';
  gameCtx.fillRect(370, 14, playerHealth, 12);
}

function drawRocket(x, y) {
  gameCtx.save(); gameCtx.translate(x, y);
  if (Math.random() > 0.3) {
    gameCtx.fillStyle = Math.random() > 0.5 ? '#ff5555' : '#ffb8d1';
    gameCtx.beginPath();
    gameCtx.moveTo(-6, playerHeight/2-4); gameCtx.lineTo(0, playerHeight/2+10); gameCtx.lineTo(6, playerHeight/2-4);
    gameCtx.closePath(); gameCtx.fill();
  }
  gameCtx.fillStyle = '#ff79c6';
  gameCtx.beginPath();
  gameCtx.moveTo(0, -playerHeight/2); gameCtx.lineTo(playerWidth/2-4, -5);
  gameCtx.lineTo(playerWidth/2-4, playerHeight/2-4); gameCtx.lineTo(-playerWidth/2+4, playerHeight/2-4);
  gameCtx.lineTo(-playerWidth/2+4, -5); gameCtx.closePath(); gameCtx.fill();
  gameCtx.fillStyle = '#8be9fd';
  gameCtx.beginPath(); gameCtx.moveTo(-playerWidth/2+4,0); gameCtx.lineTo(-playerWidth/2, playerHeight/2); gameCtx.lineTo(-playerWidth/2+4, playerHeight/2-4); gameCtx.closePath(); gameCtx.fill();
  gameCtx.beginPath(); gameCtx.moveTo(playerWidth/2-4,0); gameCtx.lineTo(playerWidth/2, playerHeight/2); gameCtx.lineTo(playerWidth/2-4, playerHeight/2-4); gameCtx.closePath(); gameCtx.fill();
  gameCtx.fillStyle = '#06020f'; gameCtx.strokeStyle = '#8be9fd'; gameCtx.lineWidth = 1.5;
  gameCtx.beginPath(); gameCtx.arc(0, -6, 6, 0, Math.PI*2); gameCtx.fill(); gameCtx.stroke();
  gameCtx.fillStyle = '#fff'; gameCtx.font = '8px Arial'; gameCtx.fillText('♥', -3.5, 6);
  gameCtx.restore();
}

function drawHeart(x, y, size) {
  gameCtx.save(); gameCtx.translate(x, y);
  gameCtx.fillStyle = '#ff5555';
  gameCtx.beginPath();
  gameCtx.arc(-size/4, 0, size/4, Math.PI, 0, false);
  gameCtx.arc(size/4, 0, size/4, Math.PI, 0, false);
  gameCtx.lineTo(0, size/2); gameCtx.closePath(); gameCtx.fill();
  gameCtx.fillStyle = 'rgba(255,255,255,0.4)';
  gameCtx.beginPath(); gameCtx.arc(-size/4, -size/12, size/12, 0, Math.PI*2); gameCtx.fill();
  gameCtx.restore();
}

function drawAsteroid(x, y, size, rotation) {
  gameCtx.save(); gameCtx.translate(x, y); gameCtx.rotate(rotation);
  gameCtx.fillStyle = '#718096'; gameCtx.strokeStyle = '#2d3748'; gameCtx.lineWidth = 2;
  gameCtx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = size/2 + (Math.sin(a*3)+Math.cos(a*2))*2;
    i === 0 ? gameCtx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : gameCtx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  gameCtx.closePath(); gameCtx.fill(); gameCtx.stroke();
  gameCtx.fillStyle = '#4a5568';
  gameCtx.beginPath(); gameCtx.arc(-size/6,-size/6,size/8,0,Math.PI*2); gameCtx.fill();
  gameCtx.beginPath(); gameCtx.arc(size/5,size/7,size/10,0,Math.PI*2); gameCtx.fill();
  gameCtx.restore();
}

function drawLaser(x, y, size) {
  gameCtx.save(); gameCtx.translate(x, y);
  gameCtx.fillStyle = '#8be9fd'; gameCtx.shadowColor = '#8be9fd'; gameCtx.shadowBlur = 8;
  gameCtx.beginPath(); gameCtx.arc(0, 0, size, 0, Math.PI*2); gameCtx.fill();
  gameCtx.restore();
}

// =======================================================
// MOBILE GAME CONTROLS
// =======================================================
function setupMobileGameControls() {
  const btnL = document.getElementById('btnLeft');
  const btnR = document.getElementById('btnRight');
  if (!btnL || !btnR) return;
  const bind = (el, onStart, onEnd) => {
    el.addEventListener('touchstart', (e) => { onStart(); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend',   (e) => { onEnd();   e.preventDefault(); }, { passive: false });
    el.addEventListener('mousedown',  () => onStart());
    el.addEventListener('mouseup',    () => onEnd());
    el.addEventListener('mouseleave', () => onEnd());
  };
  bind(btnL, () => keyLeft = true,  () => keyLeft = false);
  bind(btnR, () => keyRight = true, () => keyRight = false);
}

// =======================================================
// INIT — all setup calls go here, AFTER all functions defined
// =======================================================
setupPlanetCustomizer();
setupMobileGameControls();
parseSharedTransmission();

// Unlock AudioContext on first user interaction
['click','touchstart'].forEach(t => window.addEventListener(t, () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true }));
