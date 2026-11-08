import { useLocation } from "wouter";
import { path } from "@/core/constants/path.ts";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession.ts";

/**
 * Tela da sessão com treino aberto: a NavBar some e o rodapé da sessão desce
 * para o fundo da tela. Sem sessão a mesma rota mostra "nenhuma sessão ativa",
 * e ali a NavBar continua sendo a saída.
 */
export const useSessionFocusMode = () => {
    const [location] = useLocation();
    const { findActiveSessionQuery } = useActiveSession();
    return location.startsWith(path.ACTIVE_WORKOUT) && !!findActiveSessionQuery.data?.activeSession;
};
