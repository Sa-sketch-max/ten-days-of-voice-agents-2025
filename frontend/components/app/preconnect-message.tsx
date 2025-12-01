'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { ShimmerText } from '@/components/livekit/shimmer-text';
import { cn } from '@/lib/utils';

const MotionMessage = motion.create('p');

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.5,
        delay: 0.4,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: {
        ease: 'easeIn',
        duration: 0.3,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

interface PreConnectMessageProps {
  messages?: ReceivedChatMessage[];
  className?: string;
}

export function PreConnectMessage({
  className,
  messages = [],
}: PreConnectMessageProps) {
  const show = messages.length === 0;

  return (
    <AnimatePresence>
      {show && (
        <div
          className={cn(
            'pointer-events-none relative flex flex-col items-center justify-center text-center',
            className,
          )}
        >
          {/* subtle neon ring behind */}
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-r from-fuchsia-500/20 via-cyan-400/20 to-amber-300/20 blur-3xl" />

          {/* “spotlight” icon */}
          <motion.div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-500/60 bg-black/60 shadow-[0_0_30px_rgba(217,70,239,0.8)]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* simple equalizer bars */}
            <div className="flex gap-1">
              <span className="h-6 w-1 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-fuchsia-400" />
              <span className="h-4 w-1 animate-[pulse_0.9s_ease-in-out_infinite] rounded-full bg-cyan-400" />
              <span className="h-7 w-1 animate-[pulse_1.1s_ease-in-out_infinite] rounded-full bg-amber-300" />
            </div>
          </motion.div>

          {/* main shimmering line */}
          <MotionMessage
            {...VIEW_MOTION_PROPS}
            aria-hidden={!show}
            className="max-w-md text-balance"
          >
            <ShimmerText className="text-base font-semibold tracking-wide text-slate-50">
              The arena is live. Your host is listening — drop your first bar.
            </ShimmerText>
          </MotionMessage>

          {/* small subtext */}
          <motion.p
            className="mt-2 text-xs text-slate-400"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            No messages yet. Once you connect, the crowd reacts in real time.
          </motion.p>
        </div>
      )}
    </AnimatePresence>
  );
}

