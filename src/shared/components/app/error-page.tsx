import { setIsoData } from "@utils/app";
import { Component } from "inferno";
import { T } from "inferno-i18next-dess";
import { IsoDataOptionalSite } from "../../interfaces";
import { I18NextService } from "../../services";
import { getStaticDir } from "@utils/env";

export class ErrorPage extends Component<any, any> {
  private isoData: IsoDataOptionalSite = setIsoData(this.context);

  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    const { errorPageData } = this.isoData;
    const DISCORD_URL = errorPageData?.discordLink;
    const NOT_FOUND = errorPageData?.error === 'couldnt_find_community';

    return (
      <div className="error-page container-lg text-center bc-error-page">

        {/* TITLE */}
        <h1 class="mb-3">
          {NOT_FOUND
            ? I18NextService.i18n.t("not_found_page_title")
            : I18NextService.i18n.t("error_page_title")}
        </h1>

        {/* SUBTITLE */}
        {NOT_FOUND ? (
          <p>
            {I18NextService.i18n.t("not_found_page_message")}
          </p>
        ) :
          <p>
            There was an error on the server. Try refreshing your browser. If that doesn't work, come back at a later time.
          </p>
        }

        {/* IF 404 RETURN TO HOMEPAGE */}
        {NOT_FOUND && (
          <button type="button" class="btn btn-outline-warning mt-3 mb-4">
            <a href="/" class="text-reset">
              {I18NextService.i18n.t("not_found_return_home_button")}
            </a>
          </button>
        )}

        {/* ERROR MESSAGE IF NOT 404 */}
        {!NOT_FOUND && errorPageData?.error && (
          <T i18nKey="error_code_message" parent="p">
            #<strong className="text-danger">#</strong>#
          </T>
        )}

        {/* CONTACTS */}
        <p>
          If you would like to reach out to one of the {this.isoData.site_res?.site_view.site.name ?? "instance's"} admins for support,

          {DISCORD_URL !== undefined && (
            <span> you can visit the instance's <a href={DISCORD_URL}> Discord server</a> </span>
          )}

          {(DISCORD_URL !== undefined && errorPageData?.adminMatrixIds) && (
            <span>or</span>
          )}

          {errorPageData?.adminMatrixIds && (
            <span> write to {errorPageData.adminMatrixIds.length !== 1 ? '' : 'one of '} the following Matrix addresses:</span>
          )}
        </p>

        {errorPageData?.adminMatrixIds && (
          <ol class="list-group w-75 mx-auto mt-4">
            {errorPageData.adminMatrixIds.map((admin, i) => (
              <li class="list-group-item d-flex justify-content-between align-items-start" style="height: 4rem;" key={admin.matrix_user_id}>
                <img src={admin.avatar ?? `${getStaticDir()}/assets/icons/icon-96x96.png`} alt={admin.name} class="h-100 me-2" />
                <div class="ms-2 me-auto text-start">
                  <div class="fw-bold">{admin.display_name ?? admin.name}</div>
                  <a href={"https://matrix.to/#/" + admin.matrix_user_id}>{admin.matrix_user_id}</a>
                </div>
                <span>
                  {i === 0 ? 'Head admin' : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }
}
