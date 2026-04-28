import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { PersonalRecordService } from "@/features/workouts/services/personal-record.service";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts";
import { useLocation } from "wouter";

export const useHistoryLogic = () => {
    const [, navigate] = useLocation();
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    
    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions"],
        queryFn: () => WorkoutSessionService.getByUserId()
    });

    const { data: allRecords } = useQuery({
        queryKey: ["all-records"],
        queryFn: () => PersonalRecordService.getAll()
    });

    const { userWorkoutsQuery } = useWorkouts();
    const { data: workouts } = userWorkoutsQuery;

    const isLoading = sessionsLoading;

    const filteredSessions = sessions?.filter(session => {
        if (selectedFilter === "all") {
            return session.workout?.isActive !== false;
        }
        return session.workoutId === Number(selectedFilter);
    });

    return {
        selectedFilter,
        setSelectedFilter,
        sessions,
        workouts,
        allRecords,
        isLoading,
        filteredSessions,
        navigate
    };
};
