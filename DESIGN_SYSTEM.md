# Plato — Design System
> Referência permanente para o Claude Code. Contém apenas decisões que se aplicam
> a qualquer tela, presente ou futura. Consulte antes de gerar qualquer componente.
>
> Stack: React · Tailwind CSS v4 · shadcn/ui · Framer Motion · Geist Variable
>
> Revisado em 04/11/2026, depois do redesenho das telas. Antes de criar um conceito na
> tela, procure como o app já o desenha e reaproveite o componente.

---

## 1. Filosofia

**Uma ferramenta, não um app de wellness.**
O Plato é usado com mãos suadas, sob luz intensa, com fadiga muscular. Cada decisão
deve responder a: *funciona com uma mão, em 2 segundos, sem pensar?*

**Hierarquia pela função, não pela decoração.**
Cores comunicam significado. Nunca use cor para "ficar bonito" — use para responder
"o que este elemento faz ou significa?".

**Moderação no uso de cor.**
Em qualquer tela, no máximo 2 cores de destaque simultâneas. O fundo zinc escuro é
o canvas — as cores de ação e status são os sinais.

**Flat por padrão.**
Sem gradientes decorativos, sem shadows excessivas, sem efeitos neon. Superfícies
limpas com bordas sutis.

---

## 2. Tokens de Cor — Semântica Obrigatória

| Token | Papel | Use para | Nunca use para |
|---|---|---|---|
| `primary` (azul) | Ação | CTAs, botões, foco de input, links | Badges informativos, status |
| `success` (verde) | Conclusão | Sets completos, finalizar treino, PRs salvos | Botões de ação em andamento |
| `pr` / `pr-subtle` (âmbar) | Conquista | Badges de recorde pessoal | Qualquer outro uso |
| `destructive` (vermelho) | Perigo | Deletar, ações irreversíveis | Alertas informativos |
| `muted-foreground` | Secundário | Metadados, labels, placeholders | Texto principal |

### Regra crítica: azul ≠ informação

`primary` é reservado para **ações que o usuário executa**.
Badges informativos usam seus próprios tokens — nunca `primary`.

**Exceções:** o texto que aponta o estado atual da rotação ("Próximo", "Em uso") e o
gráfico, que tem uma cor só (§7). Rótulos que só informam, como "Sugerido pelo Plato",
usam `muted-foreground`.

```tsx
// ✅ Correto
<Button>Iniciar</Button>                                   // azul — ação
<MuscleBadge group="CHEST" />                             // azul de chest, token próprio
<span className="badge-pr">PR</span>                      // âmbar — conquista

// ❌ Errado
<Badge className="bg-primary">Peito</Badge>               // badge usando cor de ação
<Badge className="bg-primary">ÚLTIMO REALIZADO</Badge>    // status usando cor de ação
```

---

## 3. Badges de Grupo Muscular

Cores agrupadas por função muscular. **Use o badge só onde ele identifica um exercício
sozinho**, nunca repetido em lista. Em gráficos e resumos, o nome do grupo é texto comum.

| Grupo (enum) | Classe CSS | Cor | Grupo funcional |
|---|---|---|---|
| `CHEST` | `badge-chest` | Azul | Push superior |
| `SHOULDERS` | `badge-shoulders` | Azul | Push superior |
| `TRICEPS` | `badge-triceps` | Azul | Push superior |
| `BACK` | `badge-back` | Verde | Pull superior |
| `LOWER_BACK` | `badge-lower-back` | Verde | Pull superior |
| `TRAPS` | `badge-traps` | Verde | Pull superior |
| `BICEPS` | `badge-biceps` | Teal | Braços pull |
| `FOREARMS` | `badge-forearms` | Teal | Braços pull |
| `QUADRICEPS` | `badge-quadriceps` | Vermelho | Inferior |
| `HAMSTRINGS` | `badge-hamstrings` | Vermelho | Inferior |
| `GLUTES` | `badge-glutes` | Vermelho | Inferior |
| `CALVES` | `badge-calves` | Vermelho | Inferior |
| `CORE` | `badge-core` | Âmbar | Trunk |
| `NECK` | `badge-neck` | Violeta | Isolado |

### Uso obrigatório — sempre via componente

O componente é `core/components/MuscleBadge.tsx`. Os nomes dos grupos vêm de
`muscleGroupTranslation`, em `core/utils/translations.ts`.

