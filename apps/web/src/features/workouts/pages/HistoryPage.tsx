import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { History as HistoryIcon } from "lucide-react";
import { HeaderSlot } from "@/core/components/NavBarSlot";
import { WorkoutFilterSelect } from "../components/history/WorkoutFilterSelect";
import { SessionHistoryCard } from "../components/history/SessionHistoryCard";
import { useHistoryLogic } from "@/features/workouts/hooks/useHistoryLogic";

import { Button } from "@/components/ui/button";
import { path } from "@/core/constants/path";

const HistoryPage = () => {
    const {
        selectedFilter,
        setSelectedFilter,
        workouts,
        allRecords,
        isLoading,
        filteredSessions,
        navigate
    } = useHistoryLogic();

    return (
        <div className="h-full flex flex-col gap-3 mb-[100px]">
            <HeaderSlot>
                <div className="bg-card flex flex-row items-center justify-between p-4 rounded-xl border w-full">
                    <div className="flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5 text-primary" />
                        <span className="font-bold text-lg text-foreground">Histórico</span>
                    </div>

                    <WorkoutFilterSelect 
                        value={selectedFilter} 
                        onValueChange={setSelectedFilter} 
                        workouts={workouts} 
                    />
                </div>
            </HeaderSlot>

            <div className="flex flex-col gap-4">
                {filteredSessions?.map((session) => (
                    <SessionHistoryCard 
                        key={session.id} 
                        session={session} 
                        allRecords={allRecords} 
                        navigate={navigate} 
                    />
                ))}

                {filteredSessions?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="bg-primary/10 p-6 rounded-full mb-6">
                            <HistoryIcon className="w-12 h-12 text-primary opacity-40" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Nenhum treino encontrado</h3>
                        <p className="text-muted-foreground mb-6">
                            {selectedFilter === "all" 
                                ? "Você ainda não completou nenhum treino. Que tal começar um agora?" 
                                : "Nenhum registro para este treino específico."}
                        </p>
                        {selectedFilter === "all" && (
                            <Button onClick={() => navigate(path.WORKOUTS)}>
                                Ir para Treinos
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <LoadingOverlay isLoading={isLoading} />
        </div>
    );
};

export default HistoryPage;
