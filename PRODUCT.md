# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Trabalhadores autônomos (自営業者 / Kojin Jigyousha)**: Estrangeiros no Japão (principalmente comunidade brasileira) que precisam registrar horas trabalhadas, digitalizar comprovantes, calcular despesas dedutíveis e organizar informações para a declaração de imposto de renda japonesa (Kakutei Shinkoku).
- **Gestores e Empreiteiras**: Responsáveis por gerenciar equipes de trabalhadores (via IDs), realizando apontamento de horas em lote, fechamentos mensais e exportação de folhas e relatórios em PDF.
- **Administradores**: Gestão de clientes, planos e chaves de licença de uso do sistema.

## Product Purpose

Oferecer um ecossistema completo em português para controle de horas, organização financeira e conformidade fiscal no Japão. O sistema elimina as barreiras de idioma e complexidade burocrática, permitindo que tanto o trabalhador independente quanto o gestor de equipe mantenham registros fidedignos, automatizem fechamentos e gerem relatórios aceitos para fins contábeis e fiscais.

## Positioning

A plataforma de gestão fiscal e de jornada mais completa para autônomos e empreiteiras brasileiras no Japão, combinando IA para leitura de comprovantes japoneses (OCR/classificação fiscal), cálculo automatizado de adicionais e exportação de documentos oficiais prontos para contabilidade e imigração.

## Operating Context

- Apontamento diário e fechamento mensal de horas normais e adicionais (noturnas, extras, feriados).
- Digitalização fotográfica de notas fiscais e recibos japoneses (領収書 / レシート) para dedução no imposto de renda.
- Fechamento em lote por gestores de fábrica/obra para múltiplos IDs de trabalhadores.
- Geração e download de relatórios mensais em PDF e preparação de dados para o Kakutei Shinkoku (確定申告).
- Controle de acesso e ativação de licenças por chave/dispositivo.

## Capabilities and Constraints

- **Capacidades Confirmadas**:
  - Autenticação e persistência de dados em nuvem via Supabase.
  - Alternância de papéis e contexto de permissão: Autônomo, Gestor e Administrador.
  - Painel de gestão de múltiplos trabalhadores e apontamento mensal em lote.
  - Leitura e categorização inteligente de recibos via IA/OCR (`ai-receipt.js`, `classify-desconto.js`).
  - Geração de folhas e declarações em PDF formatadas para padrões oficiais.
  - Sistema de licenças e ativações (`licencas-service.js`).
- **Restrições Técnicas**:
  - Aplicação Web SPA desenvolvida com Vite e JavaScript moderno (ES Modules).
  - Estilos em CSS nativo (Vanilla CSS) estruturado com tokens e variáveis.
  - Suporte responsivo (Desktop e Mobile Web).

## Brand Commitments

- **Nome**: マイ個人 (My Kojin / Kojin-Jikan).
- **Voz e Idioma**: Interface em Português (pt-BR) com termos fiscais e institucionais chave em Japonês kanji/kana onde for essencial para precisão oficial.

## Evidence on Hand

- Estrutura completa de páginas e fluxos em `src/pages/`.
- Serviços de inteligência de recibos e exportação PDF em `src/ai-receipt.js`, `src/pdf-export.js` e `src/rirekisho-pdf.js`.
- Mock data completo para testes em `src/mock-data.js`.

## Product Principles

1. **Clareza e Precisão Fiscal**: Traduzir a burocracia e as deduções fiscais japonesas em fluxos transparentes e intuitivos.
2. **Alta Eficiência de Apontamento**: Reduzir o tempo e o atrito necessários para apontar e consolidar horas diárias e em lote.
3. **Confiabilidade Documental**: Garantir que relatórios e PDFs exportados tenham formatação limpa, profissional e fiel aos dados reais.
4. **Respeito à Privacidade e Dados Sensíveis**: Tratar horas, rendimentos e recibos de despesas com estrita separação de dados por usuário e controle de papéis.
