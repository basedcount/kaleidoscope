import {
  communityToChoice,
  fetchCommunities,
  fetchThemeList,
  fetchUsers,
  myAuth,
  myAuthRequired,
  personToChoice,
  setIsoData,
  setTheme,
  showLocal,
  updateCommunityBlock,
  updatePersonBlock,
} from "@utils/app";
import { capitalizeFirstLetter, debounce } from "@utils/helpers";
import { Choice } from "@utils/types";
import classNames from "classnames";
import { NoOptionI18nKeys } from "i18next";
import { Component, linkEvent } from "inferno";
import {
  BlockCommunityResponse,
  BlockPersonResponse,
  CommunityBlockView,
  DeleteAccountResponse,
  GetSiteResponse,
  ListingType,
  LoginResponse,
  PersonBlockView,
  SortType,
} from "lemmy-js-client";
import { elementUrl, emDash, relTags } from "../../config";
import { UserService } from "../../services";
import { HttpService, RequestState } from "../../services/HttpService";
import { I18NextService, languages } from "../../services/I18NextService";
import { setupTippy } from "../../tippy";
import { toast } from "../../toast";
import { HtmlTags } from "../common/html-tags";
import { Icon, Spinner } from "../common/icon";
import { ImageUploadForm } from "../common/image-upload-form";
import { LanguageSelect } from "../common/language-select";
import { ListingTypeSelect } from "../common/listing-type-select";
import { MarkdownTextArea } from "../common/markdown-textarea";
import PasswordInput from "../common/password-input";
import { SearchableSelect } from "../common/searchable-select";
import { SortSelect } from "../common/sort-select";
import Tabs from "../common/tabs";
import { CommunityLink } from "../community/community-link";
import { PersonListing } from "./person-listing";
import { fediseerInfo } from "../../config";
import { isBrowser } from "@utils/browser";

interface SettingsState {
  saveRes: RequestState<LoginResponse>;
  changePasswordRes: RequestState<LoginResponse>;
  deleteAccountRes: RequestState<DeleteAccountResponse>;
  // TODO redo these forms
  saveUserSettingsForm: {
    show_nsfw?: boolean;
    blur_nsfw?: boolean;
    auto_expand?: boolean;
    theme?: string;
    default_sort_type?: SortType;
    default_listing_type?: ListingType;
    interface_language?: string;
    avatar?: string;
    banner?: string;
    display_name?: string;
    email?: string;
    bio?: string;
    matrix_user_id?: string;
    show_avatars?: boolean;
    show_scores?: boolean;
    send_notifications_to_email?: boolean;
    bot_account?: boolean;
    show_bot_accounts?: boolean;
    show_read_posts?: boolean;
    show_new_post_notifs?: boolean;
    discussion_languages?: number[];
    generate_totp_2fa?: boolean;
    open_links_in_new_tab?: boolean;
  };
  changePasswordForm: {
    new_password?: string;
    new_password_verify?: string;
    old_password?: string;
  };
  deleteAccountForm: {
    password?: string;
  };
  personBlocks: PersonBlockView[];
  communityBlocks: CommunityBlockView[];
  currentTab: string;
  themeList: string[];
  deleteAccountShowConfirm: boolean;
  siteRes: GetSiteResponse;
  searchCommunityLoading: boolean;
  searchCommunityOptions: Choice[];
  searchPersonLoading: boolean;
  searchPersonOptions: Choice[];
  fediseerKey: string;
  fediseerFilter: string;
}

type FilterType = "user" | "community";

const Filter = ({
  filterType,
  options,
  onChange,
  onSearch,
  loading,
}: {
  filterType: FilterType;
  options: Choice[];
  onSearch: (text: string) => void;
  onChange: (choice: Choice) => void;
  loading: boolean;
}) => (
  <div className="mb-3 row">
    <label
      className="col-md-4 col-form-label"
      htmlFor={`block-${filterType}-filter`}
    >
      {I18NextService.i18n.t(`block_${filterType}` as NoOptionI18nKeys)}
    </label>
    <div className="col-md-8">
      <SearchableSelect
        id={`block-${filterType}-filter`}
        options={[
          { label: emDash, value: "0", disabled: true } as Choice,
        ].concat(options)}
        loading={loading}
        onChange={onChange}
        onSearch={onSearch}
      />
    </div>
  </div>
);

