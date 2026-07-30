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
import WorkoutCompletePage from "@/features/workouts/pages/WorkoutCompletePage.tsx";
import WorkoutSummaryPage from "@/features/workouts/pages/WorkoutSummaryPage.tsx";
import HistoryPage from "@/features/workouts/pages/HistoryPage.tsx";
import ExerciseAnalyticsPage from "@/features/workouts/pages/ExerciseAnalyticsPage.tsx";
import UserProfilePage from "@/features/user/pages/UserProfilePage.tsx";
import ErrorBoundary from "@/core/components/ErrorBoundary";
import NotFoundPage from "@/core/pages/NotFoundPage.tsx";
import { SessionRecoveryDialog } from "@/features/workouts/components/active-workout/components/dialogs/SessionRecoveryDialog.tsx";

const queryClient = new QueryClient();

export function App() {
    useCheckSession();

    return (
        <div className="min-h-dvh w-screen">
            <QueryClientProvider client={queryClient}>
                <Switch>
                    <Route path={path.LOGIN} component={LoginPage}/>
                    <Route path={path.SIGNUP} component={SignupPage}/>
                    <Route path={`${path.WORKOUT_COMPLETE}/:id`} component={WorkoutCompletePage}/>

                    <Layout>
                        <AuthGuard>
                            {/* Switch interno: garante matching exclusivo e habilita o
                                fallback sem path no fim, que é o 404. */}
                            <Switch>
                                <Route path={path.WORKOUTS}>
                                    <ErrorBoundary><WorkoutListPage /></ErrorBoundary>
                                </Route>

                                <Route path={path.WORKOUT_EDITOR} component={WorkoutEditorPage}/>
                                <Route path={`${path.WORKOUT_EDITOR}/:id`} component={WorkoutEditorPage}/>

                                <Route path={path.ACTIVE_WORKOUT}>
                                    <ErrorBoundary><ActiveWorkoutPage /></ErrorBoundary>
                                </Route>
                                <Route path={`${path.ACTIVE_WORKOUT}/:id`}>
                                    <ErrorBoundary><ActiveWorkoutPage /></ErrorBoundary>
                                </Route>

                                <Route path={`${path.WORKOUT_SUMMARY}/:id`} component={WorkoutSummaryPage}/>

                                <Route path={path.HISTORY}>
                                    <ErrorBoundary><HistoryPage /></ErrorBoundary>
                                </Route>

                                <Route path={`${path.EXERCISE_ANALYTICS}/:id`} component={ExerciseAnalyticsPage}/>

                                <Route path={path.USER_PROFILE}>
                                    <ErrorBoundary><UserProfilePage /></ErrorBoundary>
                                </Route>

                                <Route component={NotFoundPage}/>
                            </Switch>
                        </AuthGuard>
                    </Layout>
                </Switch>

                <SessionRecoveryDialog />
                <Toaster position="top-center"/>
            </QueryClientProvider>
        </div>
    );
}

export default App;