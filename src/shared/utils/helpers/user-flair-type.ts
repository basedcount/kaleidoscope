import { Person, Community } from "lemmy-js-client";

export interface UserFlairType {
  id: string;
  name: string;
  image: string;
}

let currentFlair: UserFlairType | null = { id: "1", name: "AuthCenter", image: 'https://emoji.redditmedia.com/16q94zxonar31_t5_3ipa1/auth' };

export function getUserFlair(user: Person | null): UserFlairType | null {
  if (user === null) return null;

  if (user.name === 'Nerd02') return currentFlair;

  return null;
}

export function getUserFlairList(community: Community): UserFlairType[] {
  if (!community.local) return []

  if (community.name === 'play') return [{
    "id": "0",
    "name": "AuthLeft",
    "image": "https://emoji.redditmedia.com/tusmt4eqnar31_t5_3ipa1/authleft"
  }, {
    "id": "1",
    "name": "AuthCenter",
    "image": "https://emoji.redditmedia.com/16q94zxonar31_t5_3ipa1/auth"
  }, {
    "id": "2",
    "name": "AuthRight",
    "image": "https://emoji.redditmedia.com/4ak3jtrrnar31_t5_3ipa1/authright"
  }, {
    "id": "3",
    "name": "Left",
    "image": "https://emoji.redditmedia.com/w977vwiynar31_t5_3ipa1/left"
  }, {
    "id": "4",
    "name": "Centrist",
    "image": "https://emoji.redditmedia.com/6zhv8hgvoar31_t5_3ipa1/centrist"
  }, {
    "id": "5",
    "name": "Right",
    "image": "https://emoji.redditmedia.com/x5otkjy5oar31_t5_3ipa1/right"
  }, {
    "id": "6",
    "name": "LibLeft",
    "image": "https://emoji.redditmedia.com/d4hfiki0oar31_t5_3ipa1/libleft"
  }, {
    "id": "7",
    "name": "LibCenter",
    "image": "https://emoji.redditmedia.com/s03ozdmznar31_t5_3ipa1/lib"
  }, {
    "id": "8",
    "name": "LibRight",
    "image": "https://emoji.redditmedia.com/hts92712oar31_t5_3ipa1/libright"
  }, {
    "id": "9",
    "name": "Centrist",
    "image": "https://emoji.redditmedia.com/bxv3jzc85q851_t5_3ipa1/CENTG"
  }, {
    "id": "10",
    "name": "LibRight",
    "image": "https://emoji.redditmedia.com/9usjafiot7t31_t5_3ipa1/libright2"
  }];

  return [];
}

export function setUserFlair(newUserFlair: UserFlairType) {
  currentFlair = newUserFlair;
}

export function clearUserFlair() {
  currentFlair = null;
}
