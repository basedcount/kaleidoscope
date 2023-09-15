import type { Response } from "express";

export interface EnvVarsType {
    DISCORD_URL?: string;
    DONATION_URL?: string;
    GIT_REPOSITORY?: string;
    ENABLE_USER_FLAIRS: boolean;
    ENABLE_FEDISEER: boolean;
}


// Server - Don't send any secrets from here, this gets sent to the client
export default async ({ res }: { res: Response }) => {
    const vars = {
        DISCORD_URL: process.env.DISCORD_URL,
        DONATION_URL: process.env.DONATION_URL,
        GIT_REPOSITORY: process.env.GIT_REPOSITORY,
        ENABLE_USER_FLAIRS: process.env.ENABLE_USER_FLAIRS === 'true',
        ENABLE_FEDISEER: process.env.ENABLE_FEDISEER !== 'false',
    } satisfies EnvVarsType;

    res.type("json").send(JSON.stringify(vars));
};

// Client - fetch what gets exported by the server, only once at startup
export class EnvVars {
    static #fetched = false;
    static DISCORD_URL?: string;
    static DONATION_URL?: string;
    static GIT_REPOSITORY?: string;
    static ENABLE_USER_FLAIRS = false;
    static ENABLE_FEDISEER = true;

    static async setEnvVars() {
        try {
            if (this.#fetched) return;  // We assume that the env vars won't change during runtime, we fetch them once and save them in the static propreties

            const res = await fetch('/env');
            const env = await res.json();

            EnvVars.DISCORD_URL = env.DISCORD_URL;
            EnvVars.DONATION_URL = env.DONATION_URL;
            EnvVars.GIT_REPOSITORY = env.GIT_REPOSITORY;
            EnvVars.ENABLE_USER_FLAIRS = env.ENABLE_USER_FLAIRS;
            EnvVars.ENABLE_FEDISEER = env.ENABLE_FEDISEER;

            this.#fetched = true;
        } catch (e) {
            console.error(e);
        }
    }
}