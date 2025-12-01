import React, { useState } from 'react';
import { Button } from '@/components/livekit/button';

function WelcomeLogo() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Outer neon ring */}
      <div className="absolute h-24 w-24 rounded-full bg-gradient-to-tr from-fuchsia-500/40 via-cyan-400/30 to-amber-300/40 blur-xl" />
      {/* Inner badge */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/70 bg-slate-950/90 shadow-[0_0_30px_rgba(236,72,153,0.7)]">
        {/* Equalizer style icon */}
        <svg
          viewBox="0 0 64 64"
          className="h-10 w-10 text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
          fill="currentColor"
        >
          <path d="M15 24V40C15 40.8 14.68 41.56 14.12 42.12C13.56 42.68 12.8 43 12 43C11.2 43 10.44 42.68 9.88 42.12C9.32 41.56 9 40.8 9 40V24C9 23.2 9.32 22.44 9.88 21.88C10.44 21.32 11.2 21 12 21C12.8 21 13.56 21.32 14.12 21.88C14.68 22.44 15 23.2 15 24ZM19 8C19 7.2 19.32 6.44 19.88 5.88C20.44 5.32 21.2 5 22 5C22.8 5 23.56 5.32 24.12 5.88C24.68 6.44 25 7.2 25 8V56C25 56.8 24.68 57.56 24.12 58.12C23.56 58.68 22.8 59 22 59C21.2 59 20.44 58.68 19.88 58.12C19.32 57.56 19 56.8 19 56V8ZM29 16C29 15.2 29.32 14.44 29.88 13.88C30.44 13.32 31.2 13 32 13C32.8 13 33.56 13.32 34.12 13.88C34.68 14.44 35 15.2 35 16V48C35 48.8 34.68 49.56 34.12 50.12C33.56 50.68 32.8 51 32 51C31.2 51 30.44 50.68 29.88 50.12C29.32 49.56 29 48.8 29 48V16ZM39 24C39 23.2 39.32 22.44 39.88 21.88C40.44 21.32 41.2 21 42 21C42.8 21 43.56 21.32 44.12 21.88C44.68 22.44 45 23.2 45 24V40C45 40.8 44.68 41.56 44.12 42.12C43.56 42.68 42.8 43 42 43C41.2 43 40.44 42.68 39.88 42.12C39.32 41.56 39 40.8 39 40V24ZM49 20C49 19.2 49.32 18.44 49.88 17.88C50.44 17.32 51.2 17 52 17C52.8 17 53.56 17.32 54.12 17.88C54.68 18.44 55 19.2 55 20V44C55 44.8 54.68 45.56 54.12 46.12C53.56 46.68 52.8 47 52 47C51.2 47 50.44 46.68 49.88 46.12C49.32 45.56 49 44.8 49 44V20Z" />
        </svg>
      </div>
    </div>
  );
}

function CornerEmoji({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={
        'pointer-events-none select-none drop-shadow-[0_0_18px_rgba(251,191,36,0.6)] ' +
        (className ?? '')
      }
    >
      {children}
    </div>
  );
}

export const WelcomeView = React.forwardRef<HTMLDivElement, any>(
  ({ startButtonText, onStartCall, ...rest }, ref) => {
    const [name, setName] = useState('');
    const [started, setStarted] = useState(false);

    const buttonLabel = startButtonText || 'Join Arena';

    async function handleStart() {
      const trimmed = name.trim();
      if (!trimmed) return;
      setStarted(true);
      onStartCall?.(trimmed);
    }

    return (
      <div
        ref={ref}
        {...rest}
        className="min-h-screen w-full flex flex-col justify-center items-center md:items-end md:pr-24 lg:pr-32 bg-transparent text-white"
      >
        {!started && (
          <section
            className="
              relative flex flex-col items-center text-center p-8
              w-full max-w-sm mx-4 md:mx-0
              rounded-3xl overflow-hidden
              bg-slate-950/90 border border-slate-700/70
              shadow-[0_0_60px_rgba(15,23,42,0.98)]
              backdrop-blur-2xl
            "
          >
            {/* Neon glows / arena lights */}
            <div className="pointer-events-none absolute -inset-16 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.35)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.35)_0,_transparent_55%)]" />

            {/* Corner emojis for vibe */}
            <CornerEmoji className="absolute top-5 left-6 text-3xl -rotate-12">
              🎤
            </CornerEmoji>
            <CornerEmoji className="absolute top-6 right-7 text-2xl rotate-6">
              🎭
            </CornerEmoji>
            <CornerEmoji className="absolute bottom-6 left-6 text-2xl rotate-6">
              😈
            </CornerEmoji>
            <CornerEmoji className="absolute bottom-5 right-7 text-2xl -rotate-6">
              🤘
            </CornerEmoji>

            {/* Logo / equalizer icon */}
            <WelcomeLogo />

            {/* Title & subtitle */}
            <div className="relative z-10">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/80">
                Improv Battle Arena
              </p>
              <h2 className="text-2xl font-extrabold text-slate-50 mb-2 tracking-tight drop-shadow-[0_0_18px_rgba(15,23,42,0.9)]">
                Step Onto the Stage
              </h2>
              <p className="max-w-prose text-sm leading-6 font-medium text-slate-300">
                Drop your stage name and let the AI host run the battle.
              </p>
            </div>

            {/* Name input + start button */}
            <div className="mt-8 w-full relative z-10">
              <label className="block text-xs font-bold uppercase tracking-[0.18em] mb-2 text-left text-slate-400 ml-1">
                Your Stage Name
              </label>

              <div className="flex w-full items-stretch gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStart();
                  }}
                  placeholder="Royal, MC Shadow, etc..."
                  className="
                    flex-1 rounded-xl border border-slate-700/70 px-4 py-3
                    bg-slate-950/80 text-slate-50 placeholder:text-slate-500
                    font-semibold
                    shadow-[inset_0_0_0_1px_rgba(15,23,42,0.9)]
                    focus:outline-none focus:ring-2 focus:ring-fuchsia-500/70 focus:border-fuchsia-500/60
                    transition-all duration-200
                  "
                />

                <Button
                  variant="primary"
                  size="default"
                  onClick={handleStart}
                  disabled={!name.trim()}
                  className="
                    px-4 md:px-5 rounded-xl font-bold uppercase text-[11px]
                    bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400
                    text-slate-950 border-none
                    shadow-[0_0_32px_rgba(236,72,153,0.85)]
                    hover:from-fuchsia-400 hover:via-pink-400 hover:to-cyan-300
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center gap-2 justify-center
                    transform hover:scale-[1.03] active:scale-[0.98] transition-all
                  "
                >
                  <span>{buttonLabel}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-400 font-mono uppercase tracking-[0.24em] relative z-10">
              Press Enter to Join
            </div>
          </section>
        )}

        {started && (
          <div className="text-center text-slate-50 text-2xl font-bold animate-pulse md:pr-12 drop-shadow-[0_0_20px_rgba(15,23,42,1)]">
            🔥 Warming up the crowd…
          </div>
        )}
      </div>
    );
  },
);

WelcomeView.displayName = 'WelcomeView';
