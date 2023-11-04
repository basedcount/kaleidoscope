import { fediseerApi } from "./config";
import { HttpService } from "./services";
import { ENV } from "./env";

export interface EnvVarsType {
  DISCORD_URL?: string;
  DONATION_URL?: string;
  GIT_REPOSITORY?: string;
  ENABLE_USER_FLAIRS: boolean;
  ENABLE_FEDISEER: boolean;
}

// Client - fetch what gets exported by the server, only once at startup
export class EnvVars {
  static #fetched = false;
  static #loading = false;
  static DISCORD_URL?: string;
  static DONATION_URL?: string;
  static GIT_REPOSITORY?: string;
  static ENABLE_USER_FLAIRS = false;
  static ENABLE_FEDISEER = true;
  static FEDISEER: Promise<null | {
    endorsements: string[];
    hesitations: string[];
    censures: string[];
  }>;

  static async setEnvVars() {
    try {
      if (this.#fetched || this.#loading) return; // We assume that the env vars won't change during runtime, we fetch them once and save them in the static propreties
      this.#loading = true; //Only allow one request at a time to be processed

      const ENABLE_FEDISEER = ENV.ENABLE_FEDISEER === 'true';

      EnvVars.DISCORD_URL = ENV.DISCORD_URL.length > 0 ? ENV.DISCORD_URL : undefined;
      EnvVars.DONATION_URL = ENV.DONATION_URL.length > 0 ? ENV.DONATION_URL : undefined;
      EnvVars.GIT_REPOSITORY = ENV.GIT_REPOSITORY.length > 0 ? ENV.GIT_REPOSITORY : undefined;
      EnvVars.ENABLE_USER_FLAIRS = ENV.ENABLE_USER_FLAIRS === 'true';
      EnvVars.ENABLE_FEDISEER = ENABLE_FEDISEER;

      const domain = await (async () => {
        const site = await HttpService.client.getSite();

        if (site.state !== "success") return null;

        return new URL(site.data.site_view.site.actor_id).host;
      })();

      EnvVars.FEDISEER = getFediseerData(ENABLE_FEDISEER, domain);

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
    const [endorsements, hesitations, censures] = await Promise.all([
      fetchFediseer("approvals", domain),
      fetchFediseer("hesitations_given", domain),
      fetchFediseer("censures_given", domain),
    ]);

    return { endorsements, hesitations, censures };
  } catch (e) {
    console.error(e);
    return null;
  }

  async function fetchFediseer(endpoint: string, domain: string) {
    const res = await fetch(
      `${fediseerApi}/v1/${endpoint}/${domain}?domains=true`,
    );

    if (!res.ok) throw new Error(res.statusText);
    const json = (await res.json()) as { domains: string[] };

    return json.domains;
  }
}
