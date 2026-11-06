import type { AdminMetrics } from "@plato/shared";

const KIND_LABEL: Record<AdminMetrics["notifications"][number]["kind"], string> = {
    REMINDER: "Lembretes",
    WEEKLY_SUMMARY: "Resumo semanal",
    MONTHLY_SUMMARY: "Resumo mensal",
};

export const NotificationStats = ({ notifications }: { notifications: AdminMetrics["notifications"] }) => (
    <section className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Notificações automáticas</h2>

        <ul className="flex flex-col gap-3">
            {notifications.map(({ kind, sent, failed, opened }) => (
                <li key={kind}>
                    <p className="text-[14px]">{KIND_LABEL[kind]}</p>
                    <p className="text-[13px] text-muted-foreground tabular-nums mt-0.5">
                        {sent} {sent === 1 ? "enviada" : "enviadas"} · {opened} {opened === 1 ? "aberta" : "abertas"}
                        {failed > 0 && <span className="text-destructive"> · {failed} {failed === 1 ? "falha" : "falhas"}</span>}
                    </p>
                </li>
            ))}
        </ul>
    </section>
);
