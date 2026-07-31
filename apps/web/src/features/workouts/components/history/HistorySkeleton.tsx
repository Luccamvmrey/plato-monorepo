import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

/**
 * Espelha `SessionHistoryCard` — que é um div solto com `mb-3`, não um `<Card>`,
 * e por isso se auto-espaça (o container do HistoryPage não tem gap).
 */
const SessionCardSkeleton = () => (
    <div className="bg-card border border-border rounded-xl p-4 mb-3">
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-12 shrink-0" />
        </div>

        <div className="flex gap-6 mb-3">
            {[0, 1].map(i => (
                <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-4 w-14" />
                </div>
            ))}
        </div>

        <div className="flex gap-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        <div className="border-t border-border mt-3 mb-3" />

        <div className="flex flex-col gap-3">
            {[65, 50, 58].map((width, i) => (
                <Skeleton key={i} className="h-3.5" style={{ width: `${width}%` }} />
            ))}
        </div>
    </div>
);

export const HistorySkeleton = () => (
    <PageSkeleton className="gap-0">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
    </PageSkeleton>
);

export default HistorySkeleton;
