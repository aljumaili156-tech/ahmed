/**
 * High-Fidelity School Bell Audio Engine with Background Keep-Alive & Lock Screen MediaSession
 * 100% Offline Compatible - Instant Guaranteed Audio Cancellation
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const activeAudioElements = new Set<HTMLAudioElement>();
let backgroundGuardAudio: HTMLAudioElement | null = null;
let isRingingState = false;
let ringTimeoutId: number | null = null;
let audioUnlocked = false;
let isBackgroundActive = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext error:', e);
    return null;
  }
}

/**
 * Global unlock function called on any user gesture
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    // Pre-load audio elements in DOM
    const warmAudio = new Audio('/melodic_bell.wav');
    warmAudio.volume = 0.001;
    warmAudio.play().then(() => {
      warmAudio.pause();
      warmAudio.currentTime = 0;
    }).catch(() => {});

    audioUnlocked = true;
  } catch (err) {
    console.warn('Audio unlock error:', err);
  }
}

// Auto-attach unlocker to first interaction
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('pointerdown', handleInteraction);
  };
  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('pointerdown', handleInteraction, { passive: true });
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/**
 * Background Keep-Alive Carrier
 * Plays a silent 1-second audio loop in the background so mobile browsers
 * (iOS Safari, Android Chrome) do NOT throttle timers or pause execution
 * when the screen is locked or when switching between apps!
 */
export function startBackgroundGuard(schoolName = 'جرس المدرسة'): boolean {
  if (isBackgroundActive && backgroundGuardAudio) return true;
  try {
    unlockAudio();
    const silence = new Audio('/silence.wav');
    silence.loop = true;
    silence.volume = 0.001; // inaudible keep-alive

    const promise = silence.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          backgroundGuardAudio = silence;
          isBackgroundActive = true;
          setupMediaSession(schoolName, 'حارس التنبيهات في الخلفية وشاشة القفل نشط');
        })
        .catch((e) => {
          console.warn('Background guard autoplay blocked until user tap:', e);
        });
    }
    return true;
  } catch (err) {
    console.warn('Background guard error:', err);
    return false;
  }
}

export function stopBackgroundGuard() {
  if (backgroundGuardAudio) {
    try {
      backgroundGuardAudio.pause();
      backgroundGuardAudio.currentTime = 0;
      backgroundGuardAudio.src = '';
    } catch {}
    backgroundGuardAudio = null;
  }
  isBackgroundActive = false;
}

export function isBackgroundGuardRunning(): boolean {
  return isBackgroundActive;
}

/**
 * Configure Lock Screen Media Notification controls
 */
export function setupMediaSession(
  title: string,
  artist: string,
  onDismissHeading?: () => void
) {
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album: 'نظام جرس الحصص الذكي',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      // Actions on lock screen: tapping Pause or Stop dismisses the alarm!
      navigator.mediaSession.setActionHandler('pause', () => {
        stopSchoolBell();
        if (onDismissHeading) onDismissHeading();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        stopSchoolBell();
        if (onDismissHeading) onDismissHeading();
      });
    } catch (e) {
      console.warn('MediaSession setup error:', e);
    }
  }
}

/**
 * Stop any currently ringing bell IMMEDIATELY and COMPLETELY.
 * Never allows sound to hang or continue playing!
 */
export function stopSchoolBell() {
  isRingingState = false;

  if (ringTimeoutId) {
    clearTimeout(ringTimeoutId);
    ringTimeoutId = null;
  }

  // 1. Immediately pause and reset every active Audio element
  activeAudioElements.forEach((audio) => {
    try {
      audio.pause();
      audio.volume = 0;
      audio.currentTime = 0;
      audio.src = ''; // disconnect source
      audio.remove();
    } catch {
      // ignore
    }
  });
  activeAudioElements.clear();

  // 2. Mute and disconnect master Web Audio gain
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      // Re-create master gain ready for next legitimate play
      masterGain.disconnect();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    } catch {
      // ignore
    }
  }

  // Restore background guard metadata if it was running
  if (isBackgroundActive) {
    setupMediaSession('نظام جرس الحصص الذكي', 'حارس التنبيهات نشط في الخلفية');
  }
}

