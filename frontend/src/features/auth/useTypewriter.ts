import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  words: string[];
  /** Delay between each character typed (ms) */
  typeSpeed?: number;
  /** Delay between each character deleted (ms) */
  deleteSpeed?: number;
  /** How long the full word stays visible before backspacing (ms) */
  pauseAfterType?: number;
  /** How long to pause after full deletion before typing next word (ms) */
  pauseAfterDelete?: number;
}

interface UseTypewriterResult {
  displayText: string;
  /** true while typing or deleting; false when the word is fully displayed and idle */
  isIdle: boolean;
}

/**
 * useTypewriter — pure React typewriter with backspace effect.
 * Cycles through `words` in an infinite loop with no external dependencies.
 */
export function useTypewriter({
  words,
  typeSpeed = 90,
  deleteSpeed = 55,
  pauseAfterType = 1800,
  pauseAfterDelete = 380,
}: UseTypewriterOptions): UseTypewriterResult {
  const [displayText, setDisplayText] = useState('');
  const [isIdle, setIsIdle] = useState(false);

  // Use refs for imperative loop state to avoid stale closures
  const wordIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<'typing' | 'waiting' | 'deleting'>('typing');
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentWord = wordsRef.current[wordIndexRef.current];

      if (phaseRef.current === 'typing') {
        if (charIndexRef.current < currentWord.length) {
          charIndexRef.current += 1;
          setDisplayText(currentWord.slice(0, charIndexRef.current));
          setIsIdle(false);
          timeout = setTimeout(tick, typeSpeed);
        } else {
          // Word fully typed — idle, let cursor blink
          setIsIdle(true);
          phaseRef.current = 'waiting';
          timeout = setTimeout(tick, pauseAfterType);
        }
      } else if (phaseRef.current === 'waiting') {
        setIsIdle(false);
        phaseRef.current = 'deleting';
        timeout = setTimeout(tick, deleteSpeed);
      } else {
        // deleting
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(currentWord.slice(0, charIndexRef.current));
          timeout = setTimeout(tick, deleteSpeed);
        } else {
          // Word fully deleted — advance to next word
          wordIndexRef.current = (wordIndexRef.current + 1) % wordsRef.current.length;
          phaseRef.current = 'typing';
          timeout = setTimeout(tick, pauseAfterDelete);
        }
      }
    };

    // Kick off with a small initial delay so the page entrance animation plays first
    timeout = setTimeout(tick, 820);
    return () => clearTimeout(timeout);
  }, []); // intentionally empty — the loop is fully self-contained via refs

  return { displayText, isIdle };
}
