import { Link2Off, Users, UsersRound } from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { PublicMessage, PublicShell } from "@/core/components/PublicPage.tsx";
import { JamJoinActions } from "@/features/jam/components/JamJoinActions.tsx";
import { useJamJoinPage } from "@/features/jam/hooks/useJamJoinPage.ts";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const JamJoinPage = () => {
    const { token = "" } = useParams<{ token: string }>();
    const {
        preview,
        isLoading,
        isUnavailable,
        hasLoadError,
        retry,
        isAuthenticated,
        needsInstallForPush,
        handleSignup,
        handleLogin,
        goHome,
    } = useJamJoinPage(token);

    if (isLoading) {
        return (
            <PublicShell>
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </PublicShell>
        );
    }

    if (isUnavailable) {
        return (
            <PublicMessage
                icon={Link2Off}
                title="Esta jam não está disponível"
                description="Confira se o QR ou o link está completo."
                action="Ir para o Plato"
                onAction={goHome}
            />
        );
    }

    if (hasLoadError || !preview) {
        return (
            <PublicMessage
                icon={Link2Off}
                title="Não foi possível abrir a jam"
                description="Confira sua conexão e tente de novo."
                action="Tentar de novo"
                onAction={retry}
            />
        );
    }

    if (preview.isEnded) {
        return (
            <PublicMessage
                icon={UsersRound}
                title="Esta jam já terminou"
                description={`Peça para ${preview.hostName} criar outra.`}
                action="Ir para o Plato"
                onAction={goHome}
            />
        );
    }

    if (preview.isFull) {
        return (
            <PublicMessage
                icon={Users}
                title="A jam está cheia"
                description={`O limite é de ${preview.maxMembers} pessoas treinando juntas.`}
                action="Ir para o Plato"
                onAction={goHome}
            />
        );
    }

    return (
        <PublicShell>
            <header className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-muted-foreground">
                    {preview.hostName} chamou você para treinar junto
                </p>
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] leading-tight">{preview.workoutName}</h1>
                <p className="text-[13px] text-muted-foreground mt-1 tabular-nums">
                    {plural(preview.exerciseCount, "exercício", "exercícios")} · {preview.memberCount} de {preview.maxMembers} pessoas na jam
                </p>
            </header>

            <p className="text-[14px] text-muted-foreground">
                Cada um registra o próprio treino, com as próprias cargas. O Plato mostra onde cada um
                está e, quando vocês dividem um aparelho, de quem é a vez.
            </p>

            {needsInstallForPush && (
                <p className="text-[13px] text-muted-foreground rounded-xl bg-card border border-border px-4 py-3">
                    No iPhone, o aviso de "sua vez" com a tela apagada só chega com o Plato na tela de
                    início: toque em Compartilhar e depois em "Adicionar à Tela de Início".
                </p>
            )}

            {isAuthenticated ? (
                <JamJoinActions token={token} hostName={preview.hostName} />
            ) : (
                <>
                    <div aria-hidden className="h-36" />
                    <div className="fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                        <div className="mx-auto max-w-lg flex flex-col gap-1">
                            <Button onClick={handleSignup} className="w-full h-[52px] gap-2 text-[15px] font-medium tracking-[-0.01em]">
                                <Users data-icon="inline-start" />
                                Criar conta grátis e entrar
                            </Button>
                            <Button variant="link" onClick={handleLogin} className="w-full h-10 text-[13px] text-muted-foreground">
                                Já tenho conta
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </PublicShell>
    );
};

export default JamJoinPage;
