import { Component } from 'inferno';
import { Icon } from "../common/icon";
import { UserFlairType, modAddFlair, modDeleteFlair } from '@utils/helpers/user-flair-type';
import { UserFlair } from '../common/user-flair';
import { Community } from 'lemmy-js-client';

interface UserFlairModModalProp {
    flairList: UserFlairType[];
    community: Community;
}

interface UserFlairModModalState {
    addedFlair: UserFlairType;
}

export class UserFlairModModal extends Component<UserFlairModModalProp, UserFlairModModalState> {
    constructor(props: UserFlairModModalProp, context: any) {
        super(props, context);
        this.setState({ addedFlair: { community_actor_id: this.props.community.actor_id, name: '', display_name: '', mod_only: false, path: null } });
    }

    showDialog = () => {
        const userFlairModDialog = document.getElementById("userFlairModDialog") as HTMLDialogElement;
        userFlairModDialog.showModal();
    }

    async componentDidMount() {
        const userFlairModDialog = document.getElementById("userFlairModDialog") as HTMLDialogElement;
        const addFlairBtn = userFlairModDialog.querySelector("#addFlairBtn") as HTMLInputElement;

        addFlairBtn.addEventListener("click", (event) => {
            event.preventDefault(); // We don't want to submit this fake form

            // Uncheck the checked radio button
            const checkedRadioButton = userFlairModDialog.querySelector('input[name="userFlair"]:checked') as HTMLInputElement;
            if (checkedRadioButton) {
                checkedRadioButton.checked = false;
            }

            userFlairModDialog.close(); // Send the selected value here.

            const flair = this.state?.addedFlair ?? null;
            if (flair !== null) {
                if (flair.name !== '' && flair.display_name !== '' && flair.community_actor_id !== '') {
                    modAddFlair(flair);
                }
            }
        });
    }

    render() {
        return (
            <dialog id="userFlairModDialog" class="bg-light text-dark rounded" style="border-width: 1px;">
                <form class="d-flex flex-column">

                    <div class="d-flex justify-content-between mb-2">
                        <h5>Manage flairs for {this.props.community.title}:</h5>
                        <button class="btn btn-outline-dark btn-sm rounded-circle" value="cancel" formMethod="dialog">
                            <Icon icon="x" classes="icon-inline fs-6" />
                        </button>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));column-gap: 1rem;row-gap: 0.5rem;" class="w-100">
                        {this.props.flairList.map(flair => (
                            <span>
                                <input type="radio" name="userFlair" value={flair.name} class="me-2" id={"userFlair" + flair.name} checked />
                                <label htmlFor={"userFlair" + flair.name}>
                                    <UserFlair
                                        userFlair={flair}
                                        classNames="fs-6"
                                        imageSize="1.5rem"
                                    />
                                </label>
                            </span>
                        ))}
                    </div>

                    <div style="display:grid;grid-template-columns: repeat(3, minmax(0, 1fr));column-gap: 1rem;">
                        <div />
                        <button class="btn btn-outline-dark" id="addFlairBtn" value="default">Remove flair</button>
                        <button class="btn btn-dark" id="confirmFlairBtn" value="cancel" formMethod="dialog">Confirm</button>
                    </div>
                </form>
            </dialog>
        );
    }
}


/*
    TODO:
    - remove last div, replace with form for add flair
    - remove radio button, replace with red x button
    - add heading "manage flairs for {community}"
*/