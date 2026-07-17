// pharmacy-web/src/utils/orderAlertAudio.js
// NEW FILE
// Plain JS singleton that owns the single Audio instance for the order alert.
// No React, no Zustand, no hooks.
// Called directly by useOrderAlertStore when pending count crosses 0↔1.

const orderAlertAudio = (() => {
  let audio = null;
  let isPlaying = false;

  const getAudio = () => {
    if (audio) return audio;

    try {
      audio = new Audio('/sounds/order-alert.mp3');
      audio.loop   = true;
      audio.volume = 0.6;

      audio.addEventListener('play',  () => { isPlaying = true;  });
      audio.addEventListener('pause', () => { isPlaying = false; });
      audio.addEventListener('ended', () => { isPlaying = false; }); // safety — loop=true means this shouldn't fire
      audio.addEventListener('error', (e) => {
        console.warn('[OrderAlert] Audio error:', e);
        isPlaying = false;
      });
    } catch {
      // Audio API not available (e.g. SSR / test environment)
      audio = null;
    }

    return audio;
  };

  return {
    /**
     * Start looping the alert sound.
     * Safe to call multiple times — will not restart if already playing.
     */
    start() {
      const a = getAudio();
      if (!a || isPlaying) return;

      a.currentTime = 0;
      a.play().catch((err) => {
        // Autoplay policy blocked the play attempt.
        // This is expected if the user hasn't interacted with the page yet.
        // The sound will not play — this is a browser limitation we cannot work around
        // without a user gesture. The banner still shows as a visual fallback.
        console.warn('[OrderAlert] Autoplay blocked:', err.message);
        isPlaying = false;
      });
    },

    /**
     * Stop the alert sound and reset to beginning.
     * Safe to call when already stopped.
     */
    stop() {
      const a = getAudio();
      if (!a) return;

      a.pause();
      a.currentTime = 0;
      isPlaying = false;
    },

    /**
     * Returns whether the audio is currently playing.
     * Useful for debugging.
     */
    isPlaying() {
      return isPlaying;
    },
  };
})();

export default orderAlertAudio;