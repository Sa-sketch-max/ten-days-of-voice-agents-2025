'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring',
  stiffness: 800,
  damping: 50,
  mass: 1,
};

const classNames = {
  grid: [
    'h-full w-full',
    'grid gap-x-4 place-content-center',
    'grid-cols-[1fr_1fr] grid-rows-[60px_1fr_60px]',
  ],
  agentChatOpenWithSecondTile: ['col-start-1 row-start-1', 'self-center justify-self-end'],
  agentChatOpenWithoutSecondTile: ['col-start-1 row-start-1', 'col-span-2', 'place-content-center'],
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  secondTileChatOpen: ['col-start-2 row-start-1', 'self-center justify-self-start'],
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant],
  );
  return trackRef;
}

/**
 * Arena-style waveform visualizer for the agent audio.
 */
const ECGVisualizer = ({
  trackRef,
  className,
}: {
  trackRef?: TrackReference;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trackRef?.publication?.track) return;

    const track = trackRef.publication.track;
    if (!track.mediaStreamTrack) return;

    const stream = new MediaStream([track.mediaStreamTrack]);
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Subtle dark grid
      ctx.save();
      ctx.strokeStyle = 'rgba(15,23,42,0.5)';
      ctx.lineWidth = 1;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Neon waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee'; // cyan-400
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#06b6d4'; // cyan-500 glow

      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [trackRef]);

  return <canvas ref={canvasRef} className={className} width={300} height={150} />;
};

interface TileLayoutProps {
  chatOpen: boolean;
}

export function TileLayout({ chatOpen }: TileLayoutProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
  const hasSecondTile = isCameraEnabled || isScreenShareEnabled;

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-8 bottom-32 z-50 md:top-12 md:bottom-40">
      <div className="relative mx-auto h-full max-w-4xl px-4 md:px-0">
        <div className={cn(classNames.grid)}>
          {/* === AGENT STAGE TILE === */}
          <div
            className={cn([
              'grid transition-all duration-500 ease-spring',
              !chatOpen && classNames.agentChatClosed,
              chatOpen && hasSecondTile && classNames.agentChatOpenWithSecondTile,
              chatOpen && !hasSecondTile && classNames.agentChatOpenWithoutSecondTile,
            ])}
          >
            <AnimatePresence mode="popLayout">
              {!isAvatar && (
                // Audio-only agent: waveform stage
                <MotionContainer
                  key="agent"
                  layoutId="agent"
                  initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                  animate={{
                    opacity: 1,
                    scale: chatOpen ? 1 : 1.2,
                    filter: 'blur(0px)',
                  }}
                  transition={{ ...ANIMATION_TRANSITION, delay: animationDelay }}
                  className={cn(
                    'relative overflow-hidden',
                    'bg-slate-950/90 backdrop-blur-xl',
                    'border border-cyan-400/50',
                    'shadow-[0_0_40px_rgba(8,145,178,0.6)]',
                    chatOpen
                      ? 'h-[60px] w-[60px] rounded-xl'
                      : 'h-[120px] w-[120px] rounded-2xl',
                  )}
                >
                  {/* inner gradient glow */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12)_0,_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(244,63,94,0.16)_0,_transparent_55%)]" />
                  <ECGVisualizer trackRef={agentAudioTrack} className="relative z-10 h-full w-full" />
                </MotionContainer>
              )}

              {isAvatar && (
                // Avatar agent: arena big-screen
                <MotionContainer
                  key="avatar"
                  layoutId="avatar"
                  initial={{
                    scale: 1,
                    opacity: 1,
                    maskImage: 'radial-gradient(circle, black 0%, transparent 0%)',
                  }}
                  animate={{
                    maskImage: chatOpen
                      ? 'radial-gradient(circle, black 100%, transparent 100%)'
                      : 'radial-gradient(circle, black 60%, transparent 70%)',
                    borderRadius: chatOpen ? 12 : 18,
                  }}
                  transition={{
                    ...ANIMATION_TRANSITION,
                    delay: animationDelay,
                    maskImage: { duration: 0.8 },
                  }}
                  className={cn(
                    'relative overflow-hidden',
                    'bg-slate-950 border border-fuchsia-500/50',
                    'shadow-[0_0_40px_rgba(236,72,153,0.7)]',
                    chatOpen
                      ? 'h-[60px] w-[60px]'
                      : 'h-auto w-full max-w-[420px] aspect-video',
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.18)_0,_transparent_60%)]" />
                  <VideoTrack
                    width={videoWidth}
                    height={videoHeight}
                    trackRef={agentVideoTrack}
                    className={cn(
                      'h-full w-full object-cover opacity-95',
                      'grayscale-[0.15] contrast-110',
                      chatOpen ? 'scale-110' : 'scale-[1.02]',
                    )}
                  />
                </MotionContainer>
              )}
            </AnimatePresence>
          </div>

          {/* === SECOND TILE: CAMERA / SCREEN SHARE === */}
          <div
            className={cn([
              'grid transition-all duration-500',
              chatOpen && classNames.secondTileChatOpen,
              !chatOpen && classNames.secondTileChatClosed,
            ])}
          >
            <AnimatePresence>
              {(cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled) ? (
                <MotionContainer
                  key="camera"
                  layout="position"
                  layoutId="camera"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ ...ANIMATION_TRANSITION, delay: animationDelay }}
                  className={cn(
                    'relative overflow-hidden',
                    'border border-slate-700/70 bg-slate-950/90',
                    'shadow-[0_0_28px_rgba(15,23,42,0.9)] backdrop-blur-xl',
                    'h-[60px] w-[60px] rounded-xl',
                  )}
                >
                  <VideoTrack
                    trackRef={cameraTrack || screenShareTrack}
                    width={
                      (cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0
                    }
                    height={
                      (cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0
                    }
                    className="h-full w-full object-cover grayscale-[0.05] contrast-110"
                  />
                  {/* Status LED */}
                  <div className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                </MotionContainer>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