export class Settings extends Component<any, SettingsState> {
  private isoData = setIsoData(this.context);
  state: SettingsState = {
    saveRes: { state: "empty" },
    deleteAccountRes: { state: "empty" },
    changePasswordRes: { state: "empty" },
    saveUserSettingsForm: {},
    changePasswordForm: {},
    deleteAccountShowConfirm: false,
    deleteAccountForm: {},
    personBlocks: [],
    communityBlocks: [],
    currentTab: "settings",
    siteRes: this.isoData.site_res,
    themeList: [],
    searchCommunityLoading: false,
    searchCommunityOptions: [],
    searchPersonLoading: false,
    searchPersonOptions: [],
    fediseerKey: this.getFediseerKeyInitialValue(),
    fediseerFilter: this.getFediseerFilterInitialValue()
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.handleSortTypeChange = this.handleSortTypeChange.bind(this);
    this.handleListingTypeChange = this.handleListingTypeChange.bind(this);
    this.handleBioChange = this.handleBioChange.bind(this);
    this.handleDiscussionLanguageChange =
      this.handleDiscussionLanguageChange.bind(this);

    this.handleAvatarUpload = this.handleAvatarUpload.bind(this);
    this.handleAvatarRemove = this.handleAvatarRemove.bind(this);

    this.handleBannerUpload = this.handleBannerUpload.bind(this);
    this.handleBannerRemove = this.handleBannerRemove.bind(this);
    this.userSettings = this.userSettings.bind(this);
    this.blockCards = this.blockCards.bind(this);

    this.handleBlockPerson = this.handleBlockPerson.bind(this);
    this.handleBlockCommunity = this.handleBlockCommunity.bind(this);

    const mui = UserService.Instance.myUserInfo;
    if (mui) {
      const {
        local_user: {
          show_nsfw,
          blur_nsfw,
          auto_expand,
          theme,
          default_sort_type,
          default_listing_type,
          interface_language,
          show_avatars,
          show_bot_accounts,
          show_scores,
          show_read_posts,
          show_new_post_notifs,
          send_notifications_to_email,
          email,
        },
        person: {
          avatar,
          banner,
          display_name,
          bot_account,
          bio,
          matrix_user_id,
        },
      } = mui.local_user_view;

      this.state = {
        ...this.state,
        personBlocks: mui.person_blocks,
        communityBlocks: mui.community_blocks,
        saveUserSettingsForm: {
          ...this.state.saveUserSettingsForm,
          show_nsfw,
          blur_nsfw,
          auto_expand,
          theme: theme ?? "browser",
          default_sort_type,
          default_listing_type,
          interface_language,
          discussion_languages: mui.discussion_languages,
          avatar,
          banner,
          display_name,
          show_avatars,
          bot_account,
          show_bot_accounts,
          show_scores,
          show_read_posts,
          show_new_post_notifs,
          email,
          bio,
          send_notifications_to_email,
          matrix_user_id,
        },
      };
    }
  }

  async componentDidMount() {
    setupTippy();
    this.setState({ themeList: await fetchThemeList() });
  }

  get documentTitle(): string {
    return I18NextService.i18n.t("settings");
  }

