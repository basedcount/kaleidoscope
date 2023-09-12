import { Person } from "lemmy-js-client";

export default interface ErrorPageData {
  error?: string;
  adminMatrixIds?: Person[];
  discordLink?: string;
}
