import classNames from "classnames";
import { Component } from "inferno";
import type { UserFlairType } from "@utils/helpers/user-flair-type";

interface UserFlairProps {
  userFlair: UserFlairType | null;
  classNames?: string;
  imageSize?: string;
}

interface FetchUserFlairProps {
  userFlair: Promise<UserFlairType | null>;
  classNames?: string;
  imageSize?: string;
}

interface FetchUserFlairState {
  userFlair: UserFlairType | null;
}

export class UserFlair extends Component<UserFlairProps> {
  render() {
    const flair = this.props.userFlair;

    return (
      (flair != null) && (
        <div
          className={classNames("badge text-dark d-inline px-1", this.props.classNames)}
        >
          {flair.path !== undefined && (<img src={flair.path} style={`height:${this.props.imageSize || "1rem"};`} />)}
          <span class="ms-1 fw-semibold"> {flair.name} </span>
        </div>
      )
    );
  }
}


//Figure way to await this
export class FetchUserFlair extends Component<FetchUserFlairProps, FetchUserFlairState> {
  constructor(props: FetchUserFlairProps) {
    super(props);

    this.state = { userFlair: null }
  }

  async componentDidMount() {
    try{
      this.setState({ userFlair: await this.props.userFlair });
    } catch(e){
      console.log(e);
      this.setState({ userFlair: null });
    }
  }

  render() {
    const { userFlair } = this.state!;

    return (
      <UserFlair
        userFlair={userFlair}
        classNames={this.props.classNames}
        imageSize={this.props.imageSize}
      />
    );
  }
}
