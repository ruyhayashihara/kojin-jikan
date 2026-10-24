---
name: マイ個人 (My Kojin / Keiro)
description: Gestão Fiscal, Apontamento de Horas e Declaração Tributária no Japão
colors:
  primary: "#1e3a8a"
  primary-hover: "#172554"
  primary-light: "#dbeafe"
  accent: "#0369a1"
  accent-hover: "#0284c7"
  accent-muted: "#e0f2fe"
  warning: "#b45309"
  warning-bg: "#fefce8"
  warning-border: "#fde68a"
  error: "#dc2626"
  error-bg: "#fef2f2"
  error-border: "#fca5a5"
  success: "#15803d"
  success-bg: "#f0fdf4"
  success-border: "#86efac"
  neutral-bg: "#eef2f6"
  neutral-surface: "#ffffff"
  neutral-text: "#0f172a"
  neutral-text-secondary: "#334155"
  neutral-text-muted: "#475569"
  border: "#cbd5e1"
  border-focus: "#2563eb"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.xl}"
    padding: "32px"
  input:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: マイ個人 (Keiro)

## Overview

**Creative North Star: "A Cabine de Comando Fiscal" (The Fiscal Flight Deck)**

O マイ個人 é uma central de comando de alta precisão desenhada para traduzir a complexidade contábil e fiscal do Japão em uma experiência ágil, estruturada e confiável. Construído para suportar fluxos intensivos de apontamento diário e fechamento mensal em lote de múltiplos trabalhadores, o sistema equilibra a densidade de métricas e tabelas com uma hierarquia visual cristalina, garantindo controle impecável para autônomos e gestores de empreiteiras.

A atmosfera visual é sóbria, corporativa e precisa. O design prioriza a segurança documental e o rigor técnico exigido pelas regras fiscais japonesas (確定申告, 領収書), rejeitando elementos puramente decorativos ou distrações cosméticas. Cada contraste, cada rótulo bilíngue (Português/Japonês) e cada separador de dados existe para assegurar leitura instantânea e eliminar qualquer risco de erro contábil ou preenchimento incorreto.

**Key Characteristics:**
- **Rigor Institucional**: Cores sóbrias e contrastes nítidos transmitem autoridade fiscal e segurança contábil.
- **Densidade Analítica Estruturada**: Grids responsivos de dados e cartões de resumo oferecem alta capacidade de informação sem sensação de aperto.
- **Precisão Bilíngue Contextual**: Integração fluida entre o português explicativo e termos fiscais em kanji/kana onde a nomenclatura oficial japonesa é indispensável.
- **Feedback Tátil Imediato**: Estados de foco, hover e validação conferem segurança ao operador a cada dado inserido.

## Colors

A paleta adota o padrão de alto contraste "Marinho Corporativo & Ardósia", combinando a solidez do Azul Marinho Profundo com neutros escuros nítidos e bordas estruturadas sobre um canvas cinza-azulado (`#eef2f6`), adaptando-se confortavelmente ao Modo Escuro.

### Primary
- **Marinho Corporativo** (`#1e3a8a` / hover `#172554`): Cor mestra de autoridade do sistema. Usada na marca, botão de ação principal (CTA), navegação ativa e destaques que exigem compromisso do usuário. Possui contraste de 11.2:1 sobre o fundo branco. No modo escuro, converte-se para `#818cf8`.

### Secondary
- **Azul Oceânico / Ciano Japonês** (`#0369a1` / hover `#0284c7`): Acento secundário de precisão analítica. Utilizado em títulos de seções documentais (`.rirekisho-card-title`), marcadores de categoria, badges de licença (`.badge-licenca-cat`) e horas noturnas (`.badge-noturno`), garantindo contraste de 5.5:1 no modo claro. No modo escuro, converte-se para `#38bdf8`.

