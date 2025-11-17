import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(inputs.filter(Boolean).join(' '))
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
