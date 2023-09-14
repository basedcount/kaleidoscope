import { Person, Community, CommunityModeratorView } from "lemmy-js-client";
import { EnvVars } from "../../get-env-vars";

export interface UserFlairType {
  name: string;               //Flair internal name (used for config purposes, eg: mod view)
  displayed_name: string;     //Flair displayed name (visible on the website)
  path?: string;              //Flair image, if present
  community_actor_id: string; //Community where the flair exists
  mod_only: boolean;           //Not gonna be available on release. If true, only mod will be able to select such a flair
}

export async function getUserFlair(user: Person | undefined, community: Community): Promise<UserFlairType | null> {
  try {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_USER_FLAIRS) return null;

    if (!community.local) return null;  //Flairs are only fetched for local communities (we assume other instances won't be running Kaleidoscope)

    if (user === undefined) return null;

    const res = await fetch(`http://localhost:6969/api/v1/user?id=${user.actor_id}&community=${community.actor_id}`);

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


    await fetch("http://localhost:6969/api/v1/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_actor_id: user.actor_id,
        community_actor_id: community.actor_id,
        flair: newUserFlair.name
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

    await fetch("http://localhost:6969/api/v1/user", {
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

    const res = await fetch(`http://localhost:6969/api/v1/community?id=${community.actor_id}&mod_only=${modOnly}`);

    return res.json() as Promise<UserFlairType[]>;
  } catch (e) {
    console.error('Error fetching user flair list in', community.actor_id);
    return [];
  }
}

