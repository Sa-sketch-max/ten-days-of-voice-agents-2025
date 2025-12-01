'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLocalParticipant } from '@livekit/components-react';
import { ParticipantEvent, type LocalParticipant } from 'livekit-client';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'pointer-events-none h-4',
        top && 'bg-gradient-to-b from-black/60 to-transparent',
        bottom && 'bg-gradient-to-t from-black/60 to-transparent',
        className,
      )}
    />
  );
}

/* === ARENA BACKGROUND ICONS === */

const FloatingIcon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'absolute opacity-20 text-cyan-300 pointer-events-none select-none drop-shadow-[0_0_18px_rgba(34,211,238,0.5)]',
      className,
    )}
  >
    {children}
  </div>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0z" />
  </svg>
);

const LightningIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>
);

const CrowdIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M7 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM4 14a3 3 0 0 0-3 3v3h8v-3a3 3 0 0 0-3-3H4zm10 0a3 3 0 0 0-3 3v3h12v-3a3 3 0 0 0-3-3h-6z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/* === PLAYER BADGE (CONTESTANT TAG) === */

function PlayerBadge({ participant }: { participant?: LocalParticipant }) {
  const [displayName, setDisplayName] = useState('Sam');

  useEffect(() => {
    if (!participant) return;

    const updateName = () => {
      let name = participant.name || '';

      if ((!name || name === 'user' || name === 'identity') && participant.metadata) {
        try {
          const meta = JSON.parse(participant.metadata);
          if (meta.name) name = meta.name;
          if (meta.displayName) name = meta.displayName;
        } catch {
          // ignore bad JSON
        }
      }

      const finalName =
        name === 'user' || name === 'identity' || name.trim() === '' ? 'Sam' : name;

      setDisplayName(finalName);
    };

    updateName();
    participant.on(ParticipantEvent.NameChanged, updateName);
    participant.on(ParticipantEvent.MetadataChanged, updateName);

    return () => {
      participant.off(ParticipantEvent.NameChanged, updateName);
      participant.off(ParticipantEvent.MetadataChanged, updateName);
    };
  }, [participant]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="
        absolute top-4 left-4 z-40 flex items-center gap-3
        rounded-2xl border border-fuchsia-500/50 bg-slate-950/80
        px-3 py-2 pr-5 backdrop-blur-xl
        shadow-[0_0_35px_rgba(236,72,153,0.55)]
      "
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-fuchsia-400/70 shadow-[0_0_18px_rgba(236,72,153,0.9)]">
        <MicIcon />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-semibold tracking-[0.18em] text-fuchsia-300/80">
          Challenger
        </span>
        <span className="text-sm font-extrabold text-slate-50 leading-none tracking-wide">
          {displayName}
        </span>
      </div>
    </motion.div>
  );
}

interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const { localParticipant } = useLocalParticipant();
  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      className="relative z-10 h-full w-full overflow-hidden bg-[#020617]"
      {...props}
    >
      {/* === ARENA BACKDROP === */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 select-none overflow-hidden"
      >
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Neon spotlights */}
        <div className="absolute -top-40 left-[-10%] h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute -bottom-40 right-[-10%] h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-30%] h-72 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Floating arena icons */}
        <FloatingIcon className="top-[12%] left-[8%] h-10 w-10 -rotate-12">
          <LightningIcon />
        </FloatingIcon>
        <FloatingIcon className="top-[18%] right-[12%] h-9 w-9 rotate-6 text-fuchsia-300">
          <StarIcon />
        </FloatingIcon>
        <FloatingIcon className="bottom-[16%] left-[14%] h-14 w-14 rotate-[-10deg] text-purple-300">
          <CrowdIcon />
        </FloatingIcon>
        <FloatingIcon className="bottom-[28%] right-[18%] h-11 w-11 rotate-12 text-cyan-300">
          <MicIcon />
        </FloatingIcon>
      </div>

      {/* Challenger badge */}
      <PlayerBadge participant={localParticipant} />

      {/* === CHAT TRANSCRIPT (right-side arena panel) === */}
      <div
        className={cn(
          'fixed inset-0 grid grid-cols-1 grid-rows-1',
          !chatOpen && 'pointer-events-none',
        )}
      >
        <Fade top className="absolute inset-x-4 top-0 h-40" />

        <ScrollArea
          ref={scrollAreaRef}
          className="px-4 pt-40 pb-[150px] md:px-6 md:pb-[180px]"
        >
          <ChatTranscript
            hidden={!chatOpen}
            messages={messages}
            className={cn(
              'ml-auto mr-0 md:mr-12 max-w-lg space-y-3',
              'bg-slate-950/80 border border-slate-700/60 rounded-3xl px-4 py-3',
              'shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl transition-opacity duration-300 ease-out',
            )}
          />
        </ScrollArea>
      </div>

      {/* === CENTER STAGE / AGENT VISUALS === */}
      <TileLayout chatOpen={chatOpen} />

      {/* === BOTTOM CONTROL BAR (arena console) === */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}

        <div className="relative ml-auto mr-0 md:mr-4 max-w-lg pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/90 px-3 py-2 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
          </div>
        </div>
      </MotionBottom>
    </section>
  );
};
