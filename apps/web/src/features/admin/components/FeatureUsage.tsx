import type { AdminMetrics } from "@plato/shared";
import { FEATURE_LABEL } from "../utils/feature-labels.ts";

interface FeatureUsageProps {
    features: AdminMetrics["features"];
    totalUsers: number;
}

export const FeatureUsage = ({ features, totalUsers }: FeatureUsageProps) => (
    <section className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">O que estão usando</h2>

        <ul className="flex flex-col gap-3">
            {features.map(({ feature, users }) => (
                <li key={feature} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px]">{FEATURE_LABEL[feature]}</span>
                        <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                            {users} de {totalUsers}
                        </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden" aria-hidden>
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: totalUsers > 0 ? `${(users / totalUsers) * 100}%` : 0 }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    </section>
);
