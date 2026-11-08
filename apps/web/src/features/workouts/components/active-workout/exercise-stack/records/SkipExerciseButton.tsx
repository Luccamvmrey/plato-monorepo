import { SkipForward } from "lucide-react";

type SkipExerciseButtonProps = {
    onSkip: () => void;
    disabled: boolean;
};

/**
 * Pular à vista, abaixo do card ativo. Discreto de propósito: é a saída de quem
 * não vai fazer o exercício hoje, não a ação principal. O pulo se desfaz pela
 * linha do exercício pulado, então não pede confirmação.
 */
const SkipExerciseButton = ({ onSkip, disabled }: SkipExerciseButtonProps) => (
    <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="self-center flex items-center gap-1.5 h-11 px-4 text-[14px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
    >
        <SkipForward className="size-4" />
        Pular exercício
    </button>
);

export default SkipExerciseButton;
