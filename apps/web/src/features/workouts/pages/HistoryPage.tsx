import { motion, type Variants } from "framer-motion";
import { History } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Button } from "@/components/ui/button";
import { WorkoutFilterSelect } from "../components/history/WorkoutFilterSelect";
import { SessionHistoryCard } from "../components/history/SessionHistoryCard";
import { useHistoryLogic } from "@/features/workouts/hooks/useHistoryLogic";
import { path } from "@/core/constants/path";

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

const HistoryPage = () => {
    const {
        selectedFilter,
        setSelectedFilter,
        workouts,
        allRecords,
        isLoading,
        filteredSessions,
        navigate,
    } = useHistoryLogic();

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-3 mb-[100px]"
        >
            {/* Header */}
            <motion.div variants={staggerItem} className="flex items-center justify-between py-2">
                <h1 className="text-[22px] font-medium tracking-[-0.03em]">Histórico</h1>
                <WorkoutFilterSelect
                    value={selectedFilter}
                    onValueChange={setSelectedFilter}
                    workouts={workouts}
                />
            </motion.div>

            {/* Lista de sessões */}
            <motion.div variants={staggerItem} className="flex flex-col">
                {filteredSessions?.map(session => (
                    <SessionHistoryCard
                        key={session.id}
                        session={session}
                        allRecords={allRecords}
                        navigate={navigate}
                    />
                ))}

                {/* Estado vazio */}
                {filteredSessions?.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-20">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                            <History className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-[15px] font-medium text-foreground text-center">
                            Nenhum treino registrado
                        </p>
                        <p className="text-[13px] text-muted-foreground text-center">
                            {selectedFilter === "all"
                                ? "Complete um treino para ver seu histórico aqui."
                                : "Nenhum registro para este treino."}
                        </p>
                        {selectedFilter === "all" && (
                            <Button onClick={() => navigate(path.WORKOUTS)} className="mt-1">
                                Ir para Treinos
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>

            <LoadingOverlay isLoading={isLoading} />
        </motion.div>
    );
};

export default HistoryPage;
