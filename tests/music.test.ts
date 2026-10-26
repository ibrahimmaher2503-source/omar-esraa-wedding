import assert from 'node:assert/strict';
import { test } from 'node:test';

test('music attempts autoplay, retries on interaction, and cleans up', async () => {
  const { createMusicController } = await import('../src/music.ts');
  const target = new EventTarget();
  let calls = 0;
  const audio = {
    paused: true, volume: 0,
    play() { calls++; if (calls === 1) return Promise.reject(new Error('NotAllowedError')); this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
  };
  const music = createMusicController(audio as HTMLAudioElement, target);
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(audio.volume, .55);
  target.dispatchEvent(new Event('click'));
  assert.equal(audio.paused, false);
  target.dispatchEvent(new Event('click'));
  music.retry();
  assert.equal(calls, 2);
  music.dispose();
  assert.equal(audio.paused, true);
  target.dispatchEvent(new Event('keydown'));
  assert.equal(calls, 2);
});
