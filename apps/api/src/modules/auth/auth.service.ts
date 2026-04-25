import prisma from "@plato/database";
import { comparePassword, generateToken, hashPassword } from "./auth.utils";
import { AppError } from "../../shared/error/AppError";

const register = async ({ email, password, name }: { email: string, password: string, name: string }) => {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        }
    });

    return { id: user.id, email: user.email, name: user.name };
};

const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
        throw new AppError("Invalid credentials", 401);
    }

    return generateToken({ id: user.id, email: user.email });
};

export { register, login };