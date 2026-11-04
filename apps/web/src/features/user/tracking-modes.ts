export type TrackingModeValue = "FULL" | "SIMPLE";

export const TRACKING_MODES: { value: TrackingModeValue; label: string; description: string }[] = [
    {
        value: "FULL",
        label: "Completo",
        description: "Carga, repetições e RPE em cada série, com sugestão de progressão e recordes.",
    },
    {
        value: "SIMPLE",
        label: "Simples",
        description: "Um toque por série e peso opcional no fim do exercício. Sem sugestão de progressão e sem recordes.",
    },
];
