import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateShort, formatWeight } from "@/core/utils/formatters";
import { useBodyWeightCardLogic } from "../hooks/useBodyWeightCardLogic";

const HISTORY_PREVIEW = 4;

export const BodyWeightCard = () => {
    const {
        logs, current, isLoading,
        isFormOpen, openForm, closeForm,
        weight, setWeight, measuredAt, setMeasuredAt,
        error, handleSubmit, isCreating,
        deleteBodyWeight, isDeleting,
    } = useBodyWeightCardLogic();

    return (
        <div className="mx-4 mb-4 bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em]">
                    Peso corporal
                </p>

                {!isFormOpen && (
                    <Button size="sm" variant="outline" onClick={openForm} className="h-8 -mt-1">
                        {current ? "Atualizar" : "Registrar"}
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
            ) : current ? (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[36px] font-semibold tracking-[-0.03em] leading-none">
                        {current.weight.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[13px] text-muted-foreground">kg</span>
                    <span className="text-[12px] text-muted-foreground ml-1">
                        · {formatDateShort(current.measuredAt)}
                    </span>
                </div>
            ) : (
                <p className="text-[13px] text-muted-foreground">
                    Nenhum peso registrado.
                </p>
            )}

            {/* A explicação fica sempre visível: sem peso registrado, os exercícios de
                peso corporal simplesmente não entram em recorde, e isso não teria
                como ser deduzido da tela. */}
            {!isLoading && !current && (
                <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                    Exercícios como barra fixa e paralelas usam seu peso para calcular a carga.
                    Sem um registro, eles ficam fora dos recordes e da progressão.
                </p>
            )}

            {isFormOpen && (
                <div className="mt-4 pt-4 border-t flex flex-col gap-3">
                    <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                            <Label htmlFor="body-weight-value" className="text-[12px] text-muted-foreground mb-1.5">
                                Peso (kg)
                            </Label>
                            {/* type="text" + inputMode: type="number" descarta a vírgula
                                antes de qualquer parser ver o valor. */}
                            <Input
                                id="body-weight-value"
                                type="text"
                                inputMode="decimal"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="65,4"
                                className="h-11"
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <Label htmlFor="body-weight-date" className="text-[12px] text-muted-foreground mb-1.5">
                                Data
                            </Label>
                            <Input
                                id="body-weight-date"
                                type="date"
                                value={measuredAt}
                                onChange={(e) => setMeasuredAt(e.target.value)}
                                className="h-11"
                            />
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="text-[12px] text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={isCreating} className="h-11 flex-1">
                            {isCreating ? "Salvando…" : "Salvar"}
                        </Button>
                        <Button variant="ghost" onClick={closeForm} disabled={isCreating} className="h-11">
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {logs.length > 1 && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.05em] mb-2">
                        Histórico
                    </p>

                    <ul className="flex flex-col">
                        {logs.slice(0, HISTORY_PREVIEW).map((log) => (
                            <li key={log.id} className="flex items-center justify-between gap-3 py-1">
                                <span className="text-[13px]">{formatWeight(log.weight)}</span>

                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-muted-foreground">
                                        {formatDateShort(log.measuredAt)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remover registro de ${formatWeight(log.weight)}`}
                                        onClick={() => deleteBodyWeight(log.id)}
                                        disabled={isDeleting}
                                        className="tap-target relative text-muted-foreground"
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {logs.length > HISTORY_PREVIEW && (
                        <p className="text-[12px] text-muted-foreground mt-2">
                            + {logs.length - HISTORY_PREVIEW} registros anteriores
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
