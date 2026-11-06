import { MAX_REMINDER_HOUR, MIN_REMINDER_HOUR, isValidTimezone } from "@plato/shared";
import { z } from "zod";

const timezoneSchema = z.string().min(1).max(64).refine(isValidTimezone, "Invalid timezone");

export const subscribeSchema = z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
        p256dh: z.string().min(1).max(256),
        auth: z.string().min(1).max(256),
    }),
    timezone: timezoneSchema,
});

export const unsubscribeDeviceSchema = z.object({
    endpoint: z.string().url().max(2048),
});

export const updateSettingsSchema = z.object({
    remindersEnabled: z.boolean().optional(),
    summariesEnabled: z.boolean().optional(),
    emailSummaryEnabled: z.boolean().optional(),
    reminderHour: z.number().int().min(MIN_REMINDER_HOUR).max(MAX_REMINDER_HOUR).optional(),
    timezone: timezoneSchema.optional(),
});

export const scheduleRestAlertSchema = z.object({
    endpoint: z.string().url().max(2048),
    // Tempo restante, e não o horário final: o relógio do aparelho pode divergir do servidor.
    remainingMs: z.number().int().positive().max(15 * 60_000),
    measureFrom: z.number().int().positive(),
});

export type SubscribeInput =z.infer<typeof subscribeSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
