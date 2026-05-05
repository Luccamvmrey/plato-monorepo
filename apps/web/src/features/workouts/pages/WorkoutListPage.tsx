import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts.ts";
import { useStreakData } from "@/features/user/hooks/useStreakData";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import WorkoutListHeader from "@/features/workouts/components/workout-list/WorkoutListHeader.tsx";
import WorkoutList from "@/features/workouts/components/workout-list/WorkoutList.tsx";
import StreakWidget from "@/features/workouts/components/workout-list/StreakWidget.tsx";
import { Button } from "@/components/ui/button.tsx";

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

const WorkoutListPage = () => {
    const [showArchived, setShowArchived] = useState(false);
    const { userWorkoutsQuery, lastCompletedSessionQuery } = useWorkouts(undefined, !showArchived);
    const { data: streakData } = useStreakData();

    const { data: workouts, isLoading } = userWorkoutsQuery;
    const lastCompletedWorkoutId = lastCompletedSessionQuery.data?.workoutId;

    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="h-full flex flex-col gap-3 mb-[100px]"
        >
            <motion.div variants={staggerItem}>
                <WorkoutListHeader />
            </motion.div>

            {streakData && (
                <motion.div variants={staggerItem}>
                    <StreakWidget streak={streakData} />
                </motion.div>
            )}

            <motion.div variants={staggerItem} className="flex justify-end -mt-2">
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                    className="text-muted-foreground text-xs font-normal h-auto p-0 hover:no-underline"
                >
                    {showArchived ? "Ver Ativos" : "Ver Arquivados"}
                </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="flex-1 flex flex-col">
                <WorkoutList
                    workouts={workouts}
                    isArchivedView={showArchived}
                    lastCompletedWorkoutId={lastCompletedWorkoutId}
                />
            </motion.div>

            <LoadingOverlay isLoading={isLoading} />
        </motion.div>
    );
};

export default WorkoutListPage;
