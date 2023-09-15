import {
  fetchThemeList,
  myAuthRequired,
  setIsoData,
  showLocal,
} from "@utils/app";
import { capitalizeFirstLetter } from "@utils/helpers";
import { RouteDataResponse } from "@utils/types";
import classNames from "classnames";
import { Component, linkEvent } from "inferno";
import {
  BannedPersonsResponse,
  CreateCustomEmoji,
  DeleteCustomEmoji,
  EditCustomEmoji,
  EditSite,
  GetFederatedInstancesResponse,
  GetSiteResponse,
  PersonView,
} from "lemmy-js-client";
import { InitialFetchRequest } from "../../interfaces";
import { removeFromEmojiDataModel, updateEmojiDataModel } from "../../markdown";
import { FirstLoadService, I18NextService } from "../../services";
import { HttpService, RequestState } from "../../services/HttpService";
import { toast } from "../../toast";
import { HtmlTags } from "../common/html-tags";
import { Spinner } from "../common/icon";
import Tabs from "../common/tabs";
import { PersonListing } from "../person/person-listing";
import { EmojiForm } from "./emojis-form";
import RateLimitForm from "./rate-limit-form";
import { SiteForm } from "./site-form";
import { TaglineForm } from "./tagline-form";
import { fediseerInfo } from "../../config";
import { isBrowser } from "@utils/browser";

type AdminSettingsData = RouteDataResponse<{
  bannedRes: BannedPersonsResponse;
  instancesRes: GetFederatedInstancesResponse;
}>;

interface AdminSettingsState {
  siteRes: GetSiteResponse;
  banned: PersonView[];
  currentTab: string;
  instancesRes: RequestState<GetFederatedInstancesResponse>;
  bannedRes: RequestState<BannedPersonsResponse>;
  leaveAdminTeamRes: RequestState<GetSiteResponse>;
  loading: boolean;
  themeList: string[];
  isIsomorphic: boolean;
  fediseerKey: string;
}

export class AdminSettings extends Component<any, AdminSettingsState> {
  private isoData = setIsoData<AdminSettingsData>(this.context);
  state: AdminSettingsState = {
    siteRes: this.isoData.site_res,
    banned: [],
    currentTab: "site",
    bannedRes: { state: "empty" },
    instancesRes: { state: "empty" },
    leaveAdminTeamRes: { state: "empty" },
    loading: false,
    themeList: [],
    isIsomorphic: false,
    fediseerKey: this.getKeyInitialValue(),
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.handleEditSite = this.handleEditSite.bind(this);
    this.handleEditEmoji = this.handleEditEmoji.bind(this);
    this.handleDeleteEmoji = this.handleDeleteEmoji.bind(this);
    this.handleCreateEmoji = this.handleCreateEmoji.bind(this);

    // Only fetch the data if coming from another route
    if (FirstLoadService.isFirstLoad) {
      const { bannedRes, instancesRes } = this.isoData.routeData;

      this.state = {
        ...this.state,
        bannedRes,
        instancesRes,
        isIsomorphic: true,
      };
    }
  }

  static async fetchInitialData({
    auth,
    client,
  }: InitialFetchRequest): Promise<AdminSettingsData> {
    return {
      bannedRes: await client.getBannedPersons({
        auth: auth as string,
      }),
      instancesRes: await client.getFederatedInstances({
        auth: auth as string,
      }),
    };
  }

  async componentDidMount() {
    if (!this.state.isIsomorphic) {
      await this.fetchData();
    }
  }

  get documentTitle(): string {
    return `${I18NextService.i18n.t("admin_settings")} - ${this.state.siteRes.site_view.site.name
      }`;
  }