### Tertiary
- **Âmbar Fiscal** (`#b45309` / fundo `#fefce8` / borda `#fde68a`): Sinalização de horas extras, atenção e status pendente com contraste de 5.5:1 no modo claro.
- **Verde Validação** (`#15803d` / dark `#4ade80`): Confirmação de horas fechadas, comprovantes validados por OCR e saldo líquido positivo.
- **Vermelho Alerta** (`#dc2626` / dark `#f87171`): Erros de validação, limites de cota e ações destrutivas (exclusão).

### Neutral
- **Névoa Estruturada** (`#eef2f6` / dark `#0f172a`): Superfície de fundo geral da aplicação (canvas), oferecendo corte visual imediato em relação aos cartões brancos.
- **Branco Puro** (`#ffffff` / dark `#1e293b`): Fundo de cartões, painéis, inputs e modais.
- **Preto Ardósia** (`#0f172a` / dark `#e2e8f0`): Texto principal de máxima legibilidade (16.5:1 no branco).
- **Ardósia Secundária** (`#334155` / dark `#94a3b8`): Metadados, labels e ícones inativos (9.5:1 no branco).
- **Ardósia Média** (`#475569` / dark `#64748b`): Labels auxiliares e dicas (6.3:1 - acima do padrão WCAG AA).
- **Borda Estrutural** (`#cbd5e1` / dark `#334155`): Contorno visível e nítido de cards, separadores de tabela e inputs.

### Named Rules
**The Fiscal Hierarchy Rule.** O Índigo Institucional é reservado para ações definitivas e estrutura de navegação primária; o Ciano Tóquio guia os olhos para dados operacionais e qualificações específicas. Nunca use cores de acento como simples preenchimento de fundo em áreas extensas.

**The Functional Color Rule.** Verde, âmbar e vermelho pertencem exclusivamente ao estado e à conformidade do dado fiscal (aprovado, pendente, irregular). É estritamente proibido usá-los com finalidade meramente estética.

## Typography

**Display Font:** 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif  
**Body Font:** 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif  
**Label/Mono Font:** 'Inter' (com variantes numéricas tabulares para valores monetários e horas)

**Character:** A tipografia Inter entrega legibilidade geométrica impecável, distinção nítida entre números (fundamental para cálculos de horas em formato 0.00 e ienes ¥) e excelente renderização de caracteres japoneses complementares.

### Hierarchy
- **Display** (700 weight, 1.875rem / 30px, line-height 1.2, letter-spacing -0.02em): Boas-vindas ao painel, páginas de autenticação e valores de faturamento total.
- **Headline** (700 weight, 1.5rem / 24px, line-height 1.25, letter-spacing -0.01em): Título principal de cada página no `.page-header h1`.
- **Title** (600 weight, 1.25rem / 20px, line-height 1.3): Títulos de cartões, cabeçalhos de modais e divisões principais de formulário.
- **Sub-Title / Section** (600 weight, 1.125rem / 18px, line-height 1.4): Subdivisões internas de blocos operacionais.
- **Body** (400 weight, 1rem / 16px, line-height 1.6): Texto padrão, orientações e campos de entrada de texto.
- **Label** (500 weight, 0.875rem / 14px, line-height 1.4): Rótulos de formulário, botões de ação e cabeçalhos de coluna de tabela.
- **Caption / Badge** (600 weight, 0.75rem / 12px, line-height 1.2): Badges de status, furigana e anotações monetárias complementares.

### Named Rules
**The Tabular Number Rule.** Em qualquer campo ou tabela exibindo valores em ienes (¥) ou contagem de horas decimais, os numerais devem manter alinhamento tabular estável para permitir escaneamento vertical sem oscilação óptica.

**The Bilingual Clarity Rule.** Sempre que um termo técnico japonês acompanhar um rótulo em português (ex: *Recibos (領収書)* ou *Trabalhadores (IDs)*), o texto em japonês deve ser tipograficamente discreto, atuando como confirmação oficial sem competir com o fluxo de leitura primário.

## Layout

O sistema adota um modelo de aplicação com navegação lateral fixa (Sidebar) e área de trabalho em tela cheia com contenção centralizada para leitura confortável:

