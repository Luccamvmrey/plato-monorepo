import SignupCard from "@/features/auth/components/signup/SignupCard.tsx";
import { useBypassAuth } from "@/features/auth/hooks/useBypassAuth.ts";

const SignupPage = () => {
    useBypassAuth();

    return (
        <div className="min-h-dvh w-screen flex flex-col bg-background overflow-y-auto px-4 py-8">
            {/* m-auto em vez de justify-center: com o teclado aberto o card cresce para
                ~555px numa viewport de 508px, e items-center recortava o topo
                ("Bem-vindo ao Plato!") sem deixar rolar até ele. */}
            <div className="m-auto w-full flex justify-center">
                <SignupCard/>
            </div>
        </div>
    );
};

export default SignupPage;