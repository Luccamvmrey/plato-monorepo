import {
    useMutation,
    type UseMutationOptions,
    useQueryClient,
    type QueryKey
} from "@tanstack/react-query";
import { toast } from "sonner";

interface AppMutationOptions<TData, TError, TVariables, TContext>
    extends UseMutationOptions<TData, TError, TVariables, TContext> {
    invalidateQueries?: QueryKey[];
    suppressDefaultError?: boolean;
}

export function useAppMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    options: AppMutationOptions<TData, TError, TVariables, TContext>
) {
    const queryClient = useQueryClient();
    const {
        invalidateQueries,
        suppressDefaultError,
        onSuccess,
        onError,
        ...mutationOptions
    } = options;

    return useMutation({
        ...mutationOptions,
        onSuccess: async (data, variables, context) => {
            if (invalidateQueries) {
                await Promise.all(
                    invalidateQueries.map(key => queryClient.invalidateQueries({ queryKey: key }))
                );
            }
            if (onSuccess) {
                await (onSuccess as any)(data, variables, context);
            }
        },
        onError: async (error, variables, context) => {
            if (!suppressDefaultError) {
                toast.error("Ocorreu um erro inesperado. Tente novamente mais tarde.");
            }
            if (onError) {
                await (onError as any)(error, variables, context);
            }
        }
    });
}
