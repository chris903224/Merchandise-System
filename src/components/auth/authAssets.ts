// src/components/auth/authAssets.ts

import logo from '../../../image-assets/Logo.png';
import marqueeScrub from '../../../image-assets/marquee image 1.jpg';
import marqueeUniform from '../../../image-assets/marquee image 2.jpg';
import marqueeStudentLife from '../../../image-assets/marquee image 3.jpg';
import registerBackground from '../../../image-assets/register background photo.jpg';
import campusBackground from '../../../image-assets/campus.png';
import type { MarqueeItem } from './authTypes';

export const authAssets = {
  logo,
  registerBackground,
  campusBackground,
} as const;

export const marqueeItems: MarqueeItem[] = [
  {
    id: 'scrub',
    src: marqueeScrub,
    alt: 'Saint Jude College health science students wearing yellow scrubs',
  },
  {
    id: 'uniform',
    src: marqueeUniform,
    alt: 'Saint Jude College information technology polo uniform',
  },
  {
    id: 'student-life',
    src: marqueeStudentLife,
    alt: 'Saint Jude College students wearing green campus shirts',
  },
];