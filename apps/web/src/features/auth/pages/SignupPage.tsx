import SignupCard from "@/features/auth/components/signup/SignupCard.tsx";
import { useBypassAuth } from "@/features/auth/hooks/useBypassAuth.ts";

const SignupPage = () => {
    useBypassAuth();

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <SignupCard/>
        </div>
    );
};

export default SignupPage;