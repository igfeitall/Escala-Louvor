export const ROLE_OPTIONS = [
  'MINISTRO',
  'APOIO',
  'VIOLAO',
  'GUITARRA',
  'TECLADO',
  'BAIXO',
  'BATERIA',
] as const;

export type Role = (typeof ROLE_OPTIONS)[number];

export const ROLE_LABELS: Record<Role, string> = {
  MINISTRO: 'Ministro',
  APOIO: 'Apoio',
  VIOLAO: 'Violão',
  GUITARRA: 'Guitarra',
  TECLADO: 'Teclado',
  BAIXO: 'Baixo',
  BATERIA: 'Bateria',
};

export const SCHEDULING_ROLE_ORDER: Role[] = [
  'MINISTRO',
  'VIOLAO',
  'TECLADO',
  'BAIXO',
  'BATERIA',
  'GUITARRA',
  'APOIO',
];
