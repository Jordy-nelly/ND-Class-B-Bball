'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface MediaQueryState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  isHydrated: boolean;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export function useMediaQuery(): MediaQueryState {
  const [state, setState] = useState<MediaQueryState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    breakpoint: 'desktop',
    isHydrated: false,
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.mobile) {
        setState({
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          breakpoint: 'mobile',
          isHydrated: true,
        });
      } else if (width < BREAKPOINTS.tablet) {
        setState({
          isMobile: false,
          isTablet: true,
          isDesktop: false,
          breakpoint: 'tablet',
          isHydrated: true,
        });
      } else {
        setState({
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          breakpoint: 'desktop',
          isHydrated: true,
        });
      }
    };

    // Set initial state
    updateState();

    // Listen for resize
    window.addEventListener('resize', updateState);
    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

// Hook for checking specific breakpoints
export function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl'): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const breakpoints = {
      sm: '(min-width: 640px)',
      md: '(min-width: 768px)',
      lg: '(min-width: 1024px)',
      xl: '(min-width: 1280px)',
    };

    const query = window.matchMedia(breakpoints[breakpoint]);
    setMatches(query.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}

// Hook for detecting reduced motion preference
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// Hook for detecting system dark mode preference
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(query.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return isDark;
}
