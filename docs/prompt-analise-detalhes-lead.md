# Prompt: Análise Visual — Modal de Detalhes do Lead (Detalhes/Visão Geral)

## CONTEXTO

Você é um especialista em UI/UX premium para SaaS B2B. Analise visualmente o **Modal de Detalhes do Lead** (Slideover/Overview) do CRM-Fity.

- **Componente**: `LeadDetailSlideover.tsx`
- **Gatilho**: Abre ao clicar em um lead no Kanban ou na Lista, **antes** de abrir o formulário de edição completo.

## SEU OBJETIVO

Use a **skill de UX front-end** para abrir o modal no browser (clicando em qualquer lead) e capturar screenshots. Analise a experiência visual e de uso sem tocar no código e sem alterar regras.

## ESTADOS A CAPTURAR

1. **Visão Geral (Aba Timeline)** — o estado inicial ao abrir o lead.
2. **Navegação de Pipeline** — focar nos botões de estágios no topo do modal.
3. **Aba Playbook** — visualizar o acompanhamento de cadência.
4. **Interação de Tags** — adicionar ou remover uma tag na sidebar.
5. **Aba em Branco** — visualizar o estado "Em breve" nas abas IA Insights ou Produtos.

## O QUE ANALISAR

### Layout & Estrutura
- O modal (`max-w-5xl`) utiliza bem o espaço de tela larga?
- A separação entre Header, Sidebar esquerda e Área Principal está equilibrada?
- O header com o Valor do Lead em destaque (`text-sky-400 text-xl font-bold`) traz o impacto correto?

### Navegação de Pipeline (Topo)
- Os botões de estágios (bolinhas e títulos) são fáceis de clicar?
- Fica claro qual é o estágio atual vs estágios passados vs futuros?
- A linha conectora entre estágios ajuda ou polui o visual?

### Sidebar (Dados do Lead)
- A seção de contato (Avatar + Nome + Badge CLIENTE) está legível?
- As informações de Prioridade, Data e Probabilidade têm boa hierarquia visual?
- A funcionalidade de adicionar Tags diretamente pela sidebar é intuitiva?

### Área de Abas & Timeline
- As abas superiores têm feedback visual claro de qual está ativa?
- O campo de "Escrever uma nota" na Timeline parece amigável para digitação rápida?
- A lista de atividades (Timeline) está bem organizada cronologicamente?

### Botões de Ação
- O contraste e posicionamento dos botões (Editar, Reabrir, Excluir) estão de acordo com sua importância?
- O botão de fechar (X) está no lugar esperado?

### Consistência Visual
- Segue o padrão dark-mode premium do restante do sistema?
- O uso das cores (Sky para ações, Emerald para concluído, Slate para neutro) está coerente?

## FORMATO DA RESPOSTA

```
## Screenshots capturados
[descreva os estados capturados]

## Problemas encontrados
1. [Problema] — [Impacto no usuário]

## Oportunidades de melhoria (sem quebrar nada)
1. [Melhoria] — [Por que vale a pena]

## O que está funcionando bem
- ...

## Prioridade de implementação
- 🔴 Alta: ...
- 🟡 Média: ...
- 🟢 Nice to have: ...
```

## RESTRIÇÕES

- ❌ NÃO modifique nenhum arquivo.
- ❌ NÃO analise código — foque na experiência visual e de uso real no browser.
- ✅ Use a skill de UX front-end para capturar imagens reais.
