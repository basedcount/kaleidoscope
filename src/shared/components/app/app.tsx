import { isAuthPath, setIsoData } from "@utils/app";
import { dataBsTheme } from "@utils/browser";
import { Component, RefObject, createRef, linkEvent } from "inferno";
import { Provider } from "inferno-i18next-dess";
import { Route, Switch } from "inferno-router";
import { MyUserInfo } from "lemmy-js-client";
import { IsoDataOptionalSite } from "../../interfaces";
import { routes } from "../../routes";
import { FirstLoadService, I18NextService, UserService } from "../../services";
import AuthGuard from "../common/auth-guard";
import ErrorGuard from "../common/error-guard";
import { ErrorPage } from "./error-page";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import "./styles.scss";
import { Theme } from "./theme";
import { EnvVars } from "shared/get-env-vars";

interface AppProps {
  user?: MyUserInfo;
}

interface AppState {
  env?: EnvVars | null;
}

export class App extends Component<AppProps, AppState> {
  private isoData: IsoDataOptionalSite = setIsoData(this.context);
  private readonly mainContentRef: RefObject<HTMLElement>;
  constructor(props: AppProps, context: any) {
    super(props, context);
    this.mainContentRef = createRef();
    this.state = { env: null }
  }

  handleJumpToContent(event) {
    event.preventDefault();
    this.mainContentRef.current?.focus();
  }

  // Fetch env vars from backend - don't send secrets this way, this is all public stuff
  async componentDidMount() {
    try {
      const res = await fetch('/env');
      this.setState({ env: await res.json() });
    } catch (e) {
      console.error(e);
    }
  }

  user = UserService.Instance.myUserInfo;

  render() {
    const siteRes = this.isoData.site_res;
    const siteView = siteRes?.site_view;

    return (
      <>
        <Provider i18next={I18NextService.i18n}>
          <div
            id="app"
            className="lemmy-site"
            data-bs-theme={dataBsTheme(this.props.user)}
          >
            <button
              type="button"
              className="btn skip-link bg-light position-absolute start-0 z-3"
              onClick={linkEvent(this, this.handleJumpToContent)}
            >
              {I18NextService.i18n.t("jump_to_content", "Jump to content")}
            </button>
            {siteView && (
              <Theme defaultTheme={siteView.local_site.default_theme} />
            )}
            <Navbar siteRes={siteRes} donationUrl={this.state?.env?.DONATION_URL} />
            <div className="mt-4 p-0 fl-1">
              <Switch>
                {routes.map(
                  ({ path, component: RouteComponent, fetchInitialData }) => (
                    <Route
                      key={path}
                      path={path}
                      exact
                      component={routeProps => {
                        if (!fetchInitialData) {
                          FirstLoadService.falsify();
                        }

                        return (
                          <ErrorGuard>
                            <div tabIndex={-1}>
                              {RouteComponent &&
                                (isAuthPath(path ?? "") ? (
                                  <AuthGuard>
                                    <RouteComponent {...routeProps} />
                                  </AuthGuard>
                                ) : (
                                  <RouteComponent {...routeProps} />
                                ))}
                            </div>
                          </ErrorGuard>
                        );
                      }}
                    />
                  ),
                )}
                <Route component={ErrorPage} />
              </Switch>
            </div>
            <Footer site={siteRes} gitRepository={this.state?.env?.GIT_REPOSITORY}/>
          </div>
        </Provider>
      </>
    );
  }
}
