import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <AlertTriangle className="size-10 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                        <p className="font-medium text-foreground">Algo deu errado</p>
                        <p className="text-[13px] text-muted-foreground">
                            Ocorreu um erro inesperado nesta página.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
                        Recarregar página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
