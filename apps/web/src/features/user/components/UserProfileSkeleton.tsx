import { PageSkeleton, Skeleton } from "@/core/components/PageSkeleton.tsx";

const SectionSkeleton = ({ bodyClassName }: { bodyClassName: string }) => (
    <div className="mx-4 mb-4 bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className={bodyClassName} />
    </div>
);

/**
 * Cada seção do perfil já é guardada individualmente (`{profile && …}`), então o
 * gate bloqueante da página era redundante — só impedia o header estático e o
 * bloco de configurações de aparecerem enquanto as queries corriam.
 */
export const UserProfileSkeleton = () => (
    <PageSkeleton className="gap-0">
        <SectionSkeleton bodyClassName="h-24 w-full" />
        <SectionSkeleton bodyClassName="h-16 w-full" />
        <SectionSkeleton bodyClassName="h-28 w-full" />
        <SectionSkeleton bodyClassName="h-36 w-full" />
    </PageSkeleton>
);

export default UserProfileSkeleton;