  render() {
    const federationData =
      this.state.instancesRes.state === "success"
        ? this.state.instancesRes.data.federated_instances
        : undefined;

    return (
      <div className="admin-settings container-lg">
        <HtmlTags
          title={this.documentTitle}
          path={this.context.router.route.match.url}
        />
        <Tabs
          tabs={[
            {
              key: "site",
              label: I18NextService.i18n.t("site"),
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane show", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="site-tab-pane"
                >
                  <h1 className="h4 mb-4">
                    {I18NextService.i18n.t("site_config")}
                  </h1>
                  <div className="row">
                    <div className="col-12 col-md-6">
                      <SiteForm
                        showLocal={showLocal(this.isoData)}
                        allowedInstances={federationData?.allowed}
                        blockedInstances={federationData?.blocked}
                        onSaveSite={this.handleEditSite}
                        siteRes={this.state.siteRes}
                        themeList={this.state.themeList}
                        loading={this.state.loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">{this.admins()}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "banned_users",
              label: I18NextService.i18n.t("banned_users"),
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="banned_users-tab-pane"
                >
                  {this.bannedUsers()}
                </div>
              ),
            },
            {
              key: "rate_limiting",
              label: "Rate Limiting",
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="rate_limiting-tab-pane"
                >
                  <RateLimitForm
                    rateLimits={
                      this.state.siteRes.site_view.local_site_rate_limit
                    }
                    onSaveSite={this.handleEditSite}
                    loading={this.state.loading}
                  />
                </div>
              ),
            },
            {
              key: "taglines",
              label: I18NextService.i18n.t("taglines"),
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="taglines-tab-pane"
                >
                  <div className="row">
                    <TaglineForm
                      taglines={this.state.siteRes.taglines}
                      onSaveSite={this.handleEditSite}
                      loading={this.state.loading}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: "emojis",
              label: I18NextService.i18n.t("emojis"),
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="emojis-tab-pane"
                >
                  <div className="row">
                    <EmojiForm
                      onCreate={this.handleCreateEmoji}
                      onDelete={this.handleDeleteEmoji}
                      onEdit={this.handleEditEmoji}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: "fediseer",
              label: "Fediseer",
              getNode: isSelected => (
                <div
                  className={classNames("tab-pane", {
                    active: isSelected,
                  })}
                  role="tabpanel"
                  id="banned_users-tab-pane"
                >
                  {this.fediseer()}
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  }

  async fetchData() {
    this.setState({
      bannedRes: { state: "loading" },
      instancesRes: { state: "loading" },
      themeList: [],
    });

    const auth = myAuthRequired();

    const [bannedRes, instancesRes, themeList] = await Promise.all([
      HttpService.client.getBannedPersons({ auth }),
      HttpService.client.getFederatedInstances({ auth }),
      fetchThemeList(),
    ]);

    this.setState({
      bannedRes,
      instancesRes,
      themeList,
    });
  }

  admins() {
    return (
      <>
        <h2 className="h5">
          {capitalizeFirstLetter(I18NextService.i18n.t("admins"))}
        </h2>
        <ul className="list-unstyled">
          {this.state.siteRes.admins.map(admin => (
            <li key={admin.person.id} className="list-inline-item">
              <PersonListing person={admin.person} />
            </li>
          ))}
        </ul>
        {this.leaveAdmin()}
      </>
    );
  }

  leaveAdmin() {
    return (
      <button
        onClick={linkEvent(this, this.handleLeaveAdminTeam)}
        className="btn btn-danger mb-2"
      >
        {this.state.leaveAdminTeamRes.state === "loading" ? (
          <Spinner />
        ) : (
          I18NextService.i18n.t("leave_admin_team")
        )}
      </button>
    );
  }

  bannedUsers() {
    switch (this.state.bannedRes.state) {
      case "loading":
        return (
          <h5>
            <Spinner large />
          </h5>
        );
      case "success": {
        const bans = this.state.bannedRes.data.banned;
        return (
          <>
            <h1 className="h4 mb-4">{I18NextService.i18n.t("banned_users")}</h1>
            <ul className="list-unstyled">
              {bans.map(banned => (
                <li key={banned.person.id} className="list-inline-item">
                  <PersonListing person={banned.person} />
                </li>
              ))}
            </ul>
          </>
        );
      }
    }
  }

  async handleEditSite(form: EditSite) {
    this.setState({ loading: true });

    const editRes = await HttpService.client.editSite(form);

    if (editRes.state === "success") {
      this.setState(s => {
        s.siteRes.site_view = editRes.data.site_view;
        // TODO: Where to get taglines from?
        s.siteRes.taglines = editRes.data.taglines;
        return s;
      });
      toast(I18NextService.i18n.t("site_saved"));
    }

    this.setState({ loading: false });

    return editRes;
  }

  handleSwitchTab(i: { ctx: AdminSettings; tab: string }) {
    i.ctx.setState({ currentTab: i.tab });
  }

  async handleLeaveAdminTeam(i: AdminSettings) {
    i.setState({ leaveAdminTeamRes: { state: "loading" } });
    this.setState({
      leaveAdminTeamRes: await HttpService.client.leaveAdmin({
        auth: myAuthRequired(),
      }),
    });

    if (this.state.leaveAdminTeamRes.state === "success") {
      toast(I18NextService.i18n.t("left_admin_team"));
      this.context.router.history.replace("/");
    }
  }

  async handleEditEmoji(form: EditCustomEmoji) {
    const res = await HttpService.client.editCustomEmoji(form);
    if (res.state === "success") {
      updateEmojiDataModel(res.data.custom_emoji);
    }
  }

  async handleDeleteEmoji(form: DeleteCustomEmoji) {
    const res = await HttpService.client.deleteCustomEmoji(form);
    if (res.state === "success") {
      removeFromEmojiDataModel(res.data.id);
    }
  }

  async handleCreateEmoji(form: CreateCustomEmoji) {
    const res = await HttpService.client.createCustomEmoji(form);
    if (res.state === "success") {
      updateEmojiDataModel(res.data.custom_emoji);
    }
  }

  fediseer() {
    switch (this.state.bannedRes.state) {
      case "loading":
        return (
          <h5>
            <Spinner large />
          </h5>
        );
      case "success": {
        return (
          <div class="w-50">
            <h1 className="h4 mb-3" style="text-transform: capitalize;">Fediseer - {I18NextService.i18n.t("admin")}</h1>
            <p>
              From this page you can integrate the Fediseer API with your Lemmy instance.
            </p>
            <p>
              Once an API key has been set up through this page, you will be able to interact with other instances in the following ways:
              <ul class="mt-1">
                <li>Guaranteeing</li>
                <li>Endorsing</li>
                <li>Hesitating</li>
                <li>Censoring</li>
              </ul>
              To learn more about the meaning of these terms, please visit the <a href={fediseerInfo}>Fediseer Glossary</a>.
            </p>
            <h2 class="h5 mb-2">Your API key</h2>
            <i>If you don't have an API key you can claim one from the <a href="https://gui.fediseer.com/auth/claim-instance">Fediseer GUI</a>.</i>
            <div class="d-flex flex-row gap-3 mb-3 mt-2">
              <input class="form-control" type="text" id="site-desc" placeholder="Enter your key..." value={this.state.fediseerKey} onInput={this.handleKeyChange} />
              <button class="btn btn-secondary me-2" type="submit" onClick={this.handleKeySave}>Save</button>
            </div>
            <p>
              The key will be saved locally and only used when interacting with Fediseer. Your instance's server will never receive it.
              <br />
              If you change browser or log from a different machine you'll have to re-insert the key.
            </p>
          </div>
        );
      }
    }
  }

  handleKeyChange = (event: any) => {
    this.setState({ fediseerKey: event.target.value });
  }

  handleKeySave = (_) => {
    localStorage.setItem("FEDISEER_KEY", this.state.fediseerKey);
  }

  getKeyInitialValue() {
    if (isBrowser()) {
      return localStorage.getItem('FEDISEER_KEY') ?? '';
    }

    return '';
  }
}
