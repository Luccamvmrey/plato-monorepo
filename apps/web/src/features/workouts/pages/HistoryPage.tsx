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

    const isEmpty = filteredSessions?.length === 0 && !isLoading;

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
            {!isEmpty && (
                <motion.div variants={staggerItem} className="flex flex-col">
                    {filteredSessions?.map(session => (
                        <SessionHistoryCard
                            key={session.id}
                            session={session}
                            allRecords={allRecords}
                            navigate={navigate}
                        />
                    ))}
                </motion.div>
            )}

            {/* Estado vazio */}
            {isEmpty && (
                <motion.div
                    variants={staggerItem}
                    className="bg-dot-grid flex-1 flex flex-col items-center justify-center gap-3 rounded-xl
                               min-h-[calc(100vh-220px)] text-center px-8"
                >
                    <div className="w-12 h-12 rounded-2xl bg-background/80 border border-border flex items-center justify-center">
                        <History className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-[15px] font-medium text-foreground">
                        Nenhum treino registrado
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                        {selectedFilter === "all"
                            ? "Complete um treino para ver seu histórico aqui."
                            : "Nenhum registro para este treino."}
                    </p>
                    {selectedFilter === "all" && (
                        <Button onClick={() => navigate(path.WORKOUTS)} className="mt-1">
                            Ir para Treinos
                        </Button>
                    )}
                </motion.div>
            )}

            <LoadingOverlay isLoading={isLoading} />
        </motion.div>
    );
};

export default HistoryPage;
