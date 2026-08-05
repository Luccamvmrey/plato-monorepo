import type { PropsWithChildren } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

/**
 * Antes, todo carregamento do app era o mesmo `LoadingOverlay`: `fixed inset-0
 * z-[100]` com blur, cobrindo a tela inteira. Além de brusco, ele mentia — em
 * `/workouts` o overlay renderizava *por cima* da lista, que nesse momento já
 * tinha decidido que estava vazia, então "Crie seu primeiro treino" piscava
 * atrás do blur em todo carregamento.
 *
 * O wrapper existe para o leitor de tela: o esqueleto em si é decorativo
 * (`aria-hidden` nos filhos via CSS não dá, então marcamos aqui), e quem anuncia
 * é o `role="status"`.
 */
export const PageSkeleton = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
    <div
        role="status"
        aria-busy="true"
        aria-label="Carregando"
        className={cn("flex flex-col gap-3", className)}
    >
        <div aria-hidden="true" className="contents">
            {children}
        </div>
    </div>
);

/** Linha de texto. `w` é a fração da largura, para as linhas não saírem todas iguais. */
export const SkeletonLine = ({ className }: { className?: string }) => (
    <Skeleton className={cn("h-4 w-full", className)} />
);

export { Skeleton };
