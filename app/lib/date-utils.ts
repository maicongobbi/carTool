/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA) de forma segura em relação a fusos horários.
 * Se a data vier do banco de dados (geralmente como string ISO no formato UTC "YYYY-MM-DDT00:00:00.000Z"),
 * usamos os métodos UTC para evitar que a diferença de fuso horário local a desloque para o dia anterior.
 */
export function formatLocalDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  // Se for uma string que contém informação de data/tempo e é no formato UTC
  if (typeof dateInput === 'string' && (dateInput.endsWith('Z') || dateInput.includes('T'))) {
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  // Caso contrário, formata usando o horário local
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata mês e ano de forma segura em relação a fusos horários para agrupamentos.
 */
export function formatMonthYear(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  if (typeof dateInput === 'string' && (dateInput.endsWith('Z') || dateInput.includes('T'))) {
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}
