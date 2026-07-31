import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

/** Só cobre a busca do treino existente. Salvar não bloqueia mais a tela. */
export const WorkoutEditorSkeleton = () => (
    <PageSkeleton>
        <div className="flex items-center justify-between gap-3 py-2">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
        </div>

        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-[100px] w-full rounded-lg" />

        <div className="flex flex-col gap-2 mt-2">
            {[0, 1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
            ))}
        </div>

        <Skeleton className="h-14 w-full rounded-xl border-dashed" />
    </PageSkeleton>
);

export default WorkoutEditorSkeleton;
