'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// Constants
const THEME_STORAGE_KEY = 'theme-preference';
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

// Minified script to prevent FOUC (Flash of Unstyled Content)
const THEME_SCRIPT = `
  (function() {
    try {
      const doc = document.documentElement;
      const localTheme = localStorage.getItem("${THEME_STORAGE_KEY}");
      const systemTheme = window.matchMedia("${THEME_MEDIA_QUERY}").matches ? "dark" : "light";
      
      doc.classList.remove("light", "dark");
      
      if (localTheme === "dark" || (!localTheme && systemTheme === "dark") || (localTheme === "system" && systemTheme === "dark")) {
        doc.classList.add("dark");
      } else {
        doc.classList.add("light");
      }
    } catch (e) {}
  })();
`
  .replace(/\n/g, '')
  .replace(/\s+/g, ' ');

export type ThemeMode = 'dark' | 'light' | 'system';

export function ApplyThemeScript() {
  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode | undefined>(undefined);

  // 1. Initialize state on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    setTheme(stored ?? 'system');
  }, []);

  // 2. Listen for system changes when mode is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const handleChange = () => {
      const doc = document.documentElement;
      doc.classList.remove('light', 'dark');
      doc.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const updateTheme = (newTheme: ThemeMode) => {
    const doc = document.documentElement;

    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setTheme(newTheme);

    doc.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia(THEME_MEDIA_QUERY).matches
        ? 'dark'
        : 'light';
      doc.classList.add(systemTheme);
    } else {
      doc.classList.add(newTheme);
    }
  };

  // Skeleton while mounting (prevents hydration mismatch)
  if (!theme)
    return (
      <div
        className={cn(
          'h-9 w-28 rounded-full bg-slate-900/60 border border-slate-700/60',
          className,
        )}
      />
    );

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-1 rounded-full',
        'border border-fuchsia-500/50 bg-slate-950/80 px-1 py-1',
        'shadow-[0_0_24px_rgba(236,72,153,0.65)] backdrop-blur-xl',
        className,
      )}
      role="radiogroup"
      aria-label="Theme toggle"
    >
      <ThemeButton
        mode="light"
        current={theme}
        onClick={() => updateTheme('light')}
        icon={<Sun weight={theme === 'light' ? 'fill' : 'bold'} />}
        label="Light"
      />
      <ThemeButton
        mode="system"
        current={theme}
        onClick={() => updateTheme('system')}
        icon={<Monitor weight={theme === 'system' ? 'fill' : 'bold'} />}
        label="System"
      />
      <ThemeButton
        mode="dark"
        current={theme}
        onClick={() => updateTheme('dark')}
        icon={<Moon weight={theme === 'dark' ? 'fill' : 'bold'} />}
        label="Arena"
      />
    </div>
  );
}

// Sub-component for cleaner render logic
function ThemeButton({
  mode,
  current,
  onClick,
  icon,
  label,
}: {
  mode: ThemeMode;
  current: ThemeMode;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const isActive = current === mode;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={`Switch to ${label} theme`}
      onClick={onClick}
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500',
        isActive
          ? [
              'bg-gradient-to-br from-fuchsia-500 via-pink-500 to-cyan-400',
              'text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.85)]',
            ]
          : [
              'text-slate-400 hover:text-slate-50',
              'hover:bg-slate-800/70',
            ],
      )}
    >
      <span className="z-10 text-base">{icon}</span>
      {/* faint glow ring when active */}
      {isActive && (
        <span className="pointer-events-none absolute inset-[-6px] rounded-full border border-cyan-300/60 opacity-60" />
      )}
    </button>
  );
}
