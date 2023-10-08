import { Person, Community, CommunityModeratorView } from "lemmy-js-client";
import { EnvVars } from "../../get-env-vars";
import { isBrowser } from "@utils/browser";

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_actor_id: user.actor_id,
        community_actor_id: community.actor_id,
        flair_name: newUserFlair.name
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_actor_id: user.actor_id,
        community_actor_id: community.actor_id,
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

    const res = await fetch(`${getFlairsUrl()}/api/v1/community?community_actor_id=${community.actor_id}&mod_only=${modOnly}`);

    return res.json() as Promise<UserFlairType[]>;
  } catch (e) {
    console.error('Error fetching user flair list in', community.actor_id);
    return [];
  }
}

function getFlairsUrl(){
  if(isBrowser()) return('/flair');
  return `http://${process.env.LEMMY_UI_HOST ?? "localhost:1236"}/flair`;
}