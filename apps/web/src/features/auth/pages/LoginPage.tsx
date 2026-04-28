import LoginCard from "@/features/auth/components/login/LoginCard.tsx";
import { useBypassAuth } from "@/features/auth/hooks/useBypassAuth.ts";

const LoginPage = () => {
    useBypassAuth();

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
            <LoginCard/>
        </div>
    );
};

export default LoginPage;