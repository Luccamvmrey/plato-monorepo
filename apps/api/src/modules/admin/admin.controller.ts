import { Request, Response } from "express";
import * as adminService from "./admin.service";

const getMetrics = async (_req: Request, res: Response) => {
    res.json(await adminService.getMetrics());
};

export { getMetrics };
