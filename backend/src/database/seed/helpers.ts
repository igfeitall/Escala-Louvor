/**
 * Helpers reutilizáveis para as seeds.
 */

/**
 * Normaliza um nome para uso como normalized_name.
 * - lowercase
 * - remove acentos
 * - trim
 * - remove espaços duplicados
 *
 * @example normalizeName("João Silva") // "joao silva"
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .toLowerCase()
    .replace(/\s+/g, ' '); // colapsa espaços duplicados
}
