import { useCheckSession } from "@/core/hooks/useCheckSession.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner.tsx";
import LoginPage from "@/features/auth/pages/LoginPage.tsx";
import AuthGuard from "@/core/guards/auth.guard.tsx";
import { path } from "@/core/constants/path.ts";
import SignupPage from "@/features/auth/pages/SignupPage.tsx";
import WorkoutListPage from "@/features/workouts/pages/WorkoutListPage.tsx";
import WorkoutEditorPage from "@/features/workouts/pages/WorkoutEditorPage.tsx";
import Layout from "@/core/layout/Layout.tsx";
import ActiveWorkoutPage from "@/features/workouts/pages/ActiveWorkoutPage.tsx";
import WorkoutSummaryPage from "@/features/workouts/pages/WorkoutSummaryPage.tsx";
import HistoryPage from "@/features/workouts/pages/HistoryPage.tsx";
import ExerciseAnalyticsPage from "@/features/workouts/pages/ExerciseAnalyticsPage.tsx";
import UserProfilePage from "@/features/user/pages/UserProfilePage.tsx";

const queryClient = new QueryClient();

export function App() {
    useCheckSession();

    return (
        <div className="h-screen w-screen">
            <QueryClientProvider client={queryClient}>
                <Switch>
                    <Route path={path.LOGIN} component={LoginPage}/>
                    <Route path={path.SIGNUP} component={SignupPage}/>

                    <Layout>
                        <AuthGuard>
                            <Route path={path.WORKOUTS} component={WorkoutListPage}/>

                            <Route path={path.WORKOUT_EDITOR} component={WorkoutEditorPage}/>
                            <Route path={`${path.WORKOUT_EDITOR}/:id`} component={WorkoutEditorPage}/>

                            <Route path={path.ACTIVE_WORKOUT} component={ActiveWorkoutPage}/>
                            <Route path={`${path.ACTIVE_WORKOUT}/:id`} component={ActiveWorkoutPage}/>

                            <Route path={`${path.WORKOUT_SUMMARY}/:id`} component={WorkoutSummaryPage}/>

                            <Route path={path.HISTORY} component={HistoryPage}/>

                            <Route path={`${path.EXERCISE_ANALYTICS}/:id`} component={ExerciseAnalyticsPage}/>

                            <Route path={path.USER_PROFILE} component={UserProfilePage}/>
                        </AuthGuard>
                    </Layout>
                </Switch>

                <Toaster position="top-center"/>
            </QueryClientProvider>
        </div>
    );
}

export default App;