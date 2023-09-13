import type { Response } from "express";

export interface EnvVarsType {
    DONATION_URL?: string;
    GIT_REPOSITORY?: string;
    ENABLE_USER_FLAIRS: boolean;
}


// Don't send any secrets from here, this gets sent to the client
export default async ({ res }: { res: Response }) => {
    const vars = {
        DONATION_URL: process.env.DONATION_URL,
        GIT_REPOSITORY: process.env.GIT_REPOSITORY,
        ENABLE_USER_FLAIRS: process.env.ENABLE_USER_FLAIRS === 'true'
    } satisfies EnvVarsType;

    res.type("json").send(JSON.stringify(vars));
};


export class EnvVars {
    static DONATION_URL?: string;
    static GIT_REPOSITORY?: string;
    static ENABLE_USER_FLAIRS = false;

    static setEnvVars(env: EnvVarsType) {
        EnvVars.DONATION_URL = env.DONATION_URL;
        EnvVars.GIT_REPOSITORY = env.GIT_REPOSITORY;
        EnvVars.ENABLE_USER_FLAIRS = env.ENABLE_USER_FLAIRS
    }
}