- **Sidebar Fixa**: Largura padrão expandida de 240px; recolhível para 68px (modo compacto apenas com ícones). Transição suave de 300ms.
- **Contêiner de Página (`.page-container`)**: Largura máxima de 900px centralizada (`margin: 0 auto`) para formulários e painéis de configuração. Páginas de grade de dados e gestão em lote aproveitam a largura fluida do `.main-content` com padding de 32px (`--space-8`).
- **Sistema de Grades Responsivas**:
  - `form-grid-5`: 5 colunas para preenchimento ágil de licenças e qualificações em telas largas; colapsa para 3 colunas em ≤1100px, 2 colunas em ≤768px e 1 coluna em ≤600px.
  - `form-grid-4`: 4 colunas; colapsa para 2 colunas em ≤900px e 1 coluna em ≤600px.
  - `form-grid-2`: 2 colunas para campos emparelhados; colapsa para 1 coluna em ≤600px.
- **Mobile Top Bar**: Em telas móveis (≤768px), a sidebar se oculta em um gaveta lateral (drawer) sobreposta com backdrop escuro (`.sidebar-overlay`), enquanto uma barra superior fixa de 48px (`.mobile-topbar`) fornece acesso à marca e botão de menu hamburguer.

## Elevation & Depth

A elevação segue uma filosofia de **Cartões Elevados e Suaves**. Em vez de uma interface estritamente plana ou de sombras pesadas e escuras, a profundidade é estabelecida por uma suave sobreposição de camadas combinada com sombras difusas multidirecionais e contornos finos de borda:

### Shadow Vocabulary
- **Nível 1 - Superfície em Repouso (`--shadow-sm`)**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (dark: `rgba(0,0,0,0.3)`). Usado na base de cartões `.card` e painéis informativos para descolá-los do canvas.
- **Nível 2 - Elevação Interativa (`--shadow-md`)**: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`. Ativada no hover de botões primários e cartões clicáveis, acompanhada de micro-deslocamento tátil (`translateY(-1px)`).
- **Nível 3 - Painel Flutuante (`--shadow-lg`)**: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)`. Utilizado no contêiner de autenticação (`.auth-form`) e cartões de boas-vindas com destaque.
- **Nível 4 - Diálogos e Modais (`--shadow-xl`)**: `0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`. Modais de ativação de licença, wizards de importação e confirmações críticas.

### Named Rules
**The Tactile Lift Rule.** Elementos interativos de clique primário reagem fisicamente ao ponteiro: elevam-se 1px (`translateY(-1px)`) com expansão suave para `--shadow-md`. Elementos estáticos nunca recebem efeito de flutuação.

**The Border Anchor Rule.** Toda sombra em repouso deve ser acompanhada pela borda física estrutural (`1px solid var(--color-border)`). O contorno garante nitidez ótica tanto em monitores de alta fidelidade quanto em telas de baixo contraste.

## Shapes

- **Contornos e Raios**:
  - **Pequeno (`--radius-sm`, 6px)**: Badges de status, pills de contagem e botões compactos (`.btn-sm`).
  - **Médio (`--radius-md`, 8px)**: Botões padrão, campos de input, selects e cartões de item de licença.
  - **Grande (`--radius-lg`, 12px)**: Cartões especializados de seção (`.rirekisho-card`), caixas de alerta e agrupamentos secundários.
  - **Extra Grande (`--radius-xl`, 16px)**: Cartões principais de página (`.card`), formulários de autenticação e modais.
- **Borda de Identidade**: Elementos de qualificação técnica ou licença utilizam uma borda esquerda de 3px em Ciano Tóquio (`border-left: 3px solid #38bdf8`), ancorando o item visualmente à esquerda.

## Components

