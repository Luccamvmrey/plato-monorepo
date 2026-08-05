import { useLocation } from "wouter";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { path } from "@/core/constants/path.ts";

const NotFoundPage = () => {
    const [location, navigate] = useLocation();

    return (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-8">
            <Compass className="w-10 h-10 text-muted-foreground opacity-20" />

            <div className="flex flex-col gap-1.5">
                <h1 className="text-[22px] font-medium tracking-[-0.03em]">
                    Página não encontrada
                </h1>
                <p className="text-[13px] text-muted-foreground">
                    Não existe nada em <span className="font-medium text-foreground">{location}</span>.
                </p>
            </div>

            <Button
                onClick={() => navigate(path.WORKOUTS)}
                className="h-11 px-5 rounded-xl font-medium tracking-tight mt-2"
            >
                Voltar para Treinos
            </Button>
        </div>
    );
};

export default NotFoundPage;
