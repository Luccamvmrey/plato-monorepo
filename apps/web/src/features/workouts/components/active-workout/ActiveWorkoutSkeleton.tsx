import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

/** Header + barra de progresso + o card do exercício ativo. */
export const ActiveWorkoutSkeleton = () => (
    <PageSkeleton>
        <div className="flex items-center gap-3 py-2">
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>

        <Skeleton className="h-2 w-full rounded-full" />

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4 mt-1">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="size-7 rounded-md shrink-0" />
            </div>

            <div className="flex gap-3">
                <Skeleton className="h-[58px] flex-1 rounded-md" />
                <Skeleton className="h-[58px] flex-1 rounded-md" />
            </div>

            <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-11 flex-1 rounded-md" />
                ))}
            </div>

            <Skeleton className="h-[52px] w-full rounded-lg" />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-5 w-2/5" />
        </div>
    </PageSkeleton>
);

export default ActiveWorkoutSkeleton;