---

## 4. Tipografia

**Font:** Geist Variable — `font-sans` em todo o projeto.

### Níveis

| Nível | Especificação | Uso |
|---|---|---|
| Número | `text-[32px]` a `text-[40px] font-semibold tabular-nums` | O número principal da tela |
| Título de tela | `text-[24px] font-semibold tracking-[-0.03em]` | O `h1` de toda tela |
| Título de card | `text-[17px]` a `text-[20px] font-semibold tracking-[-0.02em]` | Nome do treino, do programa ou da seção |
| Corpo | `text-[14px]` | Exercícios, listas, descrições |
| Rótulo | `text-[13px] font-medium text-muted-foreground` | Rótulos em frase, metadados |
| Selo | `text-[11px] font-medium tracking-[0.04em] uppercase` | Só dentro de chips, como o selo de bi-set |

**Regras:**
- `font-semibold` é para títulos e números; `font-medium` para destaque em texto corrido. Nunca `font-bold`
- Rótulos são frases de 13px. Uppercase pequeno fica restrito aos selos
- Números que se comparam ou mudam usam `tabular-nums`
- Tracking negativo em títulos acima de 16px

---

## 5. Espaçamento e Radius

### Escala de radius (base `--radius: 0.75rem`)

| Token Tailwind | Valor | Uso |
|---|---|---|
| `rounded-sm` | 8px | Badges, chips, tags |
| `rounded-md` | 10px | Inputs, botões pequenos |
| `rounded-lg` | 12px | Cards padrão, botões primários |
| `rounded-xl` | 16px | Cards maiores |
| `rounded-2xl` | 20px | Modais, bottom sheets |
| `rounded-full` | 99px | Avatares, pills de filtro |

Nunca use valores arbitrários como `rounded-[10px]`. Sempre da escala acima.

### Bordas

```css
/* Card padrão */
border border-border rounded-xl

/* Input em repouso */
border border-border rounded-md

/* Input com foco */
focus:border-primary focus:ring-0    /* ring padrão shadcn desabilitado */

/* Card ativo / selecionado */
border-2 border-primary/40 rounded-xl
```

Nunca use `border-white`, `border-gray-*` ou cores hardcoded.

---

## 6. Padrões de Componente

### Headers de tela

Toda tela usa header inline sem card wrapper ou fundo próprio:

```tsx
// Tela raiz (tab)
<div className="flex flex-row items-center justify-between py-2">
  <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Título</h1>
  {/* ação opcional à direita */}
</div>

// Tela filha (push navigation) — com botão voltar
<div className="flex items-center gap-1 py-2">
  <Button variant="ghost" size="icon" className="rounded-full relative tap-target -ml-2" aria-label="Voltar">
    <ArrowLeft className="w-5 h-5" />
  </Button>
  <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Título</h1>
</div>
```

### Bi-sets e outros grupos

Um bi-set se lê igual em todo o app: o cabeçalho `ExerciseGroupChip` abre o grupo, e cada
membro mostra a posição (`1/2`) em `text-muted-foreground tabular-nums` antes do nome. Na
sessão, use `SessionGroupBadge`. Nunca marque um grupo com barra lateral ou cor própria.

### Bottom sheets

Bottom sheet usa `rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]`. Em escolhas
neutras, desligue o foco automático com `onOpenAutoFocus={(e) => e.preventDefault()}`, para
a primeira opção não parecer já selecionada.

### Botões principais

O botão principal da tela tem `h-[52px]`, como "Iniciar treino". Em formulários e rodapés
de edição, `h-12`.

### Footer fixo com CTA

```tsx
<div className="fixed bottom-0 inset-x-0 p-4 pb-6
                bg-background/95 backdrop-blur-sm border-t border-border">
  <Button className="w-full h-12 rounded-lg font-medium tracking-[-0.01em]">
    Ação Principal
  </Button>
</div>

// Container da tela deve ter pb-24 para não cortar conteúdo
```

### Filtros de grupo muscular (quando selecionados)

O filtro selecionado usa a cor do próprio grupo, não `primary`:

```tsx
// Selecionado
<button className={cn(
  "rounded-full px-3 py-1 text-[12px] font-medium",
  "bg-[var(--muscle-chest-bg)] text-[var(--muscle-chest)] border border-[var(--muscle-chest)]/30"
)}>Peito</button>

// "Todos" selecionado — único caso que usa muted
<button className="rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-[12px] font-medium">
  Todos
</button>
```

