import { useLocation } from "wouter";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { path } from "@/core/constants/path.ts";
import { usePrograms } from "@/features/workouts/hooks/usePrograms.ts";
import ProgramListItem from "@/features/workouts/components/program/ProgramListItem.tsx";

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28 },
    },
};

const ProgramListPage = () => {
    const [, navigate] = useLocation();
    const {
        programsQuery,
        activateProgramMutation,
        deactivateProgramMutation,
        deleteProgramMutation,
    } = usePrograms();

    const { data: programs, isLoading } = programsQuery;

    const isPending =
        activateProgramMutation.isPending ||
        deactivateProgramMutation.isPending ||
        deleteProgramMutation.isPending;

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-3 mb-[100px]"
        >
            <motion.div variants={staggerItem} className="flex flex-row items-center justify-between py-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full relative tap-target -ml-2"
                        onClick={() => navigate(path.WORKOUTS)}
                        aria-label="Voltar para a biblioteca"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-medium tracking-tight">Programas</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full relative tap-target"
                    onClick={() => navigate(`${path.PROGRAM_EDITOR}/new`)}
                    aria-label="Novo programa"
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </motion.div>

            <motion.p variants={staggerItem} className="text-[13px] text-muted-foreground px-1">
                Um programa é uma rotação de treinos. O Plato sugere o próximo da ordem —
                sem prender a dias da semana, e sem bloquear se você fizer outro.
            </motion.p>

            <motion.div variants={staggerItem} className="flex-1 flex flex-col gap-4 mt-1">
                {/* O esqueleto é escolhido ANTES do estado vazio: com `programs`
                    undefined durante o fetch, o convite a criar piscaria na tela. */}
                {isLoading ? (
                    <>
                        <Skeleton className="h-[180px] w-full rounded-xl" />
                        <Skeleton className="h-[180px] w-full rounded-xl" />
                    </>
                ) : !programs || programs.length === 0 ? (
                    <div className="bg-dot-grid flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <Button
                            variant="outline"
                            className="flex flex-row gap-2 text-muted-foreground h-[56px] border-dashed border-2"
                            onClick={() => navigate(`${path.PROGRAM_EDITOR}/new`)}
                        >
                            Crie seu primeiro programa
                        </Button>
                    </div>
                ) : (
                    programs.map((program) => (
                        <ProgramListItem
                            key={program.id}
                            program={program}
                            isPending={isPending}
                            onActivate={() => activateProgramMutation.mutate(program.id)}
                            onDeactivate={() => deactivateProgramMutation.mutate(program.id)}
                            onEdit={() => navigate(`${path.PROGRAM_EDITOR}/${program.id}`)}
                            onDelete={() => deleteProgramMutation.mutate(program.id)}
                        />
                    ))
                )}
            </motion.div>
        </motion.div>
    );
};

export default ProgramListPage;
