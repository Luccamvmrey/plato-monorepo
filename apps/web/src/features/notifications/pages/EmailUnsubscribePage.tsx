import { Button } from "@/components/ui/button.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner.tsx";
import { useEmailUnsubscribe } from "../hooks/useEmailUnsubscribe.ts";

const EmailUnsubscribePage = () => {
    const { confirm, isPending, isDone, hasError } = useEmailUnsubscribe();

    return (
        <main className="min-h-dvh flex flex-col overflow-y-auto px-4">
            <div className="m-auto w-full max-w-sm flex flex-col gap-3 py-8">
                {isDone ? (
                    <>
                        <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">Pronto</h1>
                        <p className="text-[14px] text-muted-foreground">
                            Você não vai mais receber o resumo por e-mail. Para ligar de novo, use
                            Perfil &gt; Configurações &gt; Notificações.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">
                            Parar de receber o resumo semanal?
                        </h1>
                        <p className="text-[14px] text-muted-foreground">
                            Isso só desliga o e-mail. Suas notificações no aparelho continuam como estão.
                        </p>
                        {hasError && <InlineErrorBanner message="Este link não está disponível ou houve uma falha. Tente de novo." />}
                        <Button onClick={confirm} disabled={isPending} className="w-full h-12 font-medium mt-2">
                            Parar de receber
                        </Button>
                    </>
                )}
            </div>
        </main>
    );
};

export default EmailUnsubscribePage;
