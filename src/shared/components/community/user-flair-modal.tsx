import { Component } from 'inferno';
import { Icon } from "../common/icon";
import { UserFlairType, clearUserFlair, setUserFlair } from '@utils/helpers/user-flair-type';
import { UserFlair } from '../common/user-flair';
import { Person, Community } from 'lemmy-js-client';

interface UserFlairModalProp {
    userFlair: UserFlairType | null;
    flairList: UserFlairType[];
    user: Person;
    community: Community;
    onUserFlairUpdate: (newFlair: UserFlairType | null) => void;
}

export class UserFlairModal extends Component<UserFlairModalProp> {
    showDialog = () => {
        const userFlairDialog = document.getElementById("userFlairDialog") as HTMLDialogElement;
        userFlairDialog.showModal();
    }

    async componentDidMount() {
        const userFlairDialog = document.getElementById("userFlairDialog") as HTMLDialogElement;
        const removeFlairBtn = userFlairDialog.querySelector("#removeFlairBtn") as HTMLInputElement;
        const confirmFlairBtn = userFlairDialog.querySelector("#confirmFlairBtn") as HTMLInputElement;

        confirmFlairBtn.addEventListener("click", (event) => {
            event.preventDefault(); // We don't want to submit this fake form

            // Get the value of the selected radio button
            const selectedValue = (userFlairDialog.querySelector('input[name="userFlair"]:checked') as HTMLInputElement)?.value;

            userFlairDialog.close(selectedValue); // Send the selected value here.

            const flair = userFlairDialog.returnValue;
            if (flair !== 'cancel' && flair !== 'default') {
                const pickedFlair = this.props.flairList.find(f => f.name === flair) as unknown as UserFlairType;

                this.props.onUserFlairUpdate(pickedFlair)
                setUserFlair(this.props.user, this.props.community, pickedFlair);
            }
        });

        removeFlairBtn.addEventListener("click", (event) => {
            event.preventDefault(); // We don't want to submit this fake form

            // Uncheck the checked radio button
            const checkedRadioButton = userFlairDialog.querySelector('input[name="userFlair"]:checked') as HTMLInputElement;
            if (checkedRadioButton) {
                checkedRadioButton.checked = false;
            }

            userFlairDialog.close(); // Send the selected value here.

            this.props.onUserFlairUpdate(null)
            clearUserFlair(this.props.user, this.props.community);
        });
    }

    render() {
        return (
            <dialog id="userFlairDialog" class="bg-light text-dark rounded" style="border-width: 1px;">
                <form class="d-flex flex-column">

                    <div class="d-flex justify-content-between mb-2">
                        <h5>Pick your flair:</h5>
                        <button class="btn btn-outline-dark btn-sm rounded-circle" value="cancel" formMethod="dialog">
                            <Icon icon="x" classes="icon-inline fs-6" />
                        </button>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));column-gap: 1rem;row-gap: 0.5rem;" class="w-100">
                        {this.props.flairList.map(flair => (
                            (this.props.userFlair !== undefined && this.props.userFlair?.name === flair.name)
                                ?
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
                                :
                                <span>
                                    <input type="radio" name="userFlair" value={flair.name} class="me-2" id={"userFlair" + flair.name} />
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

                    <span class="fst-italic my-3">
                        It might be necessary to refresh the page for the changes to take effect.
                    </span>

                    <div style="display:grid;grid-template-columns: repeat(3, minmax(0, 1fr));column-gap: 1rem;">
                        <div />
                        <button class="btn btn-outline-dark" id="removeFlairBtn" value="default">Remove flair</button>
                        <button class="btn btn-dark" id="confirmFlairBtn" value="cancel" formMethod="dialog">Confirm</button>
                    </div>
                </form>
            </dialog>
        );
    }
}