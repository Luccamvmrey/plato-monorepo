import api from "@/core/api";
import type {
    AddSharedPlanResult,
    CreateShareLinkPayload,
    FeaturedPlan,
    OwnSharedLink,
    PublicSharedPlan,
} from "@/features/sharing/sharing.types.ts";

export const SharingService = {
    getPublic: async (token: string) => {
        const { data } = await api.get<PublicSharedPlan>(`/shares/public/${token}`);
        return data;
    },

    getFeatured: async () => {
        const { data } = await api.get<FeaturedPlan[]>("/shares/featured");
        return data;
    },

    add: async (token: string) => {
        const { data } = await api.post<AddSharedPlanResult>(`/shares/public/${token}/add`);
        return data;
    },

    create: async (payload: CreateShareLinkPayload) => {
        const { data } = await api.post<OwnSharedLink>("/shares", payload);
        return data;
    },

    getMine: async () => {
        const { data } = await api.get<OwnSharedLink[]>("/shares/mine");
        return data;
    },

    revoke: async (id: number) => {
        await api.delete(`/shares/${id}`);
    },
};
