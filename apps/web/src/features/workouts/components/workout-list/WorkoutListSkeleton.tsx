import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card.tsx";
import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

/** Espelha `WorkoutListItem`: header, 3 linhas de exercício e o rodapé de ações. */
const WorkoutCardSkeleton = () => (
    <Card className="bg-card shadow-none">
        <CardHeader className="pb-2">
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="h-3 w-3/5 mt-2" />
        </CardHeader>

        <CardContent className="flex flex-col gap-2.5 pb-2">
            {[70, 55, 62].map((width, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
                    <Skeleton className="h-3.5 w-10 shrink-0" />
                </div>
            ))}
        </CardContent>

        <CardFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-border/50">
            <div className="flex gap-2">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
        </CardFooter>
    </Card>
);

export const WorkoutListSkeleton = () => (
    <PageSkeleton className="gap-4">
        <WorkoutCardSkeleton />
        <WorkoutCardSkeleton />
        <WorkoutCardSkeleton />
    </PageSkeleton>
);

export default WorkoutListSkeleton;
