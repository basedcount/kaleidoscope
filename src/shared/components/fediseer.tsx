import { Component } from 'inferno';
import { fediseerApi } from '../config';

interface FediseerProps {
  actor_id: string;   //Link to community or user profile. Extract the instance URL from both the same way
}

interface FediseerState {
  action: 'endorsements' | 'hesitations' | 'censures' | undefined;
  reason: string;
  site: string;
  key: string | null;
  loading: boolean;
  return: {
    ok: boolean,
    message: string,
  }
}

export default class Fediseer extends Component<FediseerProps, FediseerState> {
  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      action: undefined,
      reason: '',
      site: new URL(this.props.actor_id).host,
      // site: 'overctrl.dbzer0.com', //TEST HOST
      key: localStorage.getItem('FEDISEER_KEY'),
      loading: false,
      return: {
        ok: false,
        message: '',
      }
    };
  }

  render() {
    return (
      <div className="card border-secondary mb-3">
        <div className="card-body">
          <h2 className="h5">Fediseer</h2>
          <p>
            Fediseer actions for the <span class="font-monospace">{this.state?.site}</span> instance.<br />
            View more data about the instance on the <a href={`https://gui.fediseer.com/instances/detail/${this.state?.site}`}>Fediseer GUI</a>.
          </p>
          <div class="d-flex flex-row mb-3 column-gap-3">
            <img src={`https://fediseer.com/api/v1/badges/guarantees/${this.state?.site}.svg`} alt="guarantor" />
            <img src={`https://fediseer.com/api/v1/badges/endorsements/${this.state?.site}.svg`} alt="endorsements" />
          </div>

          {this.state?.key !== null ? (
            <>
              <div class="d-flex flex-row column-gap-2">
                <button type="button" class={`btn btn-outline-success ${this.state?.action === 'endorsements' ? 'active' : ''}`} value="endorsements" onClick={this.handleActionChoice}>Endorse</button>
                <button type="button" class={`btn btn-outline-warning ${this.state?.action === 'hesitations' ? 'active' : ''}`} value="hesitations" onClick={this.handleActionChoice}>Hesitate</button>
                <button type="button" class={`btn btn-outline-danger ${this.state?.action === 'censures' ? 'active' : ''}`} value="censures" onClick={this.handleActionChoice}>Censure</button>
              </div>
              {this.state?.action !== undefined &&
                <>
                  <div class="d-flex flex-row column-gap-2 mt-3">
                    <input class="form-control" id="fediseer-reason" type="text" placeholder="Reason (optional)" value={this.state.reason} onInput={this.handleReasonChange} />
                    {!this.state.loading ?
                      <button type="button" class="btn btn-primary" onclick={this.sendRequest}>Confirm</button> :
                      <button type="button" class="btn btn-primary" onclick={this.sendRequest} disabled>Confirm</button>
                    }
                  </div>
                </>
              }
              {this.state?.action === undefined && this.state?.return.message !== '' &&
                <>
                  {this.state?.return.ok === true &&
                    <p class="mt-3 text-success">Fediseer action submitted succesfully.</p>
                  }
                  {this.state?.return.ok !== true &&
                    <p class="mt-3 text-danger">{this.state?.return.message}</p>
                  }
                </>
              }
            </>
          ) : (
            <i>Actions are not available because no API key has been set. <br /> You can set a Fediseer API key from the "Fediseer" section of your <a href="/settings">user settings</a>.</i>
          )}
        </div>
      </div >
    );
  }

  handleActionChoice = (event: any) => {
    this.setState({ action: event.target.value });
  }

  handleReasonChange = (event: any) => {
    this.setState({ reason: event.target.value });
  }

  sendRequest = async () => {
    this.setState({ loading: true });

    try {
      const res = await fetch(`${fediseerApi}/v1/${this.state?.action}/${this.state?.site}`, {
        method: 'PUT',
        headers: {
          "Content-type": "application/json",
          apikey: this.state?.key ?? ''
        },
        body: JSON.stringify({ reason: this.state?.reason })
      });

      const json = await res.json() as { message: string };
      this.setState({ action: undefined, reason: '', loading: false, return: { ok: res.ok, message: json.message } });
    } catch (e) {
      this.setState({ action: undefined, reason: '', loading: false, return: { ok: false, message: e } });
    }
  }
}
