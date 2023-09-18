import type { Response } from "express";
import { fediseerApi } from "./config";
import { isBrowser } from "@utils/browser";
// import { HttpService } from "./services";

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
    static #loading = false;
    static DISCORD_URL?: string;
    static DONATION_URL?: string;
    static GIT_REPOSITORY?: string;
    static ENABLE_USER_FLAIRS = false;
    static ENABLE_FEDISEER = true;
    static FEDISEER: Promise<null | { endorsements: string[], hesitations: string[], censures: string[] }>;

    static async setEnvVars() {
        try {
            if (this.#fetched || this.#loading) return;  // We assume that the env vars won't change during runtime, we fetch them once and save them in the static propreties
            this.#loading = true; //Only allow one request at a time to be processed

            const res = isBrowser()
                ? await fetch('/env')
                : await fetch(`http://${process.env.LEMMY_UI_HOST ?? '0.0.0.0:1234'}/env`);
            const env = await res.json();

            EnvVars.DISCORD_URL = env.DISCORD_URL;
            EnvVars.DONATION_URL = env.DONATION_URL;
            EnvVars.GIT_REPOSITORY = env.GIT_REPOSITORY;
            EnvVars.ENABLE_USER_FLAIRS = env.ENABLE_USER_FLAIRS;
            EnvVars.ENABLE_FEDISEER = env.ENABLE_FEDISEER;

            const domain = await (async () => {
                return 'lemmy.world';   //TODO: change this

                // const site = await HttpService.client.getSite();

                // if (site.state !== 'success') return null;

                // return new URL(site.data.site_view.site.actor_id).host;
            })();

            EnvVars.FEDISEER = getFediseerData(env.ENABLE_FEDISEER, domain);

            this.#fetched = true;
            this.#loading = false;
        } catch (e) {
            this.#loading = false;
            console.error(e);
        }
    }
}

async function getFediseerData(enabled: boolean, domain: string | null) {
    if (!enabled || domain === null) return null;

    try {
        const endorsements = await fetchFediseer('approvals', domain);
        const hesitations = await fetchFediseer('hesitations_given', domain);
        const censures = await fetchFediseer('censures_given', domain);

        // DEV STUFF IN HERE - TEMP
        endorsements.push('localhost');
        // END DEV STUFF

        return { endorsements, hesitations, censures }
    } catch (e) {
        console.error(e);
        return null;
    }

    async function fetchFediseer(endpoint: string, domain: string) {
        const res = await fetch(`${fediseerApi}/v1/${endpoint}/${domain}?domains=true`);

        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json() as { domains: string[] };

        return json.domains;
    }
}