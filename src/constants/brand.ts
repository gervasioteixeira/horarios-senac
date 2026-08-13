/**
 * Paleta de cores institucionais do SENAC, usada de forma sutil na
 * interface (bordas de destaque, item de menu ativo, botões primários)
 * para reforçar o reconhecimento visual de que o sistema é do SENAC,
 * sem sobrecarregar a UI com blocos grandes de cor.
 *
 * Valores extraídos diretamente dos pixels de `public/senac-logo.png`
 * (não são um "chute" visual) — ambos passam WCAG AA para texto branco
 * sobre o fundo (ver conferência de contraste feita ao implementar).
 */
export const BRAND_COLORS = {
  /** Azul principal da marca — usado como cor de destaque/ação primária. */
  blue: "#0050a0",
  /** Variante mais clara do azul, usada em vez do azul principal no tema escuro (melhor contraste sobre fundo escuro). */
  blueDark: "#1a6fc4",
  /** Tom mais escuro do azul, usado em :hover de botões no tema claro. */
  blueHover: "#003d7a",
  /** Laranja da marca — usado apenas como traço fino de acento (nunca como fundo de texto; contraste insuficiente para isso). */
  orange: "#f89020",
} as const
