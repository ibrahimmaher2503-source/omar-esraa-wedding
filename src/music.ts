export function createMusicController(audio: HTMLAudioElement, target: EventTarget = document) {
  let enabled = true;
  const attempt = () => {
    if (!enabled || !audio.paused) return;
    audio.volume = .55;
    void audio.play().catch(() => {});
  };
  target.addEventListener('click', attempt);
  target.addEventListener('keydown', attempt);
  attempt();
  return {
    retry: attempt,
    start() { enabled = true; attempt(); },
    pause() { enabled = false; audio.pause(); },
    dispose() {
      target.removeEventListener('click', attempt);
      target.removeEventListener('keydown', attempt);
      audio.pause();
    },
  };
}
