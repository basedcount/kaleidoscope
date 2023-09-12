import { ErrorPageData } from "@utils/types";
import { GetSiteResponse, Person } from "lemmy-js-client";

export function getErrorPageData(error: Error, site?: GetSiteResponse) {
  const errorPageData: ErrorPageData = {};

  if (site) {
    errorPageData.error = error.message;
  }

  const adminMatrixIds = site?.admins
    .map(pv => pv.person)
    .filter(person => person.matrix_user_id) as Person[] | undefined;

  if (adminMatrixIds && adminMatrixIds.length > 0) {
    errorPageData.adminMatrixIds = adminMatrixIds;
  }

  errorPageData.discordLink = process.env.DISCORD_URL;

  return errorPageData;
}
