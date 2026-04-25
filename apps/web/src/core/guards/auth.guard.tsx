import { type PropsWithChildren } from "react";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { Redirect } from "wouter";

const AuthGuard = ({ children }: PropsWithChildren) => {
    const token = useAuthStore((state) => state.token);
    const isAuthenticated = !!token;

    if (!isAuthenticated) return <Redirect to="/" transition/>

    return <>{children}</>;
};

export default AuthGuard;