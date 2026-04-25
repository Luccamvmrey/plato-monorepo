import { Input } from "@/components/ui/input.tsx";

type ExerciseSearchBarProps = {
    onChange: (value: string) => void;
    value: string;
};

const ExerciseSearchBar = ({ onChange, value }: ExerciseSearchBarProps) => {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Pesquisar exercícios..."
            className="py-6"
        />
    );
};

export default ExerciseSearchBar;