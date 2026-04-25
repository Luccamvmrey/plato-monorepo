interface PrismaErrorLike {
    code: string;
    meta?: Record<string, unknown>;
}

export function isPrismaError(err: any): err is PrismaErrorLike {
    return err && typeof err.code === 'string' && err.code.startsWith('P');
}