interface EmailMessage {
    to: string;
    subject: string;
    text: string;
    html: string;
}

const DEFAULT_FROM = "Plato <nao-responda@plato-work-out.com>";

const sendEmail = async ({ to, subject, text, html }: EmailMessage): Promise<void> => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        // Opção explícita, e não "fora de produção": o corpo pode levar um link de
        // redefinição de senha, e sem NODE_ENV definido ele pararia nos logs do servidor.
        if (process.env.EMAIL_LOG_TO_CONSOLE !== "true") {
            throw new Error("RESEND_API_KEY is not configured");
        }
        console.log(`[email:dev] para ${to} | ${subject}\n${text}`);
        return;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
            to,
            subject,
            text,
            html,
        }),
    });

    if (!response.ok) {
        throw new Error(`Email provider responded with ${response.status}`);
    }
};

export { sendEmail };
