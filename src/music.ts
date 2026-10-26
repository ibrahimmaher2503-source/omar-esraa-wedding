export function createMusicController(audio: HTMLAudioElement, target: EventTarget = document) {
  const attempt = () => {
    if (!audio.paused) return;
    audio.volume = .55;
    void audio.play().catch(() => {});
  };
  target.addEventListener('click', attempt);
  target.addEventListener('keydown', attempt);
  attempt();
  return {
    retry: attempt,
    dispose() {
      target.removeEventListener('click', attempt);
      target.removeEventListener('keydown', attempt);
      audio.pause();
    },
  };
}