### Select de filtro — sempre shadcn

```tsx
// ✅ Correto
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-[130px] h-9 rounded-lg text-[13px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>

// ❌ Errado
<select>...</select>
```

### Estado vazio

```tsx
<div className="flex flex-col items-center justify-center flex-1 gap-3 px-8">
  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
    <IconeRelevante className="w-5 h-5 text-muted-foreground" />
  </div>
  <p className="text-[15px] font-medium text-foreground text-center">
    Título do estado vazio
  </p>
  <p className="text-[13px] text-muted-foreground text-center">
    Instrução do que fazer.
  </p>
</div>
```

---

## 7. Gráficos (Recharts)

### Cor — uma por gráfico

Todo gráfico usa `var(--color-primary)`, inclusive barras com `bg-primary`. Métricas
diferentes são abas do mesmo gráfico, não cores diferentes. Nada de cores de grupo muscular
em gráfico. Âmbar é só para recorde.

### Dados

Uma linha por sessão, não por série. O eixo Y parte do mínimo, porque com base em zero uma
progressão de 1 a 3% vira linha reta. Série do modo simples entra no gráfico de carga e
nunca nos de força ou volume.

### Gradiente de área — opacidade máxima 0.15

```tsx
<defs>
  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stopColor={color} stopOpacity={0.15} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </linearGradient>
</defs>
```

Nunca acima de 0.15. Sem gradientes de cor — apenas transparência.

### Estilo de eixos

```ts
const axisStyle = {
  tick:     { fontSize: 11, fill: 'var(--color-muted-foreground)' },
  axisLine: false,
  tickLine: false,
}
const chartMargin = { top: 8, right: 8, left: -16, bottom: 0 }
```

### Tooltip — sempre customizado

O tooltip padrão do Recharts tem fundo branco que quebra em dark mode.

```tsx
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-[13px] font-medium" style={{ color: p.color }}>
          {p.value.toFixed(1)} kg
        </p>
      ))}
    </div>
  )
}
```

### Dots

```tsx
dot={{ fill: color, strokeWidth: 0, r: 3 }}
activeDot={{ r: 5, strokeWidth: 0 }}
```

### Altura padrão: 160px

Nunca abaixo de 140px nem acima de 200px em mobile.

### Estado com menos de 3 pontos

```tsx
{data.length < 3 ? (
  <div className="h-[160px] flex flex-col items-center justify-center gap-2">
    <p className="text-[13px] text-muted-foreground text-center">
      Complete mais {3 - data.length} {3 - data.length === 1 ? 'sessão' : 'sessões'} para ver a evolução
    </p>
    <div className="flex gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn("w-2 h-2 rounded-full",
          i < data.length ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  </div>
) : (
  <ResponsiveContainer width="100%" height={160}>
    {/* gráfico */}
  </ResponsiveContainer>
)}
```

### Agrupamento de execuções históricas por data

Nunca repita a data em cada linha. Agrupe com label de seção:

```ts
const grouped = executions.reduce((acc, ex) => {
  const date = formatShortDate(ex.performedAt)
  const g = acc.find(g => g.date === date)
  if (g) g.sets.push(ex)
  else acc.push({ date, sets: [ex] })
  return acc
}, [] as { date: string; sets: typeof executions }[])
```

```tsx
{grouped.map(({ date, sets }) => (
  <div key={date}>
    <div className="px-4 py-2 bg-muted/40">
      <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-muted-foreground">
        {date}
      </p>
    </div>
    {sets.map((set, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3
                               border-b border-border/50 last:border-0">
        <span className="text-[13px] font-medium text-foreground w-20">
          {set.load}kg × {set.reps}
        </span>
        <span className="text-[12px] text-muted-foreground">RPE {set.rpe}</span>
        <span className="ml-auto text-[12px] text-muted-foreground">
          ~{set.e1rm.toFixed(1)} kg
        </span>
      </div>
    ))}
  </div>
))}
```

---

## 8. Animações (Framer Motion)

### Variantes reutilizáveis

```tsx
// Spring para elementos interativos
const spring = { type: "spring", stiffness: 400, damping: 28 }

// Ease para colapsos e expansões
const ease = { duration: 0.25, ease: [0.16, 1, 0.3, 1] }

// Stagger para entrada de listas e seções
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
}
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } }
}
```

