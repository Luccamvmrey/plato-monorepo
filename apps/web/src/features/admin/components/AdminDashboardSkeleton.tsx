import { Skeleton } from "@/components/ui/skeleton.tsx";

export const AdminDashboardSkeleton = () => (
    <div className="flex flex-col gap-3 mt-1" aria-hidden>
        <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-[104px] rounded-xl" />
            ))}
        </div>
        <Skeleton className="h-[290px] rounded-xl" />
        <Skeleton className="h-[240px] rounded-xl" />
    </div>
);
