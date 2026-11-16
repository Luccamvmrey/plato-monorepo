import { BETA_FEATURES } from "@plato/shared";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { SwitchRow } from "@/core/components/SwitchRow";
import { useBetaProgram } from "../hooks/useBetaProgram";

export const BetaProgramSetting = () => {
    const { isLoaded, isEnabled, setEnabled, hasError } = useBetaProgram();

    if (!isLoaded) return null;

    return (
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-border">
            <SwitchRow
                label="Testar novidades"
                description="Acesso antes de todo mundo. Pode mudar ou sair do ar sem aviso."
                checked={isEnabled}
                onChange={setEnabled}
            />

            {BETA_FEATURES.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                    {BETA_FEATURES.map((feature) => (
                        <li key={feature.key} className="text-[13px]">
                            <span className="font-medium">{feature.name}</span>
                            <span className="text-muted-foreground">: {feature.description}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[13px] text-muted-foreground">
                    Nada em teste agora. Quando houver, aparece aqui.
                </p>
            )}

            {hasError && <InlineErrorBanner message="Não foi possível salvar. Tente novamente." />}
        </div>
    );
};
