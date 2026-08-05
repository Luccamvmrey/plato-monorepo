import LoginCard from "@/features/auth/components/login/LoginCard.tsx";
import { useBypassAuth } from "@/features/auth/hooks/useBypassAuth.ts";

const LoginPage = () => {
    useBypassAuth();

    return (
        <div className="min-h-dvh w-screen flex flex-col bg-background overflow-y-auto px-4 py-8">
            {/* m-auto em vez de justify-center: quando o card fica mais alto que a
                viewport (teclado aberto + erros de validação) as margens automáticas
                colapsam para 0 em vez de recortar o topo do card fora de alcance. */}
            <div className="m-auto w-full flex justify-center">
                <LoginCard/>
            </div>
        </div>
    );
};

export default LoginPage;