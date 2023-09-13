import type { Response } from "express";

export interface EnvVars {
    DONATION_URL?: string;
    GIT_REPOSITORY?: string;
}

// Don't send any secrets from here, this gets sent to the client
export default async ({ res }: { res: Response }) => {
    const vars = {
        DONATION_URL: process.env.DONATION_URL,
        GIT_REPOSITORY: process.env.GIT_REPOSITORY
    } satisfies EnvVars;

    res.type("json").send(JSON.stringify(vars));
};
