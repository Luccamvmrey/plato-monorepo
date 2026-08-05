import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

/**
 * O bloqueio mais longo do app: `isLoading` aqui é o OR de três queries, e as
 * duas últimas só são habilitadas depois que a primeira resolve — uma cascata
 * serial. Um esqueleto vale mais aqui do que em qualquer outra tela.
 */
export const WorkoutSummarySkeleton = () => (
    <PageSkeleton className="pb-[184px]">
        <div className="pt-6 pb-4 px-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
        </div>

        <div className="px-4">
            <Skeleton className="h-16 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 pt-4">
            {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-2.5 w-3/5" />
                    <Skeleton className="h-6 w-4/5" />
                </div>
            ))}
        </div>

        <div className="flex flex-col gap-2 px-4 pt-6">
            {[0, 1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
        </div>

        <div className="px-4 pt-6">
            <Skeleton className="h-40 w-full rounded-xl" />
        </div>
    </PageSkeleton>
);

export default WorkoutSummarySkeleton;
