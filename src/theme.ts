export const C = {
  bg: '#EFF9F9',
  card: '#FFFFFF',
  ink: '#3B2A4A',
  sub: '#8C7A9B',
  pink: '#1FA7A8',
  pinkSoft: '#CDEFEE',
  lilac: '#CDB8FF',
  mint: '#B8E8C8',
  mintDark: '#4FB58A',
  sky: '#CFE8FF',
  navy: '#2B2D52',
  sun: '#FFC46B',
  period: '#FF7A59',
  line: '#D3EAEA',
};

export const RISK_COLORS = ['#4FB58A', '#9ED8A8', '#FFC46B', '#FF9A6B', '#FF5A7A'];

export const FLOWS = [
  { id: 'spotting', name: 'Spotting', drops: 1 },
  { id: 'light', name: 'Light', drops: 1 },
  { id: 'medium', name: 'Medium', drops: 2 },
  { id: 'heavy', name: 'Heavy', drops: 3 },
] as const;
export type Flow = (typeof FLOWS)[number]['id'];
