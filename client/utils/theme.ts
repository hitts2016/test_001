// Design tokens for Closet app - warm organic style
export const colors = {
  primary: '#8B6F4E',
  primaryLight: '#C4A882',
  accent: '#5B8A72',
  accentLight: '#7DB89A',
  background: '#F7F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE8E1',
  textPrimary: '#2C2420',
  textSecondary: '#9B8B7A',
  textMuted: '#C4B8A8',
  border: '#E5DDD3',
  danger: '#D94F4F',
  warning: '#E8A849',
  success: '#5B8A72',
  white: '#FFFFFF',
  shadow: 'rgba(44, 36, 32, 0.08)',
  shadowDark: 'rgba(44, 36, 32, 0.15)',
};

export const clothingTypes: Record<string, string> = {
  tops: '上衣',
  pants: '裤子',
  skirts: '裙装',
  outerwear: '外套',
  dresses: '连衣裙',
  shoes: '鞋子',
  accessories: '配饰',
  other: '其他',
};

export const seasons: Record<string, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
  winter: '冬季',
  all: '四季',
};

export const typeIcons: Record<string, string> = {
  tops: 'shirt',
  pants: 'layers',
  skirts: 'award',
  outerwear: 'cloud',
  dresses: 'star',
  shoes: 'footprints',
  accessories: 'watch',
  other: 'grid',
};
