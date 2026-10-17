// ============================================================================
// RIGHT HERE WAITING FOR YOU (SAXOPHONE VERSION)
// Audio Player with YouTube Embed (https://youtu.be/dymHx4cAYo8) & Sax Synth Fallback
// ============================================================================

export const CURRENT_SONG_TITLE = 'Right Here Waiting for You (Saxophone)';
export const YOUTUBE_VIDEO_ID = 'dymHx4cAYo8';

let audioCtx = null;
let ytPlayer = null;
let isYtReady = false;
let shouldPlayWhenReady = false;
let isMusicPlaying = false;
let currentVolume = 0.55;
let musicStatusCallbacks = [];

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function onMusicStatusChange(callback) {
  if (typeof callback === 'function') {
    musicStatusCallbacks.push(callback);
  }
}

function notifyMusicStatus(isPlaying) {
  isMusicPlaying = isPlaying;
  musicStatusCallbacks.forEach(cb => {
    try {
      cb(isPlaying, CURRENT_SONG_TITLE);
    } catch (e) {
      console.warn(e);
    }
  });
}

// ============================================================================
// YOUTUBE IFRAME PLAYER INITIALIZATION (https://youtu.be/dymHx4cAYo8)
// ============================================================================
function initYouTubePlayer() {
  if (ytPlayer || !window.YT || !window.YT.Player) return;

  const playerTarget = document.getElementById('youtubePlayer');
  if (!playerTarget) return;

  try {
    ytPlayer = new window.YT.Player('youtubePlayer', {
      height: '200',
      width: '200',
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: YOUTUBE_VIDEO_ID, // Required for loop in YT IFrame
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: (event) => {
          isYtReady = true;
          try {
            event.target.setVolume(Math.round(currentVolume * 100));
            if (shouldPlayWhenReady) {
              event.target.playVideo();
            }
          } catch (e) {}
        },
        onStateChange: (event) => {
          // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
          if (event.data === 1) {
            isMusicPlaying = true;
            notifyMusicStatus(true);
            // Stop synth fallback if active
            saxEngine.stop();
          } else if (event.data === 2 || event.data === 0) {
            isMusicPlaying = false;
            notifyMusicStatus(false);
          }
        },
        onError: (err) => {
          console.warn('YouTube embed restricted or blocked, starting synthesized saxophone:', err);
          if (isMusicPlaying) {
            saxEngine.start();
          }
        }
      }
    });
  } catch (err) {
    console.warn('Failed to init YT player:', err);
  }
}

// Register global YouTube API callback
if (typeof window !== 'undefined') {
  const existingCallback = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function() {
    if (typeof existingCallback === 'function') existingCallback();
    initYouTubePlayer();
  };

  // If YT already loaded
  if (window.YT && window.YT.Player) {
    initYouTubePlayer();
  }
}

