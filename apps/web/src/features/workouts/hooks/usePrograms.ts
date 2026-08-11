import { useQuery } from "@tanstack/react-query";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { ProgramService } from "@/features/workouts/services/program.service.ts";

// Toda mutation de programa mexe no que a Biblioteca mostra, então as duas keys
// andam juntas. `["sessions"]` fica de fora: programa não altera histórico.
const PROGRAM_KEYS = [["programs"], ["active-program"]];

export const usePrograms = (id?: string) => {
    const programsQuery = useQuery({
        queryKey: ["programs"],
        queryFn: ProgramService.getAll,
    });

    const programByIdQuery = useQuery({
        queryKey: ["program", id],
        queryFn: () => ProgramService.getById(id!),
        enabled: !!id && id !== "new",
        staleTime: 0,
    });

    const createProgramMutation = useAppMutation({
        mutationFn: ProgramService.create,
        invalidateQueries: PROGRAM_KEYS,
        suppressDefaultError: true,
    });

    const updateProgramMutation = useAppMutation({
        mutationFn: ProgramService.update,
        invalidateQueries: PROGRAM_KEYS,
        suppressDefaultError: true,
    });

    const activateProgramMutation = useAppMutation({
        mutationFn: ProgramService.activate,
        invalidateQueries: PROGRAM_KEYS,
    });

    const deactivateProgramMutation = useAppMutation({
        mutationFn: ProgramService.deactivate,
        invalidateQueries: PROGRAM_KEYS,
    });

    const deleteProgramMutation = useAppMutation({
        mutationFn: ProgramService.delete,
        invalidateQueries: PROGRAM_KEYS,
    });

    return {
        programsQuery,
        programByIdQuery,
        createProgramMutation,
        updateProgramMutation,
        activateProgramMutation,
        deactivateProgramMutation,
        deleteProgramMutation,
    };
};
