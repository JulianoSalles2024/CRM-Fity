# Prompt: Análise Visual — Aba "Follow Up" em Configurações

## CONTEXTO

Você é um especialista em UI/UX premium para SaaS B2B. Analise visualmente a **aba Follow Up dentro de Configurações** do CRM-Fity.

- **Rota**: `/configuracoes` → aba lateral **"Follow Up"**
- **Componente**: `SettingsInactiveActions` — gerencia regras de follow-up automático por inatividade

## SEU OBJETIVO

Use a **skill de UX front-end** para navegar até a aba e capturar screenshots dos diferentes estados. Não analise código — apenas o que você vê no browser.

## ESTADOS A CAPTURAR

1. **Estado vazio** — sem nenhuma regra criada
2. **Com regras** — lista de follow-ups configurados
3. **Criando/editando** uma regra (abrir o formulário/modal)
4. **Card de Encerramento Automático** (seção abaixo das regras)

## O QUE ANALISAR

### Navegação até a aba
- O menu lateral de Configurações deixa claro que existe uma aba "Follow Up"?
- O ícone (raio/Zap) comunica o conceito de automação?

### Estado vazio
- A mensagem de estado vazio é clara e convida à ação?
- O botão "+ Follow Up" está em destaque suficiente?

### Lista de Regras
- Cada card de regra comunica bem: quando dispara, qual mensagem, em qual horário?
- O resumo do schedule (ex: "seg a sex, 8h–18h") está legível?
- Os botões de editar/deletar estão acessíveis sem poluir o visual?
- Há distinção visual clara entre regras ativas e desativadas?

### Formulário de Criação/Edição
- O fluxo de configurar uma regra é intuitivo?
- Os campos (delay, unidade, mensagem, horário permitido) estão bem organizados?
- Feedback de saving/erro está visível?

### Card de Encerramento Automático
- A seção está visualmente separada das regras de follow-up?
- O aviso "age após o último passo de follow-up" está claro?

### Consistência Visual
- Segue o padrão dark-mode do CRM?
- Os badges de status têm contraste adequado?
- Espaçamento e tipografia consistentes?

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

- ❌ NÃO modifique nenhum arquivo
- ❌ NÃO analise código
- ✅ Use a skill de UX front-end para navegar e capturar screenshots reais