/**
 * Play high-volume, beautiful school bell
 * Default is 'melodic' (Westminster acoustic bronze chime - loud, clear, and elegant)
 */
export function playSchoolBell(
  type: 'melodic' | 'electric' = 'melodic',
  durationSeconds = 8,
  volume = 0.95,
  classInfo?: { subject: string; gradeAndSection: string; room: string },
  onDismissCallback?: () => void
): Promise<boolean> {
  // First, completely silence any previous audio
  stopSchoolBell();
  isRingingState = true;
  unlockAudio();

  const soundFile = type === 'electric' ? '/school_bell.wav' : '/melodic_bell.wav';

  // Setup lock screen media notification
  if (classInfo) {
    setupMediaSession(
      `🔔 توجه للصف: مادة ${classInfo.subject}`,
      `${classInfo.gradeAndSection} • ${classInfo.room}`,
      onDismissCallback
    );
  } else {
    setupMediaSession('🔔 رنين جرس الحصة', 'حان موعد التوجه إلى الصف', onDismissCallback);
  }

  return new Promise((resolve) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = Math.min(1.0, Math.max(0.2, volume));
      activeAudioElements.add(audio);

      audio.onended = () => {
        activeAudioElements.delete(audio);
        if (activeAudioElements.size === 0) {
          isRingingState = false;
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioUnlocked = true;
            resolve(true);
          })
          .catch((err) => {
            console.warn('Primary Audio play blocked, trying Web Audio fallback:', err);
            activeAudioElements.delete(audio);
            playWebAudioFallback(type, durationSeconds, volume);
            resolve(false);
          });
      }
    } catch (e) {
      console.warn('Audio element creation failed, using Web Audio:', e);
      playWebAudioFallback(type, durationSeconds, volume);
      resolve(true);
    }

    ringTimeoutId = window.setTimeout(() => {
      stopSchoolBell();
    }, durationSeconds * 1000);
  });
}

/**
 * Web Audio API Fallback Synthesizer
 */
function playWebAudioFallback(type: 'melodic' | 'electric', duration = 7, volume = 0.9) {
  try {
    const ctx = getAudioContext();
    if (!ctx || !masterGain) return;
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);

    if (type === 'melodic') {
      // 4-chime Westminster sequence
      const chimes = [
        { freq: 415.3, time: 0.1 },
        { freq: 369.9, time: 0.8 },
        { freq: 329.6, time: 1.5 },
        { freq: 246.9, time: 2.2 },
        { freq: 329.6, time: 3.3 },
        { freq: 369.9, time: 4.0 },
        { freq: 415.3, time: 4.7 },
        { freq: 329.6, time: 5.4 },
      ];

      chimes.forEach((c) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(c.freq, ctx.currentTime + c.time);
        g.gain.setValueAtTime(volume * 0.7, ctx.currentTime + c.time);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + c.time + 1.8);
        osc.connect(g);
        g.connect(masterGain!);
        osc.start(ctx.currentTime + c.time);
        osc.stop(ctx.currentTime + c.time + 1.9);
      });
    } else {
      // Electric Bell strikes
      const now = ctx.currentTime + 0.05;
      const count = Math.min(30, Math.floor(duration * 6));
      for (let i = 0; i < count; i++) {
        const t = now + i * 0.15;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        g.gain.setValueAtTime(volume * 0.6, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(g);
        g.connect(masterGain!);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    }
  } catch (err) {
    console.warn('Web Audio synthesis error:', err);
  }
}

export function playElectricSchoolBell(duration = 7, volume = 0.95): Promise<boolean> {
  return playSchoolBell('electric', duration, volume);
}

export function playMelodicSchoolBell(volume = 0.95): Promise<boolean> {
  return playSchoolBell('melodic', 8, volume);
}

export function isBellRinging(): boolean {
  return isRingingState;
}
