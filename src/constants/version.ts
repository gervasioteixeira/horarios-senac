export interface AppBuildInfo {
  /** Versão do package.json (ex: "1.1.0"). */
  version: string
  /** Hash curto do commit do build; vazio se o git não estava disponível. */
  commit: string
  /** Momento do build, ISO 8601. */
  builtAt: string
}

/** Identifica a versão que está rodando no navegador — útil para suporte e para saber se a página está em cache. */
export const APP_BUILD: AppBuildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
}

/** Data/hora do build no fuso de Brasília, no formato dd/mm/aaaa hh:mm. */
export function formatBuildDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`
}

/** Texto curto do rodapé, ex: "Versão 1.1.0 · 21/09/2026 18:05". */
export function formatVersionLabel(info: AppBuildInfo): string {
  const date = formatBuildDate(info.builtAt)
  return [`Versão ${info.version}`, date].filter(Boolean).join(" · ")
}

/** Texto completo (tooltip), com o identificador do commit para conferência no suporte. */
export function formatVersionDetails(info: AppBuildInfo): string {
  const date = formatBuildDate(info.builtAt)
  const lines = [`Horários Senac — versão ${info.version}`]
  if (info.commit) lines.push(`Compilação: ${info.commit}`)
  if (date) lines.push(`Publicada em: ${date}`)
  return lines.join("\n")
}
