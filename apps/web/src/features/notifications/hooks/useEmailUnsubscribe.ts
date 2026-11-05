import { useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { NotificationService } from "../notification.service.ts";

/** Só desliga no toque do botão: antivírus e leitores de e-mail abrem links sozinhos. */
export const useEmailUnsubscribe = () => {
    const { token } = useParams<{ token: string }>();

    const mutation = useMutation({
        mutationFn: () => NotificationService.unsubscribeEmail(token),
    });

    return {
        confirm: () => mutation.mutate(),
        isPending: mutation.isPending,
        isDone: mutation.isSuccess,
        hasError: mutation.isError,
    };
};
