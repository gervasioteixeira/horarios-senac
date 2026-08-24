/**
 * Formatação de datas para exibição na interface (pt-BR, dd/mm/aaaa).
 * As datas de negócio são sempre armazenadas/calculadas como string ISO
 * "YYYY-MM-DD" (ver calendarEngine.ts) — este util só converte para o
 * formato de exibição. Nunca mostrar a string ISO crua na UI.
 */
export function formatDateBr(iso: string): string
export function formatDateBr(iso: string | null): string | null
export function formatDateBr(iso: string | null): string | null {
  if (!iso) return iso
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}
