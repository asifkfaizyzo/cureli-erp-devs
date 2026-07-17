// pharmacy-web/src/utils/orderAlertAudio.js
// NEW FILE
// Plain JS singleton that owns the single Audio instance for the order alert.
// No React, no Zustand, no hooks.
// Called directly by useOrderAlertStore when pending count crosses 0↔1.

const orderAlertAudio = (() => {
  let audio = null;
  let isPlaying = false;
  let unlocked = false;
  let pendingPlay = false;  // play was requested before unlock

  const getAudio = () => {
    if (audio) return audio;
    try {
      audio = new Audio('/sounds/order-alert.mp3');
      audio.loop   = true;
      audio.volume = 0.6;
      audio.addEventListener('play',  () => { isPlaying = true; });
      audio.addEventListener('pause', () => { isPlaying = false; });
      audio.addEventListener('ended', () => { isPlaying = false; });
      audio.addEventListener('error', (e) => {
        console.warn('[OrderAlert] Audio error:', e);
        isPlaying = false;
      });
    } catch {
      audio = null;
    }
    return audio;
  };

  // ── Call this on ANY user interaction ──────────────────────────────
  // Plays a silent buffer to unlock the audio context.
  // After this, .play() will work even without a gesture.
  const unlock = () => {
    if (unlocked) return;
    const a = getAudio();
    if (!a) return;

    // Play silence to unlock
    a.volume = 0;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = 0.6;
        unlocked = true;

        // If start() was called before unlock, play now
        if (pendingPlay) {
          pendingPlay = false;
          orderAlertAudio.start();
        }
      })
      .catch(() => {
        // Still blocked — will retry on next interaction
      });
  };

  // Attach unlock to common user gestures — fires once then removes itself
  const UNLOCK_EVENTS = ['click', 'keydown', 'touchstart', 'pointerdown'];
  const onUserGesture = () => {
    unlock();
    // Keep listening — unlock() is idempotent after first success
  };
  if (typeof window !== 'undefined') {
    UNLOCK_EVENTS.forEach((e) =>
      window.addEventListener(e, onUserGesture, { passive: true })
    );
  }

  return {
    start() {
      const a = getAudio();
      if (!a || isPlaying) return;

      if (!unlocked) {
        // Queue play for after first user interaction
        pendingPlay = true;
        console.warn('[OrderAlert] Audio not yet unlocked — will play after first user gesture');
        return;
      }

      a.currentTime = 0;
      a.play().catch((err) => {
        console.warn('[OrderAlert] Autoplay blocked:', err.message);
        isPlaying = false;
      });
    },

    stop() {
      const a = getAudio();
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      isPlaying = false;
      pendingPlay = false;
    },

    isPlaying() {
      return isPlaying;
    },
  };
})();


export default orderAlertAudio;