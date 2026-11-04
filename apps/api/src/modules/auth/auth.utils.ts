import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET

const hashPassword = async (password: string): Promise<string> => {
    return hash(password, SALT_ROUNDS);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return compare(password, hash);
};

// O app renova o token ao abrir, então só cai no login quem ficou 30 dias sem abrir.
const TOKEN_TTL = "30d";

const generateToken = (payload: object) => sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });

export { hashPassword, comparePassword, generateToken };
