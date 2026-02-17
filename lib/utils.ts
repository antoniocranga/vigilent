// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format Romanian currency
export function formatRON(value: number | null | undefined): string {
  if (!value) return 'N/A'
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format date in Romanian
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// Get risk score color
export function getRiskColor(score: number): string {
  if (score >= 85) return 'destructive' // red
  if (score >= 70) return 'warning' // orange
  if (score >= 50) return 'default' // yellow
  return 'secondary' // green/gray
}

// Get risk label
export function getRiskLabel(score: number): string {
  if (score >= 85) return 'Risc critic'
  if (score >= 70) return 'Risc ridicat'
  if (score >= 50) return 'Risc mediu'
  return 'Risc scăzut'
}

// Get severity color
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'destructive'
    case 'high': return 'warning'
    case 'medium': return 'default'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

// Romanian counties (judete)
export const JUDETE = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud',
  'Botoșani', 'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași',
  'Caraș-Severin', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița',
  'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
  'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș',
  'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu',
  'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea'
]

// CPV categories (simplified)
export const CPV_CATEGORIES = [
  { code: '45000000', name: 'Lucrări de construcții' },
  { code: '72000000', name: 'Servicii IT' },
  { code: '33000000', name: 'Echipamente medicale' },
  { code: '80000000', name: 'Servicii de educație' },
  { code: '85000000', name: 'Servicii de sănătate' },
  { code: '90000000', name: 'Servicii de salubritate' },
  { code: '60000000', name: 'Servicii de transport' },
  { code: '30000000', name: 'Echipamente IT' },
]