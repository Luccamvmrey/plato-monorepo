import { useQuery } from "@tanstack/react-query";
import { SharingService } from "@/features/sharing/sharing.service.ts";

const FIVE_MINUTES = 5 * 60 * 1000;

/** A lista muda só quando a curadoria publica, então não precisa revalidar a cada tela. */
export const useFeaturedPlans = () => {
    const featuredQuery = useQuery({
        queryKey: ["featured-plans"],
        queryFn: SharingService.getFeatured,
        staleTime: FIVE_MINUTES,
    });

    return {
        plans: featuredQuery.data ?? [],
        isLoading: featuredQuery.isLoading,
        hasError: featuredQuery.isError,
        hasPlans: (featuredQuery.data?.length ?? 0) > 0,
    };
};
