/**
 * Preset Educational School Logos / Badges
 * Formatted as SVG Data URLs for instant offline rendering and favicon usage
 */

export interface PresetLogo {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

export const PRESET_SCHOOL_LOGOS: PresetLogo[] = [
  {
    id: 'crest-gold-book',
    name: 'درع التميز والكتاب',
    description: 'درع أكاديمي مذهب يتوسطه كتاب مفتوح ونجمة المعرفة',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#bg)"/>
        <!-- Shield Border -->
        <path d="M50 14 C68 14, 82 22, 82 36 C82 62, 50 86, 50 86 C50 86, 18 62, 18 36 C18 22, 32 14, 50 14 Z" fill="none" stroke="url(#gold)" stroke-width="3.5"/>
        <!-- Star -->
        <polygon points="50,22 53,28 60,29 55,34 56,41 50,38 44,41 45,34 40,29 47,28" fill="url(#gold)"/>
        <!-- Open Book -->
        <path d="M50 48 Q36 44 26 49 L26 67 Q36 62 50 66 Q64 62 74 67 L74 49 Q64 44 50 48 Z" fill="url(#gold)" stroke="#0f172a" stroke-width="1.5"/>
        <line x1="50" y1="48" x2="50" y2="66" stroke="#0f172a" stroke-width="2"/>
        <!-- Laurel branches -->
        <circle cx="50" cy="74" r="2.5" fill="url(#gold)"/>
      </svg>
    `)}`,
  },
  {
    id: 'falcon-crest',
    name: 'الصقر الذهبي والراية',
    description: 'شعار الصقر الشامخ رمز القوة والأصالة والنجاح',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="falconBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="100%" stop-color="#022c22"/>
          </linearGradient>
          <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="60%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#falconBg)"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gold2)" stroke-width="3" stroke-dasharray="2 1"/>
        <!-- Stylized Falcon / Eagle Wings -->
        <path d="M50 25 L58 35 L75 32 L64 45 L80 48 L62 58 L70 72 L50 62 L30 72 L38 58 L20 48 L36 45 L25 32 L42 35 Z" fill="url(#gold2)"/>
        <!-- Center Shield -->
        <ellipse cx="50" cy="50" rx="10" ry="14" fill="#022c22" stroke="url(#gold2)" stroke-width="2"/>
        <circle cx="50" cy="46" r="4" fill="url(#gold2)"/>
        <path d="M46 54 Q50 58 54 54" stroke="url(#gold2)" stroke-width="2" fill="none"/>
      </svg>
    `)}`,
  },
  {
    id: 'torch-knowledge',
    name: 'شعلة العلم وسنابل النور',
    description: 'شعلة وهاجة ترمز لنور المعرفة وتربية الأجيال',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="torchBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4c1d95"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
          <linearGradient id="flame" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="50%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#eab308"/>
          </linearGradient>
          <linearGradient id="torchBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#torchBg)"/>
        <!-- Laurel Wreath -->
        <path d="M22 52 C20 70 34 82 50 84 C66 82 80 70 78 52" fill="none" stroke="url(#torchBody)" stroke-width="3" stroke-linecap="round"/>
        <!-- Torch Flame -->
        <path d="M50 16 C46 25 40 28 44 38 C46 41 50 43 50 43 C50 43 54 41 56 38 C60 28 54 25 50 16 Z" fill="url(#flame)"/>
        <!-- Inner Flame -->
        <path d="M50 26 C48 31 46 33 48 38 C49 39 50 40 50 40 C50 40 51 39 52 38 C54 33 52 31 50 26 Z" fill="#fef08a"/>
        <!-- Torch Holder -->
        <polygon points="42,43 58,43 54,64 46,64" fill="url(#torchBody)"/>
        <!-- Torch Handle -->
        <rect x="47" y="64" width="6" height="16" rx="2" fill="url(#torchBody)"/>
      </svg>
    `)}`,
  },
  {
    id: 'academic-cap',
    name: 'صرح التفوق والتخرج',
    description: 'قبعة التخرج وأعمدة الصرح الأكاديمي الشامخ',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="capBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="amberGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#capBg)"/>
        <!-- Outer Octagon / Badge -->
        <polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="none" stroke="url(#amberGold)" stroke-width="2.5"/>
        <!-- Mortarboard Diamond -->
        <polygon points="50,26 78,38 50,50 22,38" fill="url(#amberGold)"/>
        <!-- Cap Base -->
        <path d="M34 44 L34 56 C34 64 66 64 66 56 L66 44" fill="none" stroke="url(#amberGold)" stroke-width="3"/>
        <!-- Tassel -->
        <path d="M72 40 L76 56 C76 60 72 62 72 62" fill="none" stroke="#fef08a" stroke-width="2"/>
        <circle cx="72" cy="62" r="2" fill="#fef08a"/>
        <!-- Foundation Base -->
        <rect x="28" y="72" width="44" height="4" rx="2" fill="url(#amberGold)"/>
      </svg>
    `)}`,
  },
];
