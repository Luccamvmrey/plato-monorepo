import { Input } from "@/components/ui/input.tsx";
import { Search } from "lucide-react";

type ExerciseSearchBarProps = {
    onChange: (value: string) => void;
    value: string;
};

const ExerciseSearchBar = ({ onChange, value }: ExerciseSearchBarProps) => {
    return (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Pesquisar exercícios..."
                className="h-12 pl-11 rounded-xl bg-muted/50 border-transparent focus:bg-background transition-all"
            />
        </div>
    );
};

export default ExerciseSearchBar;