  render() {
    return (
      <div className="person-settings container-lg">
        <HtmlTags
          title={this.documentTitle}
          path={this.context.router.route.match.url}
          description={this.documentTitle}
          image={this.state.saveUserSettingsForm.avatar}
        />
        <Tabs
          tabs={[
            {
              key: "settings",
              label: I18NextService.i18n.t("settings"),
              getNode: this.userSettings,
            },
            {
              key: "blocks",
              label: I18NextService.i18n.t("blocks"),
              getNode: this.blockCards,
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
                  {this.fediseerAdmin()}
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  }

  userSettings(isSelected: boolean) {
    return (
      <div
        className={classNames("tab-pane show", {
          active: isSelected,
        })}
        role="tabpanel"
        id="settings-tab-pane"
      >
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="card border-secondary mb-3">
              <div className="card-body">{this.saveUserSettingsHtmlForm()}</div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card border-secondary mb-3">
              <div className="card-body">{this.changePasswordHtmlForm()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  blockCards(isSelected: boolean) {
    return (
      <div
        className={classNames("tab-pane", {
          active: isSelected,
        })}
        role="tabpanel"
        id="blocks-tab-pane"
      >
        <div className="row">
          <div className="col-12 col-md-6">
            <div className="card border-secondary mb-3">
              <div className="card-body">{this.blockUserCard()}</div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card border-secondary mb-3">
              <div className="card-body">{this.blockCommunityCard()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  changePasswordHtmlForm() {
    return (
      <>
        <h2 className="h5">{I18NextService.i18n.t("change_password")}</h2>
        <form onSubmit={linkEvent(this, this.handleChangePasswordSubmit)}>
          <div className="mb-3">
            <PasswordInput
              id="new-password"
              value={this.state.changePasswordForm.new_password}
              onInput={linkEvent(this, this.handleNewPasswordChange)}
              showStrength
              label={I18NextService.i18n.t("new_password")}
              isNew
            />
          </div>
          <div className="mb-3">
            <PasswordInput
              id="verify-new-password"
              value={this.state.changePasswordForm.new_password_verify}
              onInput={linkEvent(this, this.handleNewPasswordVerifyChange)}
              label={I18NextService.i18n.t("verify_password")}
              isNew
            />
          </div>
          <div className="mb-3">
            <PasswordInput
              id="user-old-password"
              value={this.state.changePasswordForm.old_password}
              onInput={linkEvent(this, this.handleOldPasswordChange)}
              label={I18NextService.i18n.t("old_password")}
            />
          </div>
          <div className="input-group mb-3">
            <button
              type="submit"
              className="btn d-block btn-secondary me-4 w-100"
            >
              {this.state.changePasswordRes.state === "loading" ? (
                <Spinner />
              ) : (
                capitalizeFirstLetter(I18NextService.i18n.t("save"))
              )}
            </button>
          </div>
        </form>
      </>
    );
  }

  blockUserCard() {
    const { searchPersonLoading, searchPersonOptions } = this.state;

    return (
      <div>
        <Filter
          filterType="user"
          loading={searchPersonLoading}
          onChange={this.handleBlockPerson}
          onSearch={this.handlePersonSearch}
          options={searchPersonOptions}
        />
        {this.blockedUsersList()}
      </div>
    );
  }

  blockedUsersList() {
    return (
      <>
        <h2 className="h5">{I18NextService.i18n.t("blocked_users")}</h2>
        <ul className="list-unstyled mb-0">
          {this.state.personBlocks.map(pb => (
            <li key={pb.target.id}>
              <span>
                <PersonListing person={pb.target} />
                <button
                  className="btn btn-sm"
                  onClick={linkEvent(
                    { ctx: this, recipientId: pb.target.id },
                    this.handleUnblockPerson,
                  )}
                  data-tippy-content={I18NextService.i18n.t("unblock_user")}
                >
                  <Icon icon="x" classes="icon-inline" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  blockCommunityCard() {
    const { searchCommunityLoading, searchCommunityOptions } = this.state;

    return (
      <div>
        <Filter
          filterType="community"
          loading={searchCommunityLoading}
          onChange={this.handleBlockCommunity}
          onSearch={this.handleCommunitySearch}
          options={searchCommunityOptions}
        />
        {this.blockedCommunitiesList()}
      </div>
    );
  }

  blockedCommunitiesList() {
    return (
      <>
        <h2 className="h5">{I18NextService.i18n.t("blocked_communities")}</h2>
        <ul className="list-unstyled mb-0">
          {this.state.communityBlocks.map(cb => (
            <li key={cb.community.id}>
              <span>
                <CommunityLink community={cb.community} />
                <button
                  className="btn btn-sm"
                  onClick={linkEvent(
                    { ctx: this, communityId: cb.community.id },
                    this.handleUnblockCommunity,
                  )}
                  data-tippy-content={I18NextService.i18n.t(
                    "unblock_community",
                  )}
                >
                  <Icon icon="x" classes="icon-inline" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  saveUserSettingsHtmlForm() {
    const selectedLangs = this.state.saveUserSettingsForm.discussion_languages;

    return (
      <>
        <h2 className="h5">{I18NextService.i18n.t("settings")}</h2>
        <form onSubmit={linkEvent(this, this.handleSaveSettingsSubmit)}>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label" htmlFor="display-name">
              {I18NextService.i18n.t("display_name")}
            </label>
            <div className="col-sm-9">
              <input
                id="display-name"
                type="text"
                className="form-control"
                placeholder={I18NextService.i18n.t("optional")}
                value={this.state.saveUserSettingsForm.display_name}
                onInput={linkEvent(this, this.handleDisplayNameChange)}
                pattern="^(?!@)(.+)$"
                minLength={3}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label" htmlFor="user-bio">
              {I18NextService.i18n.t("bio")}
            </label>
            <div className="col-sm-9">
              <MarkdownTextArea
                initialContent={this.state.saveUserSettingsForm.bio}
                onContentChange={this.handleBioChange}
                maxLength={300}
                hideNavigationWarnings
                allLanguages={this.state.siteRes.all_languages}
                siteLanguages={this.state.siteRes.discussion_languages}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label" htmlFor="user-email">
              {I18NextService.i18n.t("email")}
            </label>
            <div className="col-sm-9">
              <input
                type="email"
                id="user-email"
                className="form-control"
                placeholder={I18NextService.i18n.t("optional")}
                value={this.state.saveUserSettingsForm.email}
                onInput={linkEvent(this, this.handleEmailChange)}
                minLength={3}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label" htmlFor="matrix-user-id">
              <a href={elementUrl} rel={relTags}>
                {I18NextService.i18n.t("matrix_user_id")}
              </a>
            </label>
            <div className="col-sm-9">
              <input
                id="matrix-user-id"
                type="text"
                className="form-control"
                placeholder="@user:example.com"
                value={this.state.saveUserSettingsForm.matrix_user_id}
                onInput={linkEvent(this, this.handleMatrixUserIdChange)}
                pattern="^@[A-Za-z0-9._=-]+:[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label">
              {I18NextService.i18n.t("avatar")}
            </label>
            <div className="col-sm-9">
              <ImageUploadForm
                uploadTitle={I18NextService.i18n.t("upload_avatar")}
                imageSrc={this.state.saveUserSettingsForm.avatar}
                onUpload={this.handleAvatarUpload}
                onRemove={this.handleAvatarRemove}
                rounded
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label">
              {I18NextService.i18n.t("banner")}
            </label>
            <div className="col-sm-9">
              <ImageUploadForm
                uploadTitle={I18NextService.i18n.t("upload_banner")}
                imageSrc={this.state.saveUserSettingsForm.banner}
                onUpload={this.handleBannerUpload}
                onRemove={this.handleBannerRemove}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-3 form-label" htmlFor="user-language">
              {I18NextService.i18n.t("interface_language")}
            </label>
            <div className="col-sm-9">
              <select
                id="user-language"
                value={this.state.saveUserSettingsForm.interface_language}
                onChange={linkEvent(this, this.handleInterfaceLangChange)}
                className="form-select d-inline-block w-auto"
              >
                <option disabled aria-hidden="true">
                  {I18NextService.i18n.t("interface_language")}
                </option>
                <option value="browser">
                  {I18NextService.i18n.t("browser_default")}
                </option>
                <option disabled aria-hidden="true">
                  ──
                </option>
                {languages
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <LanguageSelect
            allLanguages={this.state.siteRes.all_languages}
            siteLanguages={this.state.siteRes.discussion_languages}
            selectedLanguageIds={selectedLangs}
            multiple={true}
            showLanguageWarning={true}
            showAll={true}
            showSite
            onChange={this.handleDiscussionLanguageChange}
          />
          <div className="mb-3 row">
            <label className="col-sm-3 col-form-label" htmlFor="user-theme">
              {I18NextService.i18n.t("theme")}
            </label>
            <div className="col-sm-9">
              <select
                id="user-theme"
                value={this.state.saveUserSettingsForm.theme}
                onChange={linkEvent(this, this.handleThemeChange)}
                className="form-select d-inline-block w-auto"
              >
                <option disabled aria-hidden="true">
                  {I18NextService.i18n.t("theme")}
                </option>
                <option value="browser">
                  {I18NextService.i18n.t("browser_default")}
                </option>
                <option value="browser-compact">
                  {I18NextService.i18n.t("browser_default_compact")}
                </option>
                {this.state.themeList.map(theme => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <form className="mb-3 row">
            <label className="col-sm-3 col-form-label">
              {I18NextService.i18n.t("type")}
            </label>
            <div className="col-sm-9">
              <ListingTypeSelect
                type_={
                  this.state.saveUserSettingsForm.default_listing_type ??
                  "Local"
                }
                showLocal={showLocal(this.isoData)}
                showSubscribed
                onChange={this.handleListingTypeChange}
              />
            </div>
          </form>
          <form className="mb-3 row">
            <label className="col-sm-3 col-form-label">
              {I18NextService.i18n.t("sort_type")}
            </label>
            <div className="col-sm-9">
              <SortSelect
                sort={
                  this.state.saveUserSettingsForm.default_sort_type ?? "Active"
                }
                onChange={this.handleSortTypeChange}
              />
            </div>
          </form>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-nsfw"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_nsfw}
                onChange={linkEvent(this, this.handleShowNsfwChange)}
              />
              <label className="form-check-label" htmlFor="user-show-nsfw">
                {I18NextService.i18n.t("show_nsfw")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-blur-nsfw"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.blur_nsfw}
                onChange={linkEvent(this, this.handleBlurNsfwChange)}
              />
              <label className="form-check-label" htmlFor="user-blur-nsfw">
                {I18NextService.i18n.t("blur_nsfw")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-auto-expand"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.auto_expand}
                onChange={linkEvent(this, this.handleAutoExpandChange)}
              />
              <label className="form-check-label" htmlFor="user-auto-expand">
                {I18NextService.i18n.t("auto_expand")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-scores"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_scores}
                onChange={linkEvent(this, this.handleShowScoresChange)}
              />
              <label className="form-check-label" htmlFor="user-show-scores">
                {I18NextService.i18n.t("show_scores")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-avatars"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_avatars}
                onChange={linkEvent(this, this.handleShowAvatarsChange)}
              />
              <label className="form-check-label" htmlFor="user-show-avatars">
                {I18NextService.i18n.t("show_avatars")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-bot-account"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.bot_account}
                onChange={linkEvent(this, this.handleBotAccount)}
              />
              <label className="form-check-label" htmlFor="user-bot-account">
                {I18NextService.i18n.t("bot_account")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-bot-accounts"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_bot_accounts}
                onChange={linkEvent(this, this.handleShowBotAccounts)}
              />
              <label
                className="form-check-label"
                htmlFor="user-show-bot-accounts"
              >
                {I18NextService.i18n.t("show_bot_accounts")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-read-posts"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_read_posts}
                onChange={linkEvent(this, this.handleReadPosts)}
              />
              <label
                className="form-check-label"
                htmlFor="user-show-read-posts"
              >
                {I18NextService.i18n.t("show_read_posts")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-show-new-post-notifs"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.show_new_post_notifs}
                onChange={linkEvent(this, this.handleShowNewPostNotifs)}
              />
              <label
                className="form-check-label"
                htmlFor="user-show-new-post-notifs"
              >
                {I18NextService.i18n.t("show_new_post_notifs")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-send-notifications-to-email"
                type="checkbox"
                disabled={!this.state.saveUserSettingsForm.email}
                checked={
                  this.state.saveUserSettingsForm.send_notifications_to_email
                }
                onChange={linkEvent(
                  this,
                  this.handleSendNotificationsToEmailChange,
                )}
              />
              <label
                className="form-check-label"
                htmlFor="user-send-notifications-to-email"
              >
                {I18NextService.i18n.t("send_notifications_to_email")}
              </label>
            </div>
          </div>
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-open-links-in-new-tab"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.open_links_in_new_tab}
                onChange={linkEvent(this, this.handleOpenInNewTab)}
              />
              <label
                className="form-check-label"
                htmlFor="user-open-links-in-new-tab"
              >
                {I18NextService.i18n.t("open_links_in_new_tab")}
              </label>
            </div>
          </div>
          {this.totpSection()}
          <div className="input-group mb-3">
            <button type="submit" className="btn d-block btn-secondary me-4">
              {this.state.saveRes.state === "loading" ? (
                <Spinner />
              ) : (
                capitalizeFirstLetter(I18NextService.i18n.t("save"))
              )}
            </button>
          </div>
          <hr />
          <form
            className="mb-3"
            onSubmit={linkEvent(this, this.handleDeleteAccount)}
          >
            <button
              type="button"
              className="btn d-block btn-danger"
              onClick={linkEvent(
                this,
                this.handleDeleteAccountShowConfirmToggle,
              )}
            >
              {I18NextService.i18n.t("delete_account")}
            </button>
            {this.state.deleteAccountShowConfirm && (
              <>
                <label
                  className="my-2 alert alert-danger d-block"
                  role="alert"
                  htmlFor="password-delete-account"
                >
                  {I18NextService.i18n.t("delete_account_confirm")}
                </label>
                <PasswordInput
                  id="password-delete-account"
                  value={this.state.deleteAccountForm.password}
                  onInput={linkEvent(
                    this,
                    this.handleDeleteAccountPasswordChange,
                  )}
                  className="my-2"
                />
                <button
                  type="submit"
                  className="btn btn-danger me-4"
                  disabled={!this.state.deleteAccountForm.password}
                >
                  {this.state.deleteAccountRes.state === "loading" ? (
                    <Spinner />
                  ) : (
                    capitalizeFirstLetter(I18NextService.i18n.t("delete"))
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={linkEvent(
                    this,
                    this.handleDeleteAccountShowConfirmToggle,
                  )}
                >
                  {I18NextService.i18n.t("cancel")}
                </button>
              </>
            )}
          </form>
        </form>
      </>
    );
  }

  totpSection() {
    const totpUrl =
      UserService.Instance.myUserInfo?.local_user_view.local_user.totp_2fa_url;

    return (
      <>
        {!totpUrl && (
          <div className="input-group mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                id="user-generate-totp"
                type="checkbox"
                checked={this.state.saveUserSettingsForm.generate_totp_2fa}
                onChange={linkEvent(this, this.handleGenerateTotp)}
              />
              <label className="form-check-label" htmlFor="user-generate-totp">
                {I18NextService.i18n.t("set_up_two_factor")}
              </label>
            </div>
          </div>
        )}

        {totpUrl && (
          <>
            <div>
              <a className="btn btn-secondary mb-2" href={totpUrl}>
                {I18NextService.i18n.t("two_factor_link")}
              </a>
            </div>
            <div className="input-group mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="user-remove-totp"
                  type="checkbox"
                  checked={
                    this.state.saveUserSettingsForm.generate_totp_2fa === false
                  }
                  onChange={linkEvent(this, this.handleRemoveTotp)}
                />
                <label className="form-check-label" htmlFor="user-remove-totp">
                  {I18NextService.i18n.t("remove_two_factor")}
                </label>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  handlePersonSearch = debounce(async (text: string) => {
    this.setState({ searchPersonLoading: true });

    const searchPersonOptions: Choice[] = [];

    if (text.length > 0) {
      searchPersonOptions.push(...(await fetchUsers(text)).map(personToChoice));
    }

    this.setState({
      searchPersonLoading: false,
      searchPersonOptions,
    });
  });

  handleCommunitySearch = debounce(async (text: string) => {
    this.setState({ searchCommunityLoading: true });

    const searchCommunityOptions: Choice[] = [];

    if (text.length > 0) {
      searchCommunityOptions.push(
        ...(await fetchCommunities(text)).map(communityToChoice),
      );
    }

    this.setState({
      searchCommunityLoading: false,
      searchCommunityOptions,
    });
  });

  async handleBlockPerson({ value }: Choice) {
    if (value !== "0") {
      const res = await HttpService.client.blockPerson({
        person_id: Number(value),
        block: true,
        auth: myAuthRequired(),
      });
      this.personBlock(res);
    }
  }

  async handleUnblockPerson({
    ctx,
    recipientId,
  }: {
    ctx: Settings;
    recipientId: number;
  }) {
    const res = await HttpService.client.blockPerson({
      person_id: recipientId,
      block: false,
      auth: myAuthRequired(),
    });
    ctx.personBlock(res);
  }

  async handleBlockCommunity({ value }: Choice) {
    if (value !== "0") {
      const res = await HttpService.client.blockCommunity({
        community_id: Number(value),
        block: true,
        auth: myAuthRequired(),
      });
      this.communityBlock(res);
    }
  }

  async handleUnblockCommunity(i: { ctx: Settings; communityId: number }) {
    const auth = myAuth();
    if (auth) {
      const res = await HttpService.client.blockCommunity({
        community_id: i.communityId,
        block: false,
        auth: myAuthRequired(),
      });
      i.ctx.communityBlock(res);
    }
  }

  handleShowNsfwChange(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.show_nsfw = event.target.checked), s),
    );
  }

  handleBlurNsfwChange(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.blur_nsfw = event.target.checked), s),
    );
  }

  handleAutoExpandChange(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.auto_expand = event.target.checked), s),
    );
  }

  handleShowAvatarsChange(i: Settings, event: any) {
    const mui = UserService.Instance.myUserInfo;
    if (mui) {
      mui.local_user_view.local_user.show_avatars = event.target.checked;
    }
    i.setState(
      s => ((s.saveUserSettingsForm.show_avatars = event.target.checked), s),
    );
  }

  handleBotAccount(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.bot_account = event.target.checked), s),
    );
  }

  handleShowBotAccounts(i: Settings, event: any) {
    i.setState(
      s => (
        (s.saveUserSettingsForm.show_bot_accounts = event.target.checked), s
      ),
    );
  }

  handleReadPosts(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.show_read_posts = event.target.checked), s),
    );
  }

  handleShowNewPostNotifs(i: Settings, event: any) {
    i.setState(
      s => (
        (s.saveUserSettingsForm.show_new_post_notifs = event.target.checked), s
      ),
    );
  }

  handleOpenInNewTab(i: Settings, event: any) {
    i.setState(
      s => (
        (s.saveUserSettingsForm.open_links_in_new_tab = event.target.checked), s
      ),
    );
  }

  handleShowScoresChange(i: Settings, event: any) {
    const mui = UserService.Instance.myUserInfo;
    if (mui) {
      mui.local_user_view.local_user.show_scores = event.target.checked;
    }
    i.setState(
      s => ((s.saveUserSettingsForm.show_scores = event.target.checked), s),
    );
  }

  handleGenerateTotp(i: Settings, event: any) {
    // Coerce false to undefined here, so it won't generate it.
    const checked: boolean | undefined = event.target.checked || undefined;
    if (checked) {
      toast(I18NextService.i18n.t("two_factor_setup_instructions"));
    }
    i.setState(s => ((s.saveUserSettingsForm.generate_totp_2fa = checked), s));
  }

  handleRemoveTotp(i: Settings, event: any) {
    // Coerce true to undefined here, so it won't generate it.
    const checked: boolean | undefined = !event.target.checked && undefined;
    i.setState(s => ((s.saveUserSettingsForm.generate_totp_2fa = checked), s));
  }

  handleSendNotificationsToEmailChange(i: Settings, event: any) {
    i.setState(
      s => (
        (s.saveUserSettingsForm.send_notifications_to_email =
          event.target.checked),
        s
      ),
    );
  }

  handleThemeChange(i: Settings, event: any) {
    i.setState(s => ((s.saveUserSettingsForm.theme = event.target.value), s));
    setTheme(event.target.value, true);
  }

  handleInterfaceLangChange(i: Settings, event: any) {
    const newLang = event.target.value ?? "browser";
    I18NextService.i18n.changeLanguage(
      newLang === "browser" ? navigator.languages : newLang,
    );

    i.setState(
      s => (
        (s.saveUserSettingsForm.interface_language = event.target.value), s
      ),
    );
  }

  handleDiscussionLanguageChange(val: number[]) {
    this.setState(
      s => ((s.saveUserSettingsForm.discussion_languages = val), s),
    );
  }

  handleSortTypeChange(val: SortType) {
    this.setState(s => ((s.saveUserSettingsForm.default_sort_type = val), s));
  }

  handleListingTypeChange(val: ListingType) {
    this.setState(
      s => ((s.saveUserSettingsForm.default_listing_type = val), s),
    );
  }

  handleEmailChange(i: Settings, event: any) {
    i.setState(s => ((s.saveUserSettingsForm.email = event.target.value), s));
  }

  handleBioChange(val: string) {
    this.setState(s => ((s.saveUserSettingsForm.bio = val), s));
  }

  handleAvatarUpload(url: string) {
    this.setState(s => ((s.saveUserSettingsForm.avatar = url), s));
  }

  handleAvatarRemove() {
    this.setState(s => ((s.saveUserSettingsForm.avatar = ""), s));
  }

  handleBannerUpload(url: string) {
    this.setState(s => ((s.saveUserSettingsForm.banner = url), s));
  }

  handleBannerRemove() {
    this.setState(s => ((s.saveUserSettingsForm.banner = ""), s));
  }

  handleDisplayNameChange(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.display_name = event.target.value), s),
    );
  }

  handleMatrixUserIdChange(i: Settings, event: any) {
    i.setState(
      s => ((s.saveUserSettingsForm.matrix_user_id = event.target.value), s),
    );
  }

  handleNewPasswordChange(i: Settings, event: any) {
    const newPass: string | undefined =
      event.target.value === "" ? undefined : event.target.value;
    i.setState(s => ((s.changePasswordForm.new_password = newPass), s));
  }

  handleNewPasswordVerifyChange(i: Settings, event: any) {
    const newPassVerify: string | undefined =
      event.target.value === "" ? undefined : event.target.value;
    i.setState(
      s => ((s.changePasswordForm.new_password_verify = newPassVerify), s),
    );
  }

  handleOldPasswordChange(i: Settings, event: any) {
    const oldPass: string | undefined =
      event.target.value === "" ? undefined : event.target.value;
    i.setState(s => ((s.changePasswordForm.old_password = oldPass), s));
  }

  async handleSaveSettingsSubmit(i: Settings, event: any) {
    event.preventDefault();
    i.setState({ saveRes: { state: "loading" } });

    const saveRes = await HttpService.client.saveUserSettings({
      ...i.state.saveUserSettingsForm,
      auth: myAuthRequired(),
    });

    if (saveRes.state === "success") {
      UserService.Instance.login({
        res: saveRes.data,
        showToast: false,
      });
      toast(I18NextService.i18n.t("saved"));
      window.scrollTo(0, 0);
    }

    i.setState({ saveRes });
  }

  async handleChangePasswordSubmit(i: Settings, event: any) {
    event.preventDefault();
    const { new_password, new_password_verify, old_password } =
      i.state.changePasswordForm;

    if (new_password && old_password && new_password_verify) {
      i.setState({ changePasswordRes: { state: "loading" } });
      const changePasswordRes = await HttpService.client.changePassword({
        new_password,
        new_password_verify,
        old_password,
        auth: myAuthRequired(),
      });
      if (changePasswordRes.state === "success") {
        UserService.Instance.login({
          res: changePasswordRes.data,
          showToast: false,
        });
        window.scrollTo(0, 0);
        toast(I18NextService.i18n.t("password_changed"));
      }

      i.setState({ changePasswordRes });
    }
  }

  handleDeleteAccountShowConfirmToggle(i: Settings) {
    i.setState({ deleteAccountShowConfirm: !i.state.deleteAccountShowConfirm });
  }

  handleDeleteAccountPasswordChange(i: Settings, event: any) {
    i.setState(s => ((s.deleteAccountForm.password = event.target.value), s));
  }

  async handleDeleteAccount(i: Settings, event: Event) {
    event.preventDefault();
    const password = i.state.deleteAccountForm.password;
    if (password) {
      i.setState({ deleteAccountRes: { state: "loading" } });
      const deleteAccountRes = await HttpService.client.deleteAccount({
        password,
        auth: myAuthRequired(),
        // TODO: promt user weather he wants the content to be deleted
        delete_content: false,
      });
      if (deleteAccountRes.state === "success") {
        UserService.Instance.logout();
        this.context.router.history.replace("/");
      }

      i.setState({ deleteAccountRes });
    }
  }

  handleSwitchTab(i: { ctx: Settings; tab: string }) {
    i.ctx.setState({ currentTab: i.tab });
  }

  personBlock(res: RequestState<BlockPersonResponse>) {
    if (res.state === "success") {
      updatePersonBlock(res.data);
      const mui = UserService.Instance.myUserInfo;
      if (mui) {
        this.setState({ personBlocks: mui.person_blocks });
      }
    }
  }

  communityBlock(res: RequestState<BlockCommunityResponse>) {
    if (res.state === "success") {
      updateCommunityBlock(res.data);
      const mui = UserService.Instance.myUserInfo;
      if (mui) {
        this.setState({ communityBlocks: mui.community_blocks });
      }
    }
  }

  fediseerAdmin() {
    //TODO: if Fediseer is off hide tab
    //TODO: hide admin section from non admins
    //TODO: create map of settings, print key in "currently on", write key to localstorage and use it to handle hiding logic

    return (
      <div className="row">
        {/* User settings */}
        <div className="col-12 col-md-6">
          <div className="card border-secondary mb-3">
            <div className="card-body">
              <h2 className="h4 mb-3" style="text-transform: capitalize;">Content filters</h2>
              <p>
                Your instance is part of the <strong>Fediseer network</strong>. Because of this, you may optionally enable an automated content filtering system to remove untrusted actors from your feed.
              </p>
              <p>
                The filter is configured according to the <i>endorsements</i>, <i>hesitations</i> and <i>censors</i> submitted by the <strong>{this.state.siteRes.site_view.site.name}</strong> admin team through Fediseer.
                Check out the <a href={fediseerInfo}>Fediseer Glossary</a> to learn more. The filter is disabled by default.
              </p>

              <div class="w-75">
                The following filtering options are available:
                <ul class="list-group my-2">
                  <li class="list-group-item list-group-item-secondary">
                    <label class="w-100" for="fediseer-disabled">
                      <input type="radio" class="me-1" name="filterOption" value="disabled" id="fediseer-disabled" checked={this.state.fediseerFilter === 'disabled'} onChange={this.setFediseerFilter} />
                      <span class="ms-2">
                        Filter disabled
                      </span>
                    </label>
                  </li>
                  <li class="list-group-item list-group-item-success d-flex flex-row">
                    <input type="radio" class="me-1" name="filterOption" value="moderate" id="fediseer-moderate" checked={this.state.fediseerFilter === 'moderate'} onChange={this.setFediseerFilter} />
                    <label class="d-flex flex-column ms-2 w-100" for="fediseer-moderate">
                      <span>
                        Remove dangerous content (moderate)
                      </span>
                      <small>
                        Content from <i>censored</i> instances won't be shown
                      </small>
                    </label>
                  </li>
                  <li class="list-group-item list-group-item-warning  d-flex flex-row">
                    <input type="radio" class="me-1" name="filterOption" value="strict" id="fediseer-strict" checked={this.state.fediseerFilter === 'strict'} onChange={this.setFediseerFilter} />
                    <label class="d-flex flex-column ms-2 w-100" for="fediseer-strict">
                      <span>
                        Remove untrusted content (strict)
                      </span>
                      <small>
                        Content from <i>hesitated</i> instances won't be shown
                      </small>
                    </label>
                  </li>
                  <li class="list-group-item list-group-item-danger  d-flex flex-row">
                    <input type="radio" class="me-1" name="filterOption" value="very-strict" id="fediseer-very-strict" checked={this.state.fediseerFilter === 'very-strict'} onChange={this.setFediseerFilter} />
                    <label class="d-flex flex-column ms-2 w-100" for="fediseer-very-strict">
                      <span>
                        Only show trusted content (very strict)
                      </span>
                      <small>
                        Content from non  <i>endorsed</i> instances won't be shown
                      </small>
                    </label>
                  </li>
                </ul>

                <span class="mt-3">
                  Currently set to: <span class="font-monospace">{this.state.fediseerFilter.replace('-', ' ')}</span>.
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Admin settngs */}
        <div className="col-12 col-md-6">
          <div className="card border-secondary mb-3">
            <div className="card-body">
              < h2 className="h4 mb-3" style="text-transform: capitalize;" > {I18NextService.i18n.t("admin")}</h2 >
              <p>
                Only administrators may view this section. From here, you can integrate the Fediseer API with your Lemmy instance.
              </p>
              <p>
                Once an API key has been set up through this page, it will provide you access to Fediseer directly from the Lemmy interface. The following actions are available:
                <ul class="mt-1">
                  <li>Guaranteeing</li>
                  <li>Endorsing</li>
                  <li>Hesitating</li>
                  <li>Censoring</li>
                </ul>
                To learn more about the meaning of these terms, please visit the <a href={fediseerInfo}>Fediseer Glossary</a>.
              </p>
              <h2 class="h6 mb-2 fw-semibold">Your API key</h2>
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
          </div>
        </div>
      </div>

    );
  }

  handleKeyChange = (event: any) => {
    this.setState({ fediseerKey: event.target.value });
  }

  handleKeySave = (_) => {
    localStorage.setItem("FEDISEER_KEY", this.state.fediseerKey);
  }

  getFediseerKeyInitialValue() {
    if (isBrowser()) {
      return localStorage.getItem('FEDISEER_KEY') ?? '';
    }

    return '';
  }

  getFediseerFilterInitialValue() {
    if (isBrowser()) {
      return localStorage.getItem('FEDISEER_FILTER') ?? 'disabled';
    }

    return 'disabled';
  }

  setFediseerFilter = (event: any) => {
    this.setState({ fediseerFilter: event.target.value });
    localStorage.setItem("FEDISEER_FILTER", this.state.fediseerFilter);
  }
}
