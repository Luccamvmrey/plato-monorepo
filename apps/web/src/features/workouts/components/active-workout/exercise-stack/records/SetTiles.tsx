import { motion } from "framer-motion";
import { Check, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type SetTilesProps = {
    total: number;
    done: number;
    /** Texto dos blocos ainda por fazer, como "10 reps". */
    repLabel: string;
    onDone?: () => void;
    onUndo?: () => void;
    compact?: boolean;
};

/** Duas fileiras a partir de 5 séries: abaixo de ~80px o bloco deixa de ser um alvo folgado. */
const columnsFor = (total: number) => (total <= 4 ? total : total <= 6 ? 3 : 4);

const PRESS = { scale: 0.96 };
const SPRING = { type: "spring", stiffness: 500, damping: 30 } as const;

/**
 * As séries do modo simplificado: cada bloco é uma série, e o próximo é o próprio botão.
 * Progresso e ação são a mesma coisa, então não há pontos nem botão separado para ler.
 */
const SetTiles = ({ total, done, repLabel, onDone, onUndo, compact }: SetTilesProps) => (
    <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columnsFor(total)}, minmax(0, 1fr))` }}
    >
        {Array.from({ length: total }).map((_, index) => {
            const number = index + 1;
            const isDone = index < done;
            const isNext = index === done && !!onDone;
            const canUndo = isDone && index === done - 1 && !!onUndo;

            const label = isNext
                ? `Concluir set ${number} de ${total}`
                : canUndo
                    ? `Desfazer set ${number}`
                    : isDone
                        ? `Set ${number} feito`
                        : `Set ${number}, ${repLabel}`;

            return (
                <motion.button
                    key={number}
                    type="button"
                    aria-label={label}
                    disabled={!isNext && !canUndo}
                    onClick={isNext ? onDone : canUndo ? onUndo : undefined}
                    whileTap={isNext || canUndo ? PRESS : undefined}
                    transition={SPRING}
                    className={cn(
                        "flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200",
                        compact ? "h-16" : "h-[88px]",
                        isDone && "bg-success/15 text-success-subtle-fg",
                        isNext && "bg-primary text-primary-foreground",
                        !isDone && !isNext && "bg-muted text-muted-foreground"
                    )}
                >
                    {/* Altura fixa: ícone e número ocupam o mesmo espaço, senão a legenda
                        do bloco feito fica desalinhada da dos vizinhos. */}
                    <span className={cn("flex items-center justify-center", compact ? "h-6" : "h-9")}>
                        {isDone ? (
                            <motion.span
                                key="done"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={SPRING}
                            >
                                <Check className={compact ? "size-5" : "size-8"} strokeWidth={2.5} />
                            </motion.span>
                        ) : (
                            <span className={cn(
                                "font-semibold tabular-nums tracking-[-0.03em] leading-none",
                                compact ? "text-[22px]" : "text-[32px]"
                            )}>
                                {number}
                            </span>
                        )}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-medium leading-tight mt-1">
                        {canUndo && <Undo2 className="size-3" />}
                        {isNext ? "Concluir" : canUndo ? "desfazer" : isDone ? "feito" : repLabel}
                    </span>
                </motion.button>
            );
        })}
    </div>
);

export default SetTiles;
