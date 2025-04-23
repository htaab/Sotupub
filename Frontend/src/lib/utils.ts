import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getImageUrl = (imagePath: string | undefined) => {
  if (!imagePath) return undefined;
  return `${import.meta.env.VITE_API_URL}${imagePath}`;
};