### Buttons
- **Shape**: Cantos arredondados médios (8px).
- **Primary (`.btn-primary`)**: Fundo Índigo Institucional (`#3730a3`), texto branco, padding de 12px 20px (`var(--space-3) var(--space-5)`). Em hover, escurece para `#312e81`, ganha sombra `--shadow-md` e sobe 1px.
- **Outline (`.btn-outline`)**: Fundo transparente, borda sutil (`--color-border`), texto ardósia secundária. Em hover, recebe preenchimento suave `#eef2ff` e borda índigo.
- **Small (`.btn-sm`)**: Versão compacta para tabelas e ações de linha (padding 4px 12px, texto 12px).
- **Disabled**: Opacidade reduzida a 0.6 e cursor `not-allowed`.

### Cards / Containers
- **Corner Style**: Raio generoso de 16px (`--radius-xl`).
- **Background**: Fundo branco puro em modo claro (`#ffffff`) e ardósia escura (`#1e293b`) em modo escuro.
- **Internal Padding**: 32px (`--space-8`) para cartões de página; 20px a 24px para blocos modulares internos.
- **Shadow & Border**: Borda de 1px (`--color-border`) e elevação basal `--shadow-sm`.

### Inputs / Form Fields
- **Style**: Altura confortável, padding interno 12px 16px, fundo `--color-surface`, borda de 1px sólida.
- **Focus**: Realce com borda Índigo Suave (`#818cf8`) e anel de foco difuso `0 0 0 3px rgba(129, 140, 248, 0.15)`.
- **Addon Wrapper (`.input-addon-wrapper`)**: Contêiner integrado para prefixos numéricos (como o símbolo monetário japonês `¥`), mantendo o prefixo estilizado como rótulo fixo não editável à esquerda do campo de texto.

### Badges & Status Pills
- **Style**: Padding compacto de 2px 8px, borda arredondada de 4px, tipografia 12px weight 600.
- **Categorias**:
  - Categoria Técnica: Fundo Ciano sutil `rgba(56, 189, 248, 0.12)`, texto `#7dd3fc`, borda suave ciano.
  - Aviso/Customizado: Fundo Âmbar sutil `rgba(245, 158, 11, 0.15)`, texto `#fbbf24`.
  - Sucesso: Fundo verde translúcido com texto verde forte.

### Navigation (Sidebar)
- **Item de Menu (`.sidebar-item`)**: Altura mínima de 40px, padding 8px 12px, raio de 8px.
- **Item Ativo (`.sidebar-item-active`)**: Fundo azul índigo claro (`#e0e7ff` / dark `rgba(129, 140, 248, 0.15)`), texto índigo destacado (`#3730a3` / dark `#818cf8`), peso 600.
- **Transição de Recolhimento**: Recolhe suavemente ocultando texto e mantendo ícones alinhados ao centro em 68px de largura.

## Do's and Don'ts

### Do:
- **Do** manter todos os inputs de valores monetários acompanhados pelo símbolo de iene (`¥`) via `.input-addon-wrapper`.
- **Do** utilizar numerais tabulares em tabelas de fechamento de horas e despesas para garantir leitura rápida e confiável.
- **Do** preservar as nomenclaturas fiscais oficiais em kanji/kana ao lado dos rótulos em português (ex: *Despesas (経費)*, *Declaração (確定申告)*).
- **Do** garantir que qualquer novo botão primário responda com o micro-deslocamento tátil de `-1px` e sombra `--shadow-md` ao passar o mouse.
- **Do** assegurar que todas as tabelas e formulários que excedam duas colunas colapsem graciosamente para coluna única em telas móveis (≤600px).

### Don't:
- **Don't** utilizar tons de roxo ou magenta saturado (estritamente vedado pelo protocolo de design e pelo propósito institucional sóbrio).
- **Don't** aplicar sombras pesadas e opacas de estilo vintage que poluam a tela ou concorram com os dados contábeis.
- **Don't** remover ou truncar termos fiscais japoneses indispensáveis para auditoria contábil.
- **Don't** criar cartões de dados com cantos retos (0px) ou chanfrados fora do padrão do sistema (`--radius-md` ou `--radius-xl`).
- **Don't** utilizar fontes genéricas de sistema divergentes da família Inter.