### Quando usar cada padrão

| Situação | Padrão |
|---|---|
| Botão pressionado | `whileTap: { scale: 0.97 }` + `spring` |
| Lista ou seções entram na tela | `stagger` + `staggerItem` |
| Elemento colapsa / expande | `layout` prop + `ease` |
| Modal ou sheet abre | `initial: { y: 20, opacity: 0 }` + `ease` |
| Troca de exercício / tela filha | `initial: { opacity: 0, y: 8 }` + `ease` |

### O que nunca animar
- Mudanças de cor de texto
- Bordas
- Hover states — use `transition-opacity` ou `transition-colors` do Tailwind

---

## 9. Problemas Conhecidos — Não Repita

| Problema | ❌ Como era | ✅ Como deve ser |
|---|---|---|
| Badge de grupo usando primary | `bg-primary text-white` | `<MuscleBadge>` |
| Status em azul neon | `bg-primary` em badges informativos | `text-muted-foreground` |
| Filtros todos azuis ao selecionar | `bg-primary` | Cor do próprio grupo muscular |
| Border visível sempre no input | `border-primary` permanente | `border-border`, azul só no `:focus` |
| Select nativo de filtro | `<select>` HTML | `<Select>` shadcn |
| Ícone com fundo colorido único | `bg-blue-500 rounded-full` | `bg-muted rounded-lg` ou sem fundo |
| Borda esquerda colorida em cards | `border-l-4 border-primary` | `border border-border` |
| Header de tela filha em card | Card wrapper separado | Top bar compacta sem fundo próprio |
| `font-bold` | Peso 700 | `font-semibold` em títulos e números (§4) |
| Radius arbitrário | `rounded-[10px]` hardcoded | Sempre da escala de tokens |
| Arco-íris em gráfico | Uma cor por grupo muscular | Uma cor por gráfico, `primary` |
| Grupo inventado por tela | Barra lateral azul no bi-set | `ExerciseGroupChip` e posição `1/2` |
| Gradiente de área opaco | `stopOpacity` 0.4+ | Máximo 0.15 |
| Tooltip padrão Recharts | Fundo branco, quebra dark mode | `ChartTooltip` customizado |
| e1RM estimado em neon | `text-primary` com destaque | `text-muted-foreground` |
| Datas repetidas em execuções | "27 abr" em cada linha | Agrupado com label de seção |
| Gráfico com 1–2 pontos | Linha solta sem tendência | Estado condicional com aviso |
| Pluralização incorreta | "1 sets", "1 exercicios" | "1 set", "1 exercício" |

---

## 10. Checklist antes de commitar qualquer tela

**Identidade visual**
- [ ] Nenhum badge usa `bg-primary` ou `bg-blue-*`
- [ ] Badges de grupo usam `<MuscleBadge>` ou `badge-muscle badge-{grupo}`, só onde identificam um exercício sozinho
- [ ] Botões CTA usam `bg-primary`; fora eles, azul só nas exceções do §2 e nos gráficos
- [ ] Conceito que já existe no app reaproveita o componente (ex.: bi-set)
- [ ] Conclusões usam `bg-success-subtle` / `text-success`
- [ ] PRs usam `badge-pr` / tokens `--pr-*`

**Tipografia e layout**
- [ ] Tipografia segue os níveis do §4
- [ ] `h1` em `text-[24px] font-semibold`; nunca `font-bold`
- [ ] Radius sempre da escala de tokens
- [ ] Bordas sempre `border-border` — sem hardcode

**Componentes**
- [ ] Header de tela filha é top bar compacta — sem card wrapper
- [ ] Footer com CTA usa `fixed bottom-0` + `backdrop-blur-sm`
- [ ] Container da tela tem `pb-24` quando há footer fixo
- [ ] Filtros usam `<Select>` shadcn — sem `<select>` nativo
- [ ] Pluralização correta em português

**Gráficos**
- [ ] Uma cor por gráfico, `primary`
- [ ] Gradiente com `stopOpacity` máximo 0.15
- [ ] `ChartTooltip` customizado — sem tooltip padrão Recharts
- [ ] Gráfico com < 3 pontos mostra estado de aviso
- [ ] Execuções agrupadas por data com label de seção
- [ ] e1RM estimado em `text-muted-foreground`