// ============================================================================
// PROCEDURAL SAXOPHONE SYNTHESIZER FALLBACK
// Plays the iconic melody of "Right Here Waiting for You"
// ============================================================================
class RightHereWaitingSaxophoneEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timer = null;
    this.noteIndex = 0;
    this.masterGain = null;

    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33;

    this.score = [
      { isRest: true, duration: 0.8, bass: C4 / 2, chord: [C4, E4, G4] },
      // "Wherever you go..."
      { freq: G4, duration: 0.45, rest: 0.05, bass: C4 / 2, chord: [C4, E4, G4] },
      { freq: C5, duration: 0.65, rest: 0.05 },
      { freq: B4, duration: 0.35, rest: 0.05 },
      { freq: C5, duration: 0.60, rest: 0.05 },
      { freq: G4, duration: 1.30, rest: 0.35, vibrato: true, bass: B4 / 4, chord: [D4, G4, B4] },
      // "Whatever you do..."
      { freq: G4, duration: 0.45, rest: 0.05 },
      { freq: C5, duration: 0.65, rest: 0.05 },
      { freq: B4, duration: 0.35, rest: 0.05 },
      { freq: C5, duration: 0.60, rest: 0.05 },
      { freq: A4, duration: 1.30, rest: 0.35, vibrato: true, bass: A4 / 4, chord: [C4, E4, A4] },
      // "I will be right here waiting for you..."
      { freq: A4, duration: 0.38, rest: 0.04, bass: F4 / 4, chord: [C4, F4, A4] },
      { freq: B4, duration: 0.38, rest: 0.04 },
      { freq: C5, duration: 0.55, rest: 0.05 },
      { freq: D5, duration: 0.65, rest: 0.05 },
      { freq: C5, duration: 0.50, rest: 0.05 },
      { freq: B4, duration: 0.42, rest: 0.04 },
      { freq: A4, duration: 0.42, rest: 0.04 },
      { freq: G4, duration: 1.45, rest: 0.40, vibrato: true, bass: G4 / 4, chord: [B4, D4, G4] },
      // "Whatever it takes..."
      { freq: G4, duration: 0.45, rest: 0.05, bass: C4 / 2, chord: [C4, E4, G4] },
      { freq: C5, duration: 0.65, rest: 0.05 },
      { freq: B4, duration: 0.35, rest: 0.05 },
      { freq: C5, duration: 0.60, rest: 0.05 },
      { freq: G4, duration: 1.30, rest: 0.35, vibrato: true, bass: B4 / 4, chord: [D4, G4, B4] },
      // "Or how my heart breaks..."
      { freq: G4, duration: 0.45, rest: 0.05 },
      { freq: C5, duration: 0.65, rest: 0.05 },
      { freq: B4, duration: 0.35, rest: 0.05 },
      { freq: C5, duration: 0.60, rest: 0.05 },
      { freq: A4, duration: 1.30, rest: 0.35, vibrato: true, bass: A4 / 4, chord: [C4, E4, A4] },
      // "I will be right here waiting for you..."
      { freq: A4, duration: 0.38, rest: 0.04, bass: F4 / 4, chord: [C4, F4, A4] },
      { freq: B4, duration: 0.38, rest: 0.04 },
      { freq: C5, duration: 0.55, rest: 0.05 },
      { freq: D5, duration: 0.65, rest: 0.05 },
      { freq: C5, duration: 0.50, rest: 0.05 },
      { freq: B4, duration: 0.42, rest: 0.04 },
      { freq: A4, duration: 0.42, rest: 0.04 },
      { freq: G4, duration: 0.70, rest: 0.05 },
      { freq: F4, duration: 0.45, rest: 0.05, bass: G4 / 4, chord: [B4, D4, G4] },
      { freq: E4, duration: 0.60, rest: 0.05 },
      { freq: D4, duration: 0.55, rest: 0.05 },
      { freq: C4, duration: 2.20, rest: 0.80, vibrato: true, bass: C4 / 2, chord: [C4, E4, G4] }
    ];
  }

  start() {
    if (this.isPlaying) return;
    this.ctx = getAudioContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.noteIndex = 0;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, currentVolume), this.ctx.currentTime + 1.2);
    this.masterGain.connect(this.ctx.destination);

    this.playNextNote();
  }

  playNextNote() {
    if (!this.isPlaying || !this.ctx) return;

    if (this.noteIndex >= this.score.length) {
      this.noteIndex = 0;
    }

    const item = this.score[this.noteIndex];
    const now = this.ctx.currentTime;

    if (item.chord && item.bass) {
      this.playPianoChord(item.chord, item.bass, now, (item.duration || 1.0) + 1.8);
    }

    if (!item.isRest && item.freq) {
      this.playSaxophoneNote(item.freq, now, item.duration, item.vibrato);
    }

    const stepDurationMs = ((item.duration || 0) + (item.rest || 0)) * 1000;
    this.noteIndex++;

    this.timer = setTimeout(() => {
      this.playNextNote();
    }, Math.max(80, stepDurationMs));
  }

  playSaxophoneNote(freq, time, duration, hasVibrato = false) {
    if (!this.ctx || !this.masterGain) return;

    const reedOsc = this.ctx.createOscillator();
    reedOsc.type = 'sawtooth';
    reedOsc.frequency.setValueAtTime(freq, time);

    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(freq, time);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.2, time);
    
    lfoGain.gain.setValueAtTime(0.0001, time);
    if (hasVibrato || duration > 0.6) {
      lfoGain.gain.setValueAtTime(0.0001, time + 0.18);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.018, time + 0.45);
    }
    lfo.connect(lfoGain);
    lfoGain.connect(reedOsc.frequency);
    lfoGain.connect(bodyOsc.frequency);

    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(1450, time);
    formant.Q.setValueAtTime(2.2, time);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(0.26, time + 0.06);
    noteGain.gain.setValueAtTime(0.24, time + duration * 0.7);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.12);

    reedOsc.connect(formant);
    formant.connect(noteGain);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.12, time);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(noteGain);

    noteGain.connect(this.masterGain);

    lfo.start(time);
    reedOsc.start(time);
    bodyOsc.start(time);

    const stopTime = time + duration + 0.15;
    lfo.stop(stopTime);
    reedOsc.stop(stopTime);
    bodyOsc.stop(stopTime);
  }

  playPianoChord(chordNotes, bassFreq, time, duration) {
    if (!this.ctx || !this.masterGain) return;

    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, time);

    bassGain.gain.setValueAtTime(0.0001, time);
    bassGain.gain.exponentialRampToValueAtTime(0.22, time + 0.08);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(time);
    bassOsc.stop(time + duration + 0.1);

    chordNotes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time + idx * 0.03);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, time);
      filter.frequency.exponentialRampToValueAtTime(320, time + duration);

      gain.gain.setValueAtTime(0.0001, time + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.12, time + idx * 0.03 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time + idx * 0.03);
      osc.stop(time + duration + 0.1);
    });
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      } catch (e) {}
    }
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(Math.max(0.001, vol), this.ctx.currentTime);
      } catch (e) {}
    }
  }
}

