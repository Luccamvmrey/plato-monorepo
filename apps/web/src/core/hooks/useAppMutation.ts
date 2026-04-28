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
    successMessage?: string | ((data: TData) => string);
    errorMessage?: string | ((error: TError) => string);
}

/**
 * A wrapper around useMutation that adds standard query invalidation and toast notifications.
 */
export function useAppMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    options: AppMutationOptions<TData, TError, TVariables, TContext>
) {
    const queryClient = useQueryClient();
    const { 
        invalidateQueries, 
        successMessage, 
        errorMessage, 
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

            if (successMessage) {
                const message = typeof successMessage === 'function' ? successMessage(data) : successMessage;
                toast.success(message);
            }

            if (onSuccess) {
                await (onSuccess as any)(data, variables, context);
            }
        },
        onError: async (error, variables, context) => {
            if (errorMessage) {
                const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
                toast.error(message);
            } else {
                console.error("Mutation error:", error);
                toast.error("Ocorreu um erro inesperado. Tente novamente mais tarde.");
            }

            if (onError) {
                await (onError as any)(error, variables, context);
            }
        }
    });
}

