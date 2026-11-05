import { useState } from "react";
import { MAX_REMINDER_HOUR, MIN_REMINDER_HOUR } from "@plato/shared";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner.tsx";
import { cn } from "@/lib/utils.ts";
import { useNotificationSettings } from "../hooks/useNotificationSettings.ts";
import { usePushDevice } from "../hooks/usePushDevice.ts";
import { InstallSteps } from "./InstallInstructionsSheet.tsx";

const HOURS = Array.from(
    { length: MAX_REMINDER_HOUR - MIN_REMINDER_HOUR + 1 },
    (_, index) => MIN_REMINDER_HOUR + index
);

interface SwitchRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const SwitchRow = ({ label, description, checked, onChange }: SwitchRowProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex items-center gap-3 w-full min-h-11 py-1 text-left"
    >
        <span className="flex-1">
            <span className="block text-[14px] font-medium">{label}</span>
            <span className="block text-[13px] text-muted-foreground">{description}</span>
        </span>
        <span
            aria-hidden
            className={cn(
                "flex h-6 w-10 flex-shrink-0 items-center rounded-full p-0.5 transition-colors",
                checked ? "bg-primary" : "bg-muted"
            )}
        >
            <span
                className={cn(
                    "size-5 rounded-full bg-background transition-transform",
                    checked && "translate-x-4"
                )}
            />
        </span>
    </button>
);

/** Primeiro as opções que dependem do aparelho; o e-mail fica separado e vale em qualquer caso. */
export const NotificationSetting = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, updateSettings, hasError: settingsError, refresh } = useNotificationSettings();
    const device = usePushDevice(settings?.publicKey, refresh);

    if (!settings) return null;

    const errorMessage = device.errorMessage ?? (settingsError ? "Não foi possível salvar. Tente novamente." : null);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors text-left"
            >
                <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Notificações</p>
                    <p className="text-[12px] text-muted-foreground">
                        {device.isSubscribed ? "Ativadas neste aparelho" : "Desativadas neste aparelho"}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
            </button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent
                    side="bottom"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    className="rounded-t-2xl max-h-[85dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                >
                    <SheetHeader className="pb-0 pr-12">
                        <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">Notificações</SheetTitle>
                        <SheetDescription className="text-[14px]">
                            No máximo uma por dia. Se você parar de treinar, são até 3 lembretes e depois silêncio.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-4 px-4 pb-2">
                        {device.support === "needs-install" && <InstallSteps />}

                        {device.support === "unsupported" && (
                            <p className="text-[14px] text-muted-foreground">
                                Este navegador não recebe notificações. O resumo por e-mail, abaixo, continua disponível.
                            </p>
                        )}

                        {device.support === "denied" && (
                            <p className="text-[14px] text-muted-foreground">
                                As notificações estão bloqueadas neste aparelho. Para liberar, abra as permissões
                                do Plato nos ajustes do navegador ou do sistema.
                            </p>
                        )}

                        {(device.support === "prompt" || device.support === "granted") && !device.isSubscribed && (
                            <Button
                                onClick={() => void device.enable().catch(() => undefined)}
                                disabled={device.isEnabling || !settings.publicKey}
                                className="w-full h-12 font-medium"
                            >
                                {device.isEnabling ? "Ativando..." : "Ativar neste aparelho"}
                            </Button>
                        )}

                        {device.isSubscribed && (
                            <>
                                <SwitchRow
                                    label="Lembretes"
                                    description="Quando passar da sua frequência de treino"
                                    checked={settings.remindersEnabled}
                                    onChange={(remindersEnabled) => updateSettings({ remindersEnabled })}
                                />
                                <SwitchRow
                                    label="Resumos"
                                    description="Aos domingos e no dia 1º, se você treinou no período"
                                    checked={settings.summariesEnabled}
                                    onChange={(summariesEnabled) => updateSettings({ summariesEnabled })}
                                />

                                <div className="flex items-center gap-3">
                                    <p id="reminder-hour-label" className="flex-1 text-[14px] font-medium">Horário</p>
                                    <Select
                                        value={String(settings.reminderHour)}
                                        onValueChange={(value) => updateSettings({ reminderHour: Number(value) })}
                                    >
                                        <SelectTrigger aria-labelledby="reminder-hour-label" className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HOURS.map((hour) => (
                                                <SelectItem key={hour} value={String(hour)}>{hour}h</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={() => device.disable()}
                                    disabled={device.isDisabling}
                                    variant="ghost"
                                    className="w-full h-11 font-medium text-muted-foreground"
                                >
                                    Desativar neste aparelho
                                </Button>
                            </>
                        )}

                        <div className="border-t border-border pt-3">
                            <SwitchRow
                                label="Resumo semanal por e-mail"
                                description="Só o resumo de domingo. Sem lembretes."
                                checked={settings.emailSummaryEnabled}
                                onChange={(emailSummaryEnabled) => updateSettings({ emailSummaryEnabled })}
                            />
                        </div>

                        {settings.canDebug && device.isSubscribed && (
                            <div className="flex flex-col gap-2 border-t border-border pt-3">
                                <p className="text-[13px] text-muted-foreground">Modo debug, só para admin</p>
                                <Button
                                    onClick={() => device.sendTest()}
                                    disabled={device.isTesting}
                                    variant="secondary"
                                    className="w-full h-11 font-medium"
                                >
                                    {device.testSent ? "Teste enviado" : "Enviar teste"}
                                </Button>
                            </div>
                        )}

                        {errorMessage && <InlineErrorBanner message={errorMessage} />}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};
