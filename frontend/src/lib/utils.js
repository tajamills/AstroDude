import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const getScoreColor = (score) => {
  if (score >= 81) return '#22C55E'; // green
  if (score >= 61) return '#F59E0B'; // gold
  if (score >= 41) return '#94A3B8'; // gray
  return '#EF4444'; // red
};

export const getScoreLabel = (score) => {
  if (score >= 81) return 'High Opportunity';
  if (score >= 61) return 'Good Day';
  if (score >= 41) return 'Neutral';
  return 'Low Energy';
};

export const getScoreBadgeClass = (score) => {
  if (score >= 81) return 'high';
  if (score >= 61) return 'good';
  if (score >= 41) return 'neutral';
  return 'low';
};

export const COLOR_MAP = {
  Red: '#EF4444',
  Orange: '#F97316',
  Yellow: '#EAB308',
  Green: '#22C55E',
  Teal: '#14B8A6',
  Blue: '#3B82F6',
  Navy: '#1E3A8A',
  Purple: '#A855F7',
  Pink: '#EC4899',
  White: '#F8FAFC',
  Silver: '#CBD5E1',
  Gold: '#F59E0B',
  Black: '#0F172A',
  Brown: '#A16207',
  Beige: '#D4A574',
  Terracotta: '#C2410C',
};

export const formatDate = (dateStr) => {
  // Parse date parts to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatShortDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};
