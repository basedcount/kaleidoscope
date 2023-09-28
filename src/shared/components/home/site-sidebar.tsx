import classNames from "classnames";
import { Component, linkEvent } from "inferno";
import { PersonView, Site, SiteAggregates } from "lemmy-js-client";
import { mdToHtml } from "../../markdown";
import { I18NextService } from "../../services";
import { Badges } from "../common/badges";
import { BannerIconHeader } from "../common/banner-icon-header";
import { Icon } from "../common/icon";
import { PersonListing } from "../person/person-listing";
import { fediseerInfo, fediseerApi } from "../../config";
import { EnvVars } from "../../get-env-vars";

interface SiteSidebarProps {
  site: Site;
  showLocal: boolean;
  counts?: SiteAggregates;
  admins?: PersonView[];
  isMobile?: boolean;
}

interface SiteSidebarState {
  collapsed: boolean;
  siteIsInFediseer: boolean;
}

export class SiteSidebar extends Component<SiteSidebarProps, SiteSidebarState> {
  state: SiteSidebarState = {
    collapsed: false,
    siteIsInFediseer: true,
  };
  domain = new URL(this.props.site.actor_id).host;

  constructor(props: any, context: any) {
    super(props, context);
  }

  async componentDidMount() {
    await EnvVars.setEnvVars();
    if (!EnvVars.ENABLE_FEDISEER) return;

    const url = `${fediseerApi}/v1/whitelist/${this.domain}`; //Request to the Fediseer API

    const res = await fetch(url, {
      method: "HEAD",
    })

    this.setState({ siteIsInFediseer: res.ok })
  }

  render() {
    return (
      <div className="site-sidebar accordion">
        <section id="sidebarInfo" className="card border-secondary mb-3">
          <header className="card-header" id="sidebarInfoHeader">
            {this.siteName()}
            {!this.state.collapsed && (
              <BannerIconHeader banner={this.props.site.banner} />
            )}
          </header>

          {!this.state.collapsed && (
            <div id="sidebarInfoBody" aria-labelledby="sidebarInfoHeader">
              <div className="card-body">{this.siteInfo()}</div>
            </div>
          )}
        </section>
      </div>
    );
  }

  siteName() {
    return (
      <div className={classNames({ "mb-2": !this.state.collapsed })}>
        <h5 className="mb-0 d-inline">{this.props.site.name}</h5>
        {!this.props.isMobile && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={linkEvent(this, this.handleCollapseSidebar)}
            aria-label={
              this.state.collapsed
                ? I18NextService.i18n.t("expand")
                : I18NextService.i18n.t("collapse")
            }
            data-tippy-content={
              this.state.collapsed
                ? I18NextService.i18n.t("expand")
                : I18NextService.i18n.t("collapse")
            }
            data-bs-toggle="collapse"
            data-bs-target="#sidebarInfoBody"
            aria-expanded="true"
            aria-controls="sidebarInfoBody"
          >
            {this.state.collapsed ? (
              <Icon icon="plus-square" classes="icon-inline" />
            ) : (
              <Icon icon="minus-square" classes="icon-inline" />
            )}
          </button>
        )}
      </div>
    );
  }

  siteInfo() {
    const site = this.props.site;
    return (
      <div>
        {site.description && <h6>{site.description}</h6>}
        {site.sidebar && this.siteSidebar(site.sidebar)}
        {this.props.counts && <Badges counts={this.props.counts} />}
        {this.props.admins && this.admins(this.props.admins)}
        {this.state.siteIsInFediseer && EnvVars.ENABLE_FEDISEER && this.fediseer()}
      </div>
    );
  }

  siteSidebar(sidebar: string) {
    return (
      <div className="md-div" dangerouslySetInnerHTML={mdToHtml(sidebar)} />
    );
  }

  admins(admins: PersonView[]) {
    return (
      <>
        <h6 class="my-1 font-monospace" style="text-transform: capitalize;">{I18NextService.i18n.t("admins")}:</h6>
        <ul className="list-inline small mb-0" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));">
          {admins.map(av => (
            <li key={av.person.id} className="list-inline-item" style="text-overflow: ellipsis; overflow: hidden;">
              <PersonListing person={av.person} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  fediseer() {
    return (
      <>
        <h6 class="mb-1 mt-1 font-monospace">Member of the <a href={fediseerInfo} class="fw-semibold" >Fediseer</a> network:</h6>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr);">
          <img src={`https://fediseer.com/api/v1/badges/guarantees/${this.domain}.svg`} alt="guarantor" class="me-4" />
          <img src={`https://fediseer.com/api/v1/badges/endorsements/${this.domain}.svg`} alt="endorsements" />
        </div>
      </>
    )
  }

  handleCollapseSidebar(i: SiteSidebar) {
    i.setState({ collapsed: !i.state.collapsed });
  }
}
