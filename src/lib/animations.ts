/**
 * Centralized Animation Variants for Framer Motion
 *
 * Single source of truth for all animation configs used across the app.
 * Import specific variants as needed: import { fadeIn, staggerChildren } from "@/lib/animations"
 */

import type { Variants, Transition } from "framer-motion";

/* ── Transitions ──────────────────────────────────────── */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

/* ── Fade ─────────────────────────────────────────────── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

/* ── Slide ────────────────────────────────────────────── */
export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.2 } },
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 24, transition: { duration: 0.2 } },
};

/* ── Scale ────────────────────────────────────────────── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springTransition },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

/* ── Stagger Children ─────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export const staggerFadeItem: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/* ── Alerts / Attention ───────────────────────────────── */
export const pulseAlert: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const shake: Variants = {
  idle: { x: 0 },
  shake: {
    x: [-4, 4, -3, 3, -2, 2, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

/* ── Page Transitions ─────────────────────────────────── */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

/* ── Card / Panel ─────────────────────────────────────── */
export const cardHover = {
  rest: { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: {
    scale: 1.01,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/* ── Drawer / Sheet ───────────────────────────────────── */
export const drawerFromRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};

export const drawerFromBottom: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};

/* ── Overlay / Backdrop ───────────────────────────────── */
export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
