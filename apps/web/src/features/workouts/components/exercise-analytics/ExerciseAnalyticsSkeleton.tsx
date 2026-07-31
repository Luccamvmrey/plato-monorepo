import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

const CardSkeleton = ({ bodyClassName }: { bodyClassName: string }) => (
    <div className="mx-4 mb-4 bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className={bodyClassName} />
    </div>
);

/** A top bar é estática e já renderiza sozinha na página — aqui só o conteúdo. */
export const ExerciseAnalyticsSkeleton = () => (
    <PageSkeleton className="gap-0">
        <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-20 rounded-sm" />
        </div>

        <CardSkeleton bodyClassName="h-14 w-full" />
        <CardSkeleton bodyClassName="h-40 w-full" />
        <CardSkeleton bodyClassName="h-40 w-full" />
    </PageSkeleton>
);

export default ExerciseAnalyticsSkeleton;