const saxEngine = new RightHereWaitingSaxophoneEngine();

/**
 * Start Playing Right Here Waiting for You (Saxophone Version)
 */
export function startRomanticMusic() {
  getAudioContext();
  isMusicPlaying = true;
  notifyMusicStatus(true);

  if (ytPlayer && isYtReady) {
    try {
      ytPlayer.playVideo();
    } catch (e) {
      saxEngine.start();
    }
  } else {
    shouldPlayWhenReady = true;
    initYouTubePlayer();
    
    // Timeout fallback if YouTube is slow/blocked
    setTimeout(() => {
      if (isMusicPlaying) {
        try {
          if (!ytPlayer || !isYtReady || ytPlayer.getPlayerState() !== 1) {
            saxEngine.start();
          }
        } catch (e) {
          saxEngine.start();
        }
      }
    }, 2200);
  }
}

/**
 * Pause Music
 */
export function pauseRomanticMusic() {
  isMusicPlaying = false;
  shouldPlayWhenReady = false;
  
  if (ytPlayer && isYtReady) {
    try {
      ytPlayer.pauseVideo();
    } catch (e) {}
  }
  saxEngine.stop();
  notifyMusicStatus(false);
}

/**
 * Toggle play/pause
 */
export function toggleRomanticMusic() {
  if (isMusicPlaying) {
    pauseRomanticMusic();
  } else {
    startRomanticMusic();
  }
  return isMusicPlaying;
}

export function setMusicVolume(val) {
  currentVolume = Math.min(1, Math.max(0, val));
  if (ytPlayer && isYtReady) {
    try {
      ytPlayer.setVolume(Math.round(currentVolume * 100));
    } catch (e) {}
  }
  saxEngine.setVolume(currentVolume);
}

export function getIsMusicPlaying() {
  return isMusicPlaying;
}

// ============================================================================
// SOUND EFFECTS
// ============================================================================

export function playEnvelopeOpen() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [392, 523.25, 659.25, 783.99, 1046.50];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.9);
  });
}

export function playClaimHarp() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);

    gain.gain.setValueAtTime(0.001, now + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.07 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.0);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 1.1);
  });
}

export function playHusbandAlert() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const frequencies = [784, 1046.5];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.001, now + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 1.3);
  });
}

export function playSoftClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}
