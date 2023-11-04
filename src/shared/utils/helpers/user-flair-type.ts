import { Person, Community, CommunityModeratorView } from "lemmy-js-client";
import { EnvVars } from "../../get-env-vars";
import { isBrowser } from "@utils/browser";
import { myAuth } from "@utils/app";

export interface UserFlairType {
  name: string;
  display_name: string;
  path: string | null;
  community_actor_id: string;
  mod_only: boolean;
}

export async function getUserFlair(user: Person | undefined, community: Community): Promise<UserFlairType | null> {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return null;

    if (!community.local) return null;  //Flairs are only fetched for local communities (we assume other instances won't be running Kaleidoscope)

    if (user === undefined) return null;

    const res = await fetch(`${getFlairsUrl()}/api/v1/user?user_actor_id=${user.actor_id}&community_actor_id=${community.actor_id}`);

    return res.json() as Promise<UserFlairType>;
  } catch (e) {
    console.error('Error fetching user flair for', user?.actor_id);
    return null;
  }
}

export async function setUserFlair(user: Person, community: Community, newUserFlair: UserFlairType) {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return;

    if (!community.local) return;  //Flairs are only fetched for local communities (we assume other instances won't be running Kaleidoscope)


    await fetch(`${getFlairsUrl()}/api/v1/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myAuth()}`
      },
      body: JSON.stringify({
        user_actor_id: user.actor_id,
        community_actor_id: community.actor_id,
        flair_name: newUserFlair.name,
        instance_domain: EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST, //this is undefined on browser (only exists on server) - pass down along to everything else, but if possible write to file instead (docker)
      })
    });

  } catch (e) {
    console.error(e);
  }
}

export async function clearUserFlair(user: Person, community: Community) {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return;

    if (!community.local) return;  //Flairs are only fetched for local communities (we assume other instances won't be running Kaleidoscope)

    await fetch(`${getFlairsUrl()}/api/v1/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myAuth()}`
      },
      body: JSON.stringify({
        user_actor_id: user.actor_id,
        community_actor_id: community.actor_id,
        instance_domain: EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST,
      })
    });

  } catch (e) {
    console.error(e);
  }
}

export async function getUserFlairList(requester: Person | undefined, moderators: CommunityModeratorView[], community: Community): Promise<UserFlairType[]> {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return [];

    if (!community.local) return [];  //Flairs are only fetched for local communities (we assume other instances won't be running Kaleidoscope)

    let modOnly = false;

    if (requester !== undefined) {
      for (const entry of moderators) {
        if (entry.moderator.id === requester.id) {
          modOnly = true;
          break;
        }
      }
    }

    const res = await fetch(`${getFlairsUrl()}/api/v1/community?community_actor_id=${community.actor_id}&mod_only=${modOnly}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myAuth()}`
      },
    });

    return res.json() as Promise<UserFlairType[]>;
  } catch (e) {
    console.error('Error fetching user flair list in', community.actor_id);
    return [];
  }
}

export async function modAddFlair(flair: UserFlairType) {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return;

    await fetch(`${getFlairsUrl()}/api/v1/community`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myAuth()}`
      },
      body: JSON.stringify({
        name: flair.name,
        display_name: flair.display_name,
        path: flair.path,
        community_actor_id: flair.community_actor_id,
        mod_only: flair.mod_only,
        instance_domain: EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST,
      })
    });

  } catch (e) {
    console.error(e);
  }
}

export async function modDeleteFlair(flair: UserFlairType) {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return;

    await fetch(`${getFlairsUrl()}/api/v1/community`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${myAuth()}`
      },
      body: JSON.stringify({
        name: flair.name,
        community_actor_id: flair.community_actor_id,
        instance_domain: EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST,
      })
    });

  } catch (e) {
    console.error(e);
  }
}

export async function getCommunitiesWithFlairs() {
  try {
    const res = await fetch(`${getFlairsUrl}/api/v1/setup`);
    return await res.json() as string[];
  } catch (e) {
    console.log(e)
    return [];
  }
}

function getFlairsUrl() {
  return `http://localhost:1236/flair`;
  if (isBrowser()) return ('/flair');
  return `http://${EnvVars.LEMMY_UI_LEMMY_EXTERNAL_HOST ?? "localhost:1236"}/flair`;
}