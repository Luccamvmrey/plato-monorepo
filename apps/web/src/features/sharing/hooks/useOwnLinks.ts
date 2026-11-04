import { useQuery } from "@tanstack/react-query";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { SharingService } from "@/features/sharing/sharing.service.ts";
import { buildShareUrl, copyShareUrl } from "@/features/sharing/utils/share-link.ts";

export const useOwnLinks = () => {
    const linksQuery = useQuery({
        queryKey: ["shared-links"],
        queryFn: SharingService.getMine,
    });

    const revokeMutation = useAppMutation({
        mutationFn: SharingService.revoke,
        invalidateQueries: [["shared-links"]],
    });

    return {
        links: linksQuery.data ?? [],
        isLoading: linksQuery.isLoading,
        isRevoking: revokeMutation.isPending,
        handleCopy: (token: string) => void copyShareUrl(buildShareUrl(token)),
        handleRevoke: (id: number) => revokeMutation.mutate(id),
    };
};
