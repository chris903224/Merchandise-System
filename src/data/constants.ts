// src/data/constants.ts

/* ============================================
   COURSES / STRANDS
   Shared sa lahat ng forms: Settings, Profile, Checkout, Register
   ============================================ */

export interface CourseOption {
  value: string;  // Value saved sa DB
  label: string;  // Display text
}

export const COURSE_OPTIONS: CourseOption[] = [
  // College — CITE
  { value: 'BSIT', label: 'BS Information Technology' },
  { value: 'BSCS', label: 'BS Computer Science' },
  { value: 'BSIS', label: 'BS Information Systems' },

  // College — COED
  { value: 'BSED', label: 'Bachelor of Secondary Education' },
  { value: 'BEED', label: 'Bachelor of Elementary Education' },
  { value: 'BPED', label: 'Bachelor of Physical Education' },

  // College — CCJE
  { value: 'BSCRIM', label: 'BS Criminology' },

  // College — CMA
  { value: 'BSHM', label: 'BS Hospitality Management' },
  { value: 'BSTM', label: 'BS Tourism Management' },

  // College — BSA
  { value: 'BSA', label: 'BS Accountancy' },
  { value: 'BSMA', label: 'BS Management Accounting' },

  // College — BSBA
  { value: 'BSBA', label: 'BS Business Administration' },
  { value: 'BSBA-FM', label: 'BSBA — Financial Management' },
  { value: 'BSBA-MM', label: 'BSBA — Marketing Management' },

  // College — CAHS
  { value: 'BSN', label: 'BS Nursing' },
  { value: 'BSRT', label: 'BS Radiologic Technology' },
  { value: 'BSMT', label: 'BS Medical Technology' },
  { value: 'BSPH', label: 'BS Public Health' },

  // SHS — Strands
  { value: 'STEM', label: 'SHS — STEM' },
  { value: 'ABM', label: 'SHS — ABM' },
  { value: 'HUMSS', label: 'SHS — HUMSS' },
  { value: 'GAS', label: 'SHS — GAS' },
  { value: 'TVL', label: 'SHS — TVL' },
  { value: 'HE', label: 'SHS — Home Economics' },
  { value: 'ICT', label: 'SHS — ICT' },
];

/* ============================================
   HELPER — get label from value
   ============================================ */

export function getCourseLabel(value: string): string {
  const course = COURSE_OPTIONS.find((c) => c.value === value);
  return course?.label ?? value ?? '—';
}

/* ============================================
   YEAR LEVELS
   ============================================ */

export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
] as const;

/* ============================================
   BUILDINGS & ROOMS (for checkout)
   ============================================ */

export const BUILDINGS: Record<string, string[]> = {
  'Main Building': ['Supply Office', 'Cashier', 'Room 101', 'Room 102'],
  'SJCM Annex': ['Room 201', 'Room 202', 'Room 203'],
  'SHS Building': ['SHS Student Council Room', 'SHS Supply Office'],
};

export const BUILDING_NAMES = Object.keys(BUILDINGS); 