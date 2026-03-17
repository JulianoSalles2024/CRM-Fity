# Prompt: Análise Visual da Aba Perfil — CRM-Fity

## CONTEXTO

Você é um especialista em UI/UX premium para aplicações SaaS B2B. Você está analisando a **aba Perfil** do CRM-Fity, um CRM omnichannel dark-mode construído com React + Tailwind.

## SEU OBJETIVO

Use a **skill de UX front-end** disponível para analisar visualmente a aba Perfil. Abra o app no browser, navegue até a aba e capture screenshots dos diferentes estados.

## ESTADOS A CAPTURAR

1. **Modo leitura** — isEditing = false (estado padrão ao entrar na aba)
2. **Modo edição** — após clicar em "Editar"
3. **Formulário de senha** — após clicar em "Alterar Senha"

## O QUE ANALISAR

### Modo Leitura
- Sem os campos visíveis, as informações ficam escondidas demais?
- A única info visível é o nome no header — faz sentido ou deveria mostrar email/telefone de forma sutil?

### Modo Edição
- A transição de leitura → edição está suave e clara?
- Os ícones de cada campo (User, @, Phone) estão visualmente úteis?
- O formulário aparece de forma fluida ou corta abruptamente?

### Avatar
- O botão de câmera (hover) é descobrível?
- O botão de remoção (×) está bem posicionado?
- Quando fora do modo edição, o avatar parece clicável mesmo sendo bloqueado?

### Card de Segurança
- O toggle "Alterar Senha" é claro?
- A animação de abrir/fechar o formulário está fluida?

### Consistência Visual
- O badge de role (amber) combina com o design?
- Botões Salvar (sky) e Cancelar (slate) têm contraste adequado?
- Os cards têm a linha gradiente no topo visível?

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
- ❌ NÃO analise código — apenas o visual e a experiência no browser
- ✅ Use a skill de UX front-end para navegar e capturar screenshots reais
