import { fediseerApi } from "./config";
import { ENV } from "../assets/env.js";

export interface EnvVarsType {
  ENABLE_USER_FLAIRS: boolean;
  ENABLE_FEDISEER: boolean;
  DISCORD_URL?: string;
  DONATION_URL?: string;
  GIT_REPOSITORY?: string;
  LEMMY_UI_LEMMY_EXTERNAL_HOST: string;
}

export const EnvVars = {
  ENABLE_USER_FLAIRS: ENV.ENABLE_USER_FLAIRS === 'true',
  ENABLE_FEDISEER: ENV.ENABLE_FEDISEER === 'true',
  DISCORD_URL: ENV.DISCORD_URL.length > 0 ? ENV.DISCORD_URL : undefined,
  DONATION_URL: ENV.DONATION_URL.length > 0 ? ENV.DONATION_URL : undefined,
  GIT_REPOSITORY: ENV.GIT_REPOSITORY.length > 0 ? ENV.GIT_REPOSITORY : undefined,
  LEMMY_UI_LEMMY_EXTERNAL_HOST: ENV.LEMMY_UI_LEMMY_EXTERNAL_HOST,
} satisfies EnvVarsType;

//Fetches the blocklist and censure list from the Fediseer API
export async function getFediseerData(): Promise<Fediseer | null> {
  return null;  //TEMP - going to have to actually remove this in the future
  const enabled = EnvVars.ENABLE_FEDISEER;
  const domain = EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST;

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

interface Fediseer {
  endorsements: string[];
  hesitations: string[];
  censures: string[];
}
