/**
 * LUXE PANDA - 5-DAY TIME-LOCK ENGINE & NAVIGATION GUARD
 * 
 * Midnight Time-Lock (IST / +05:30):
 * - Level 1: 2026-12-01T00:00:00+05:30 (Dec 1)
 * - Level 2: 2026-12-02T00:00:00+05:30 (Dec 2)
 * - Level 3: 2026-12-03T00:00:00+05:30 (Dec 3)
 * - Level 4: 2026-12-04T00:00:00+05:30 (Dec 4)
 * - Level 5: 2026-12-05T00:00:00+05:30 (Dec 5 - Grand Finale)
 */

const PandaLock = (function () {
  // Exact 5-Day IST Midnight Unlock Schedule
  const LEVELS_CONFIG = [
    {
      id: 1,
      dayNumber: 1,
      dayLabel: 'Day 1 — Dec 1',
      dateShort: 'Dec 01, 2026',
      title: 'The Journey Begins',
      subtitle: 'Where our sweetest story starts',
      unlockISO: '2026-12-01T00:00:00+05:30',
      unlockDisplay: '12:00 AM on Dec 1',
      url: 'levels/level1.html',
      isFinale: false
    },
    {
      id: 2,
      dayNumber: 2,
      dayLabel: 'Day 2 — Dec 2',
      dateShort: 'Dec 02, 2026',
      title: 'Inside Jokes & Secret Smiles',
      subtitle: 'The silly moments only we understand',
      unlockISO: '2026-12-02T00:00:00+05:30',
      unlockDisplay: '12:00 AM on Dec 2',
      url: 'levels/level2.html',
      isFinale: false
    },
    {
      id: 3,
      dayNumber: 3,
      dayLabel: 'Day 3 — Dec 3',
      dateShort: 'Dec 03, 2026',
      title: 'Favorite Melodies & Warm Hugs',
      subtitle: 'A mixtape of heartbeats & dreams',
      unlockISO: '2026-12-03T00:00:00+05:30',
      unlockDisplay: '12:00 AM on Dec 3',
      url: 'levels/level3.html',
      isFinale: false
    },
    {
      id: 4,
      dayNumber: 4,
      dayLabel: 'Day 4 — Dec 4',
      dateShort: 'Dec 04, 2026',
      title: 'The Eve of Wonders',
      subtitle: 'One last sleep before your special day',
      unlockISO: '2026-12-04T00:00:00+05:30',
      unlockDisplay: '12:00 AM on Dec 4',
      url: 'levels/level4.html',
      isFinale: false
    },
    {
      id: 5,
      dayNumber: 5,
      dayLabel: 'Day 5 — Dec 5 (Grand Finale)',
      dateShort: 'Dec 05, 2026',
      title: 'Happy Birthday Panda! 🎂',
      subtitle: 'The grand birthday celebration & letter',
      unlockISO: '2026-12-05T00:00:00+05:30',
      unlockDisplay: '12:00 AM on Dec 5',
      url: 'levels/level5.html',
      isFinale: true
    }
  ];

  const PREVIEW_PASSWORD = "aadit";
  const PREVIEW_STORAGE_KEY = 'panda_creator_preview_mode';
  const PREVIEW_AUTH_KEY = 'panda_creator_authorized';
  const VAULT_STORAGE_KEY = 'panda_vault_unlocked';
  const APPLICATION_STORAGE_KEY = 'panda_application_accepted';
  
  // Master Password Gate (Case-insensitive: accepts 'panda', 'PANDA', 'Panda', etc.)
  // Edit this secret code anytime!
  const SITE_PASSWORD = 'panda';

  // In-memory vault state: resets to locked on every page refresh/reload
  let isVaultSessionUnlocked = false;

  // In-memory application state: resets to showing application on every page refresh/reload
  let isApplicationSessionAccepted = false;

  // "Birthday Ki Application" state
  let noClickCount = 0;
  const NO_PLEAS = [
    "No 🙈",
    "Are you sure? 🥺",
    "Soch lo Panda! 🐼",
    "Aise mat karo 😭",
    "Click Yes na! ✨",
    "Error 404: No not allowed 🙈",
    "Pakka no? 🥺👉👈",
    "Dil tod doge kya? 💔",
    "Ab toh Yes dabana padega! 💖"
  ];

  let levelStateCache = {};
  let intervalTimer = null;
  let mascotTapCount = 0;
  let mascotTapTimer = null;

  /**
   * Helper: Check if Birthday Ki Application has been accepted
   * Resets every time the page is refreshed/reloaded.
   * Bypassed automatically in Creator Preview Mode.
   */
  function isApplicationAccepted() {
    if (isPreviewMode()) return true;
    return isApplicationSessionAccepted;
  }

  /**
   * Play playful low "boop" sound when clicking "No"
   */
  function playCuteBoopSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Descending boop 270Hz -> 160Hz
      osc.frequency.setValueAtTime(270, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.17);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('AudioContext error', e);
    }
  }

  /**
   * Play celebratory sparkling chime on "Yes"
   */
  function playApplicationCelebrateSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.58);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.65);
      });
    } catch (e) {
      console.warn('AudioContext error', e);
    }
  }

  /**
   * Confetti shower on application canvas
   */
  function fireApplicationConfetti() {
    const canvas = document.getElementById('appConfettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles = [];
    const colors = ['#EC407A', '#F48FB1', '#D4AF37', '#F3E5AB', '#FFFFFF', '#B3E5FC'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 - 50 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 9 - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.32,
        alpha: 1
      });
    }

    let frame = 0;
    function anim() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      frame++;
      if (frame < 90) {
        requestAnimationFrame(anim);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }
    anim();
  }

  /**
   * Handle Clicking "No" Button
   * Shrinks "No" step-by-step, grows "Yes", cycles funny pleas
   */
  function handleApplicationNo() {
    noClickCount++;
    playCuteBoopSound();

    const noBtn = document.getElementById('appNoBtn');
    const noBtnText = document.getElementById('appNoBtnText');
    const yesBtn = document.getElementById('appYesBtn');

    if (noBtnText) {
      const pleaIdx = Math.min(noClickCount, NO_PLEAS.length - 1);
      noBtnText.textContent = NO_PLEAS[pleaIdx];
    }

    // Shrink "No" button step-by-step
    if (noBtn) {
      // Step scaling: 0.82 -> 0.65 -> 0.48 -> 0.32 -> tiny
      const noScale = Math.max(0.18, 1 - noClickCount * 0.17);
      noBtn.style.transform = `scale(${noScale})`;
      if (noClickCount >= 5) {
        noBtn.style.opacity = '0.35';
        noBtn.style.pointerEvents = 'none';
      }
    }

    // Grow "Yes" button larger and bolder with gold pulse
    if (yesBtn) {
      const yesScale = 1 + noClickCount * 0.22;
      yesBtn.style.transform = `scale(${yesScale})`;
      yesBtn.classList.add('yes-mega-pulse');
    }

    // Bestie playful toast
    const playfulNotes = [
      "Wait... Did you misclick? 🥺",
      "Soch lo Panda, bohot pyaar se banaya hai! 🐼",
      "No option is experiencing technical difficulties! 🙈",
      "Aise mat karo yaarrr 😭",
      "Only 'YES' is accepted by the Bestie Council! 📜✨"
    ];
    showToast(playfulNotes[Math.min(noClickCount - 1, playfulNotes.length - 1)], '🐾');
  }

  /**
   * Handle Clicking "Yes" Button
   * Celebratory chime, confetti, saves acceptance, fades out gate
   */
  function handleApplicationYes() {
    isApplicationSessionAccepted = true;
    try {
      localStorage.removeItem(APPLICATION_STORAGE_KEY);
      sessionStorage.removeItem(APPLICATION_STORAGE_KEY);
    } catch (e) {}

    playApplicationCelebrateSound();
    fireApplicationConfetti();

    showToast('Application Accepted! 🎉 Welcome to your Birthday Odyssey, Panda 🐼✨', '💖');

    const gate = document.getElementById('applicationGate');
    const card = document.getElementById('applicationCard');

    if (card) {
      card.classList.add('app-card-accepted');
    }

    setTimeout(() => {
      if (gate) {
        gate.classList.add('gate-fade-out');
        document.body.classList.remove('application-gate-active');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        setTimeout(() => {
          gate.style.display = 'none';
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 650);
      }
    }, 900);
  }

  /**
   * Initialize Application Gate on Hub Load
   * Every page refresh resets to showing the application gate
   */
  function initApplicationGate() {
    try {
      localStorage.removeItem(APPLICATION_STORAGE_KEY);
      sessionStorage.removeItem(APPLICATION_STORAGE_KEY);
    } catch (e) {}

    const gate = document.getElementById('applicationGate');
    const card = document.getElementById('applicationCard');
    if (!gate) return;

    if (isApplicationAccepted()) {
      gate.style.display = 'none';
      document.body.classList.remove('application-gate-active');
    } else {
      gate.style.display = 'flex';
      gate.classList.remove('gate-fade-out');
      document.body.classList.add('application-gate-active');
      window.scrollTo(0, 0);
      if (card) {
        card.classList.remove('app-card-accepted');
      }
      noClickCount = 0;
      const noBtn = document.getElementById('appNoBtn');
      const yesBtn = document.getElementById('appYesBtn');
      const noBtnText = document.getElementById('appNoBtnText');
      if (noBtn) {
        noBtn.style.transform = 'scale(1)';
        noBtn.style.opacity = '1';
        noBtn.style.pointerEvents = 'auto';
      }
      if (yesBtn) {
        yesBtn.style.transform = 'scale(1)';
        yesBtn.classList.remove('yes-mega-pulse');
      }
      if (noBtnText) {
        noBtnText.textContent = NO_PLEAS[0];
      }
    }
  }

  /**
   * Reset application gate (helper)
   */
  function resetApplication() {
    try {
      localStorage.removeItem(APPLICATION_STORAGE_KEY);
    } catch (e) {}
    initApplicationGate();
  }

  /**
   * Helper: Check if Password Vault is unlocked
   * Resets every time the page is refreshed.
   * Bypassed automatically in Creator Preview Mode.
   */
  function isVaultUnlocked() {
    if (isPreviewMode()) return true;
    return isVaultSessionUnlocked;
  }

  /**
   * Play celebratory Web Audio unlock chime when password is correct
   */
  function playVaultUnlockSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Bright sparkling 4-note chime (C5, E5, G5, C6) with warm sustain
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);

        gain.gain.setValueAtTime(0.001, now + idx * 0.11);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.6);
      });
    } catch (err) {
      console.warn('AudioContext not available for vault chime', err);
    }
  }

  /**
   * Toggle Password Input Masking (Password vs Text)
   */
  function togglePasswordVisibility() {
    const input = document.getElementById('vaultPasswordInput');
    const btn = document.getElementById('vaultEyeBtn');
    if (!input || !btn) return;

    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '🙈';
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      btn.innerHTML = '👁️';
      btn.setAttribute('aria-label', 'Show password');
    }
  }

  /**
   * Process Vault Unlock Submission
   */
  function unlockVault(inputVal) {
    const input = document.getElementById('vaultPasswordInput');
    const entered = (typeof inputVal === 'string' ? inputVal : (input ? input.value : '')).trim();
    const vaultCard = document.getElementById('vaultGateCard');
    const countdownMap = document.getElementById('countdownMap');

    if (entered.toLowerCase() === SITE_PASSWORD.toLowerCase()) {
      isVaultSessionUnlocked = true;
      try {
        localStorage.removeItem(VAULT_STORAGE_KEY);
        sessionStorage.removeItem(VAULT_STORAGE_KEY);
      } catch (e) {}

      playVaultUnlockSound();
      showToast('✨ Secret code accepted! Welcome to your Birthday Odyssey, Panda 🐼💖', '✨');

      if (vaultCard) {
        vaultCard.classList.add('is-unlocked-vault');
        setTimeout(() => {
          vaultCard.style.display = 'none';
          if (countdownMap) {
            countdownMap.classList.remove('vault-hidden');
            countdownMap.classList.add('vault-revealed');
          }
        }, 400);
      } else if (countdownMap) {
        countdownMap.classList.remove('vault-hidden');
        countdownMap.classList.add('vault-revealed');
      }
      return true;
    } else {
      // Wrong passcode: shake animation & toast
      if (vaultCard) {
        vaultCard.classList.remove('shake-animation');
        void vaultCard.offsetWidth; // Force CSS reflow
        vaultCard.classList.add('shake-animation');
      }
      showToast('Oops! Wrong secret code, Panda 🙈', '🐾');
      if (input) {
        input.select();
        input.focus();
      }
      return false;
    }
  }

  /**
   * Initialize Vault UI State on Hub Load
   * Every page refresh resets the vault to locked state
   */
  function initVaultUI() {
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
      sessionStorage.removeItem(VAULT_STORAGE_KEY);
    } catch (e) {}

    const vaultCard = document.getElementById('vaultGateCard');
    const countdownMap = document.getElementById('countdownMap');
    if (!vaultCard || !countdownMap) return;

    if (isVaultUnlocked()) {
      vaultCard.style.display = 'none';
      countdownMap.classList.remove('vault-hidden');
      countdownMap.classList.add('vault-revealed');
    } else {
      vaultCard.style.display = 'block';
      vaultCard.classList.remove('is-unlocked-vault');
      countdownMap.classList.add('vault-hidden');
      countdownMap.classList.remove('vault-revealed');
      
      const input = document.getElementById('vaultPasswordInput');
      if (input) {
        input.value = '';
      }
    }
  }

  /**
   * Helper: Check if Creator Preview Mode is active
   * Strictly requires verified password in sessionStorage ('panda_creator_authorized' === 'true')
   */
  function isPreviewMode() {
    try {
      return sessionStorage.getItem(PREVIEW_AUTH_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Enable/Disable Creator Preview Mode
   */
  function setPreviewMode(enable) {
    if (enable) {
      sessionStorage.setItem(PREVIEW_AUTH_KEY, 'true');
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(PREVIEW_AUTH_KEY);
      sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview')) {
        url.searchParams.delete('preview');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
    }
  }

  /**
   * Complete exit from preview mode and reload
   */
  function exitPreviewMode() {
    sessionStorage.removeItem(PREVIEW_AUTH_KEY);
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    for (let i = 1; i <= 5; i++) {
      sessionStorage.removeItem(`panda_preview_level_${i}_completed`);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('preview');
    window.location.href = url.pathname + (url.search ? url.search : '');
  }

  /**
   * Celebratory ascending fanfare chime when Creator Preview unlocks
   */
  function playPreviewUnlockChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const fanfare = [
        { f: 523.25, t: 0.0, d: 0.18 },  // C5
        { f: 659.25, t: 0.1, d: 0.18 },  // E5
        { f: 783.99, t: 0.2, d: 0.22 },  // G5
        { f: 1046.50, t: 0.32, d: 0.7 }  // C6
      ];

      fanfare.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);

        gain.gain.setValueAtTime(0.001, now + n.t);
        gain.gain.linearRampToValueAtTime(0.28, now + n.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.05);
      });
    } catch (e) {
      console.warn('AudioContext error', e);
    }
  }

  /**
   * Open sleek Luxe Panda modal dialog (#previewAuthModal)
   * Strictly protected by password PREVIEW_PASSWORD ("aadit")
   */
  function openPreviewAuthModal(options = {}) {
    let modal = document.getElementById('previewAuthModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'preview-auth-modal-overlay';
      modal.id = 'previewAuthModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'previewAuthTitle');
      modal.innerHTML = `
        <div class="preview-auth-card">
          <div class="preview-auth-badge">👑 CREATOR ACCESS</div>
          <h3 class="preview-auth-title" id="previewAuthTitle">👑 Creator Mode Verification — Enter Admin Password:</h3>
          <p class="preview-auth-sub">Enter the master secret code to unlock all 5 levels for testing & preview.</p>
          
          <div class="preview-auth-input-wrap">
            <input type="password" id="previewPasswordInput" class="preview-auth-input" placeholder="Admin password..." autocomplete="off" />
            <button type="button" id="previewToggleEye" class="preview-eye-btn" title="Toggle visibility">👁️</button>
          </div>
          
          <div class="preview-auth-error" id="previewAuthError"></div>

          <div class="preview-auth-btn-row">
            <button type="button" id="btnCancelPreview" class="btn-preview-cancel">Cancel</button>
            <button type="button" id="btnUnlockPreview" class="btn-preview-unlock">Unlock Preview ✨</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const eyeBtn = modal.querySelector('#previewToggleEye');
      const passInput = modal.querySelector('#previewPasswordInput');
      if (eyeBtn && passInput) {
        eyeBtn.addEventListener('click', () => {
          if (passInput.type === 'password') {
            passInput.type = 'text';
            eyeBtn.textContent = '🙈';
          } else {
            passInput.type = 'password';
            eyeBtn.textContent = '👁️';
          }
        });
      }
    }

    const input = modal.querySelector('#previewPasswordInput');
    const errEl = modal.querySelector('#previewAuthError');
    const unlockBtn = modal.querySelector('#btnUnlockPreview');
    const cancelBtn = modal.querySelector('#btnCancelPreview');

    if (input) {
      input.value = '';
      input.classList.remove('shake-animation');
    }
    if (errEl) {
      errEl.textContent = '';
    }

    modal.classList.add('is-active');
    setTimeout(() => {
      if (input) {
        input.focus();
      }
    }, 120);

    const closeModal = () => {
      modal.classList.remove('is-active');
    };

    const handleSuccess = () => {
      sessionStorage.setItem(PREVIEW_AUTH_KEY, 'true');
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, 'true');
      playPreviewUnlockChime();
      showToast('👑 Creator Preview Mode Activated! All 5 levels unlocked.', '🎉');
      closeModal();
      initPreviewBanner();

      // Automatically unhide gates if present
      const appGate = document.getElementById('applicationGate');
      if (appGate) appGate.style.display = 'none';
      document.body.classList.remove('application-gate-active');

      const vaultCard = document.getElementById('vaultGateCard');
      const countdownMap = document.getElementById('countdownMap');
      if (vaultCard) vaultCard.style.display = 'none';
      if (countdownMap) {
        countdownMap.classList.remove('vault-hidden');
        countdownMap.classList.add('vault-revealed');
      }

      if (options.onSuccess) {
        options.onSuccess();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 750);
      }
    };

    const handleFailure = () => {
      playCuteBoopSound();
      if (input) {
        input.classList.remove('shake-animation');
        void input.offsetWidth;
        input.classList.add('shake-animation');
        input.select();
        input.focus();
      }
      if (errEl) {
        errEl.textContent = 'Access denied — Panda eyes only! 🐼';
      }
      showToast('Access denied — Panda eyes only! 🐼', '⛔');

      // If ?preview=true was in the URL and entered wrong password, strip it so locked levels stay locked
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview')) {
        url.searchParams.delete('preview');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
    };

    const handleCancel = () => {
      closeModal();
      // If ?preview=true was in the URL and she cancels, strip ?preview=true from the URL so locked levels stay locked
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview')) {
        url.searchParams.delete('preview');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
      if (options.onCancel) {
        options.onCancel();
      }
    };

    const submitAuth = () => {
      const entered = (input ? input.value : '').trim();
      if (entered.toLowerCase() === PREVIEW_PASSWORD.toLowerCase()) {
        handleSuccess();
      } else {
        handleFailure();
      }
    };

    unlockBtn.onclick = (e) => {
      e.preventDefault();
      submitAuth();
    };

    cancelBtn.onclick = (e) => {
      e.preventDefault();
      handleCancel();
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitAuth();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
  }

  /**
   * Level Completion Tracking:
   * - In Preview Mode: completions are ONLY saved in sessionStorage for the preview session,
   *   never polluting the real countdown for Panda.
   * - In Live Mode: a level can only be completed if it has legitimately unlocked in real time!
   */
  function isLevelCompleted(levelId) {
    if (isPreviewMode()) {
      try {
        return sessionStorage.getItem(`panda_preview_level_${levelId}_completed`) === 'true';
      } catch (e) {
        return false;
      }
    }

    // In live mode: A level can ONLY be completed if it is unlocked in real time!
    const level = LEVELS_CONFIG.find(l => l.id === levelId);
    if (!level) return false;
    const unlockTime = new Date(level.unlockISO).getTime();
    if (Date.now() < unlockTime) {
      // Future date - purge any test/preview artifacts from localStorage
      try {
        localStorage.removeItem(`panda_level_${levelId}_completed`);
      } catch (e) {}
      return false;
    }

    try {
      return localStorage.getItem(`panda_level_${levelId}_completed`) === 'true';
    } catch (e) {
      return false;
    }
  }

  function completeLevel(levelId) {
    try {
      if (isPreviewMode()) {
        // Preview mode testing ONLY records completion for the preview session!
        sessionStorage.setItem(`panda_preview_level_${levelId}_completed`, 'true');
      } else {
        localStorage.setItem(`panda_level_${levelId}_completed`, 'true');
      }
    } catch (e) {
      console.warn('Could not save completion to storage', e);
    }
  }

  /**
   * Reset all level completions (Helper)
   */
  function resetAllCompletions() {
    try {
      for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`panda_level_${i}_completed`);
        sessionStorage.removeItem(`panda_preview_level_${i}_completed`);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if a specific level is currently unlocked
   */
  function isLevelUnlocked(levelId) {
    if (isPreviewMode()) {
      return true;
    }
    const level = LEVELS_CONFIG.find(l => l.id === levelId);
    if (!level) return false;

    const unlockTime = new Date(level.unlockISO).getTime();
    return Date.now() >= unlockTime;
  }

  /**
   * Get formatted countdown remaining until unlock
   */
  function getRemainingTime(levelId) {
    const level = LEVELS_CONFIG.find(l => l.id === levelId);
    if (!level) return null;

    if (isPreviewMode()) {
      return { isUnlocked: true, text: 'Unlocked (Preview)' };
    }

    const unlockTime = new Date(level.unlockISO).getTime();
    const now = Date.now();
    const diff = unlockTime - now;

    if (diff <= 0) {
      return { isUnlocked: true, text: 'Unlocked ✨' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const pad = n => String(n).padStart(2, '0');

    let text = '';
    if (days > 0) {
      text = `Opens in ${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    } else {
      text = `Opens in ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }

    return {
      isUnlocked: false,
      diff,
      days,
      hours,
      minutes,
      seconds,
      text
    };
  }

  /**
   * Toast notification system
   */
  function showToast(message, icon = '✨') {
    let container = document.querySelector('.panda-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'panda-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'panda-toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3200);
  }

  /**
   * Secret 5-tap on Panda mascot trigger
   */
  function handleMascotTap(event) {
    mascotTapCount++;

    // Spawn floating cute heart / sparkle from click coordinate
    createTapHeart(event);

    clearTimeout(mascotTapTimer);
    mascotTapTimer = setTimeout(() => {
      mascotTapCount = 0;
    }, 2500);

    if (mascotTapCount >= 5) {
      mascotTapCount = 0;
      const current = isPreviewMode();
      if (!current) {
        openPreviewAuthModal({
          onSuccess: () => {
            window.location.reload();
          }
        });
      } else {
        exitPreviewMode();
        showToast('Creator Preview Mode Deactivated.', '🔒');
      }
    }
  }

  function createTapHeart(e) {
    const heart = document.createElement('span');
    heart.className = 'mascot-floating-heart';
    const emojis = ['💖', '✨', '🐾', '🎀', '⭐'];
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    e.currentTarget.appendChild(heart);
    setTimeout(() => heart.remove(), 1200);
  }

  /**
   * Trigger locked card shake & friendly toast
   */
  function handleLockedCardClick(levelId) {
    const cardEl = document.getElementById(`level-card-${levelId}`);
    if (cardEl) {
      cardEl.classList.remove('is-shaking');
      // Trigger reflow to restart animation
      void cardEl.offsetWidth;
      cardEl.classList.add('is-shaking');
      setTimeout(() => {
        cardEl.classList.remove('is-shaking');
      }, 500);
    }

    const level = LEVELS_CONFIG.find(l => l.id === levelId);
    const dateText = level ? level.unlockDisplay : `12:00 AM on Dec ${levelId}`;
    showToast(`Patience, Panda! Unlocks at ${dateText} ✨`, '🐾');
  }

  /**
   * Direct URL Guard for individual level pages:
   * (e.g. levels/level1.html ... levels/level5.html)
   */
  function guardLevel(levelId) {
    const level = LEVELS_CONFIG.find(l => l.id === levelId);
    if (!level) return;

    if (!isLevelUnlocked(levelId)) {
      const urlParams = new URLSearchParams(window.location.search);
      const hasPreview = urlParams.get('preview') === 'true' || urlParams.get('preview') === '1';

      if (hasPreview && !isPreviewMode()) {
        const handleAuthOnLevel = () => {
          openPreviewAuthModal({
            onSuccess: () => {
              window.location.reload();
            },
            onCancel: () => {
              window.location.replace(`../index.html?locked=${levelId}`);
            }
          });
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', handleAuthOnLevel);
        } else {
          handleAuthOnLevel();
        }
        return false;
      }

      // Redirect immediately to map hub
      window.location.replace(`../index.html?locked=${levelId}`);
      return false;
    }

    // Set up preview banner if active
    const setupUI = () => {
      initPreviewBanner();
      initBackgroundParticles();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupUI);
    } else {
      setupUI();
    }

    return true;
  }

  /**
   * Preview mode banner UI
   */
  function initPreviewBanner() {
    let banner = document.querySelector('.preview-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'preview-banner';
      banner.innerHTML = `
        <span class="preview-badge">Creator Mode</span>
        <span class="preview-text">👑 Preview Active — All 5 Levels Unlocked for Testing</span>
        <button class="preview-exit-btn" id="exitPreviewBtn">Exit Preview</button>
      `;
      document.body.prepend(banner);
    }

    if (isPreviewMode()) {
      banner.classList.add('active');
      const exitBtn = banner.querySelector('#exitPreviewBtn');
      if (exitBtn) {
        exitBtn.onclick = function () {
          exitPreviewMode();
        };
      }
    } else {
      banner.classList.remove('active');
    }
  }

  /**
   * Main Hub: Render and update the 5-day level cards
   */
  function initHub() {
    initPreviewBanner();
    initBackgroundParticles();

    // Check if ?preview=true was in the URL and user is not yet authorized
    const urlParams = new URLSearchParams(window.location.search);
    const hasPreviewParam = urlParams.get('preview') === 'true' || urlParams.get('preview') === '1';

    if (hasPreviewParam && !isPreviewMode()) {
      openPreviewAuthModal({
        onSuccess: () => {
          window.location.reload();
        },
        onCancel: () => {
          // Locked levels remain locked; ?preview=true is stripped automatically
        }
      });
    }

    // Check if redirected because of locked direct access
    const lockedParam = urlParams.get('locked');
    if (lockedParam) {
      const lockedLevel = LEVELS_CONFIG.find(l => l.id === parseInt(lockedParam, 10));
      const dateText = lockedLevel ? lockedLevel.unlockDisplay : `12:00 AM on Dec ${lockedParam}`;
      setTimeout(() => {
        showToast(`Patience, Panda! Level ${lockedParam} unlocks at ${dateText} ✨`, '🔒');
      }, 400);

      // Clean query string
      urlParams.delete('locked');
      const newQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
      window.history.replaceState({}, document.title, window.location.pathname + newQuery);
    }

    // Purge any stale preview test completions if in live mode
    if (!isPreviewMode()) {
      LEVELS_CONFIG.forEach(lvl => {
        const unlockTime = new Date(lvl.unlockISO).getTime();
        if (Date.now() < unlockTime) {
          try {
            localStorage.removeItem(`panda_level_${lvl.id}_completed`);
          } catch (e) {}
        }
      });
    }

    // Setup mascot tap listener for secret 5-tap
    const mascot = document.getElementById('pandaMascot');
    if (mascot) {
      mascot.addEventListener('click', handleMascotTap);
    }

    // Initialize "Birthday Ki Application" Gate
    initApplicationGate();

    // Initialize Vault Lock UI
    initVaultUI();

    // Initial render & state evaluation
    renderAllCards();

    // Start 1-second auto-unlock countdown ticker
    if (intervalTimer) clearInterval(intervalTimer);
    intervalTimer = setInterval(() => {
      updateCountdowns();
    }, 1000);
  }

  /**
   * Render all 5 cards into the DOM
   */
  function renderAllCards() {
    const container = document.getElementById('countdownMap');
    if (!container) return;

    container.innerHTML = '';

    LEVELS_CONFIG.forEach(level => {
      const unlocked = isLevelUnlocked(level.id);
      const completed = isLevelCompleted(level.id);
      levelStateCache[level.id] = unlocked;

      const remaining = getRemainingTime(level.id);

      const wrapper = document.createElement('div');
      wrapper.className = `level-card-wrapper ${unlocked ? 'is-unlocked' : 'is-locked'} ${completed ? 'is-completed' : ''}`;
      wrapper.id = `wrapper-level-${level.id}`;

      // Central node checkpoint
      const checkpoint = document.createElement('div');
      checkpoint.className = `map-checkpoint-node ${completed ? 'checkpoint-completed' : ''}`;
      checkpoint.innerHTML = completed ? '★' : (unlocked ? '✓' : level.id);
      wrapper.appendChild(checkpoint);

      // Card element
      const card = document.createElement('div');
      card.className = `level-card ${unlocked ? 'is-unlocked' : 'is-locked'} ${level.isFinale ? 'is-finale' : ''} ${completed ? 'is-completed' : ''}`;
      card.id = `level-card-${level.id}`;

      let statusBadgeClass = 'status-locked';
      let statusBadgeText = '🔒 LOCKED';
      if (completed) {
        statusBadgeClass = 'status-completed';
        statusBadgeText = 'COMPLETED ✓';
      } else if (unlocked) {
        statusBadgeClass = 'status-unlocked';
        statusBadgeText = 'UNLOCKED';
      }

      card.innerHTML = `
        <div class="card-panda-ears">
          <div class="card-ear card-ear-left"></div>
          <div class="card-ear card-ear-right"></div>
        </div>

        <div class="card-header">
          <span class="card-day-badge">${level.dayLabel}</span>
          <span class="card-status-badge ${statusBadgeClass}" id="status-badge-${level.id}">
            ${statusBadgeText}
          </span>
        </div>

        <div class="card-body">
          <div class="card-level-num">Level 0${level.id}</div>
          <h3 class="card-title">${level.title}</h3>
          <p class="card-subtitle">${level.subtitle}</p>
        </div>

        <div class="card-countdown-box ${unlocked ? 'is-unlocked-state' : ''}" id="countdown-box-${level.id}">
          <span class="countdown-label">
            ${completed ? '<span>⭐ Status:</span>' : (unlocked ? '<span>✨ Status:</span>' : '<span>⏳ Status:</span>')}
          </span>
          <span class="countdown-timer-value" id="countdown-val-${level.id}">
            ${completed ? 'Completed ✓' : (unlocked ? (isPreviewMode() ? 'Unlocked (Preview)' : 'Unlocked ✨') : remaining.text)}
          </span>
        </div>

        <div class="card-action-wrap" id="action-wrap-${level.id}">
          ${renderActionButton(level, unlocked, completed)}
        </div>
      `;

      // If card is locked, attach tap feedback
      card.addEventListener('click', (e) => {
        // If clicking unlocked link, let navigation proceed
        if (card.classList.contains('is-unlocked')) {
          return;
        }
        e.preventDefault();
        handleLockedCardClick(level.id);
      });

      wrapper.appendChild(card);
      container.appendChild(wrapper);
    });
  }

  function renderActionButton(level, unlocked, completed = false) {
    if (unlocked) {
      const btnText = completed ? `Replay Level 0${level.id} ✨` : `Play Level 0${level.id}`;
      return `
        <a href="${level.url}" class="card-action-btn ${level.isFinale ? 'btn-finale' : 'btn-unlocked'} ${completed ? 'btn-completed' : ''}">
          <span>${btnText}</span>
          <span>→</span>
        </a>
      `;
    } else {
      return `
        <button class="card-action-btn btn-locked" type="button">
          <span>🔒 Locked (Opens at 12:00 AM)</span>
        </button>
      `;
    }
  }

  /**
   * Real-Time 1-Second Auto-Unlock & Countdown Update
   */
  function updateCountdowns() {
    LEVELS_CONFIG.forEach(level => {
      const isNowUnlocked = isLevelUnlocked(level.id);
      const wasUnlocked = levelStateCache[level.id];

      const valEl = document.getElementById(`countdown-val-${level.id}`);
      const boxEl = document.getElementById(`countdown-box-${level.id}`);
      const badgeEl = document.getElementById(`status-badge-${level.id}`);
      const actionWrapEl = document.getElementById(`action-wrap-${level.id}`);
      const cardEl = document.getElementById(`level-card-${level.id}`);
      const wrapperEl = document.getElementById(`wrapper-level-${level.id}`);

      // Check for exact-second transition from Locked -> Unlocked
      if (!wasUnlocked && isNowUnlocked) {
        levelStateCache[level.id] = true;

        if (cardEl) {
          cardEl.classList.remove('is-locked');
          cardEl.classList.add('is-unlocked');
          cardEl.classList.add('just-unlocked');
          setTimeout(() => cardEl.classList.remove('just-unlocked'), 1500);
        }
        if (wrapperEl) {
          wrapperEl.classList.remove('is-locked');
          wrapperEl.classList.add('is-unlocked');
          const checkpoint = wrapperEl.querySelector('.map-checkpoint-node');
          if (checkpoint) checkpoint.innerHTML = '✓';
        }
        if (badgeEl) {
          badgeEl.className = 'card-status-badge status-unlocked';
          badgeEl.textContent = 'UNLOCKED';
        }
        if (boxEl) {
          boxEl.classList.add('is-unlocked-state');
        }
        if (actionWrapEl) {
          actionWrapEl.innerHTML = renderActionButton(level, true);
        }

        showToast(`Level 0${level.id} ("${level.title}") is now UNLOCKED! ✨`, '🎉');
      }

      // Update timer text if still locked
      if (!isNowUnlocked) {
        const remaining = getRemainingTime(level.id);
        if (valEl && remaining) {
          valEl.textContent = remaining.text;
        }
      } else {
        const isComp = isLevelCompleted(level.id);
        if (valEl) {
          valEl.textContent = isComp ? 'Completed ✓' : (isPreviewMode() ? 'Unlocked (Preview)' : 'Unlocked ✨');
        }
      }
    });
  }

  /**
   * Ambient Floating Particle & Sparkle Canvas
   */
  function initBackgroundParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const colors = [
      'rgba(244, 143, 177, 0.45)', // Rose Pink
      'rgba(236, 64, 122, 0.35)',  // Deep Rose
      'rgba(212, 175, 55, 0.5)',   // Champagne Gold
      'rgba(243, 229, 171, 0.55)', // Light Gold
      'rgba(255, 255, 255, 0.7)'   // Pearl White
    ];

    const particleCount = Math.min(Math.floor(width / 24), 55);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.45,
        vy: -Math.random() * 0.55 - 0.2, // Drift gently upwards
        pulse: Math.random() * Math.PI,
        pulseSpeed: 0.02 + Math.random() * 0.02
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentRadius = p.radius + Math.sin(p.pulse) * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // Public API
  return {
    PREVIEW_PASSWORD,
    LEVELS_CONFIG,
    isPreviewMode,
    setPreviewMode,
    exitPreviewMode,
    openPreviewAuthModal,
    isApplicationAccepted,
    initApplicationGate,
    handleApplicationNo,
    handleApplicationYes,
    resetApplication,
    isVaultUnlocked,
    unlockVault,
    togglePasswordVisibility,
    initVaultUI,
    isLevelUnlocked,
    isLevelCompleted,
    completeLevel,
    resetAllCompletions,
    getRemainingTime,
    showToast,
    guardLevel,
    initHub,
    initPreviewBanner,
    initBackgroundParticles
  };
})();

// Attach to window for global access across all pages
window.PandaLock = PandaLock;
