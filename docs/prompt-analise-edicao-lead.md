# Prompt: Análise Visual — Modal de Edição de Lead

## CONTEXTO

Você é um especialista em UI/UX premium para SaaS B2B. Analise visualmente o **Modal de Edição de Lead** do CRM-Fity.

- **Componente**: `CreateEditLeadModal.tsx`
- **Gatilho**: Ocorre ao clicar em um lead no Kanban ou na Lista de Leads.

## SEU OBJETIVO

Use a **skill de UX front-end** para abrir o modal no browser e capturar screenshots. Analise a experiência visual e de uso, sem tocar no código e sem alterar regras de negócio.

## ESTADOS A CAPTURAR

1. **Modal de Edição** — aberto com um lead carregado.
2. **Dropdown de Tags** — aberto ao clicar em "+ Adicionar".
3. **Validação/Erro** — (opcional) tentar salvar com campos obrigatórios vazios.
4. **Confirmação de Saída** — tentar fechar o modal após alterar um campo sem salvar.

## O QUE ANALISAR

### Layout & Estrutura
- O modal utiliza bem o espaço? (é um `max-w-2xl`).
- A hierarquia entre Título ("Editar Lead") e Subtítulo é clara?
- O grid de campos (Nome ocupando largura total, outros em colunas) está equilibrado?

### Campos & Input
- Os campos do `ui.input` têm contraste e espaçamento interno (padding) adequados no dark mode?
- O asterisco vermelho de obrigatoriedade está em harmonia com o design?
- A máscara de telefone está funcionando visualmente sem "pular" o texto?

### Elementos Específicos
- **Estágio**: A bolinha de cor (`selectedColumnColor`) está bem alinhada dentro do select?
- **Tags**: As "pills" coloridas das tags estão com boa leitura? O botão de remover (X) está fácil de clicar?
- **Seletor de Origem/Grupo**: Os dropdowns seguem o estilo premium do restante do app?

### Rodapé & Ações
- O contraste entre os botões "Cancelar" e "Salvar Alterações" está correto?
- O botão de fechar (X no topo) é fácil de encontrar?

### Feedback de Saída
- O modal de confirmação ("Descartar alterações?") é visualmente consistente com o CRM?

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
