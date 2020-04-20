import { LightningElement, wire } from 'lwc';
import { getErrorMessage } from 'utils/error';

import { isNicknameAvailable, registerPlayer } from 'services/player';

const VALIDATION_DELAY = 500;

export default class RegistrationForm extends LightningElement {
    isNickNameValid = true;
    nickname = '';
    cleanNickname;
    isLoading = false;
    isRegistering = false;
    errorMessage = '';
    socialHandle = '';

    validationDelayTimeout;

    @wire(isNicknameAvailable, { nickname: '$cleanNickname' })
    isNicknameAvailable({ error, data }) {
        if (data) {
            const { nickname, isAvailable } = data;
            this.isLoading = false;
            this.isNickNameValid = isAvailable;
            if (!isAvailable) {
                this.errorMessage = `Nickname '${nickname}' is already in use.`;
            }
        } else if (error) {
            this.isLoading = false;
            this.displayError(error);
        }
    }

    handleSocialHandleChange(event) {
        this.socialHandle = event.target.value;
    }

    handleNicknameChange(event) {
        clearTimeout(this.validationDelayTimeout);
        this.isLoading = false;
        this.errorMessage = '';

        this.nickname = event.target.value;
        const cleanNickname = this.nickname.trim().toLowerCase();

        // Don't validate blank nicknames
        if (cleanNickname === '') {
            this.isNickNameValid = true;
            return;
        }
        // Don't validate if clean nickname did not change
        if (this.cleanNickname === cleanNickname) {
            return;
        }

        this.isLoading = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.validationDelayTimeout = setTimeout(() => {
            this.cleanNickname = cleanNickname;
        }, VALIDATION_DELAY);
    }

    handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isRegistrationDisabled) {
            return;
        }

        this.isLoading = true;
        this.isRegistering = true;
        const nickname = this.nickname.trim();
        const socialHandle = this.socialHandle.trim();
        registerPlayer(nickname, socialHandle)
            .then((result) => {
                this.dispatchEvent(
                    new CustomEvent('registered', {
                        detail: {
                            nickname,
                            playerId: result.id
                        }
                    })
                );
            })
            .catch((error) => {
                this.isLoading = false;
                this.isRegistering = false;
                this.displayError(error);
            });
    }

    displayError(errors) {
        this.isNickNameValid = false;
        this.errorMessage = getErrorMessage(errors);
    }

    // UI expressions

    get isRegistrationDisabled() {
        return (
            this.socialHandle.trim() === '' ||
            this.nickname.trim() === '' ||
            !this.isNickNameValid ||
            this.isLoading
        );
    }

    get nicknameFormElementClass() {
        if (this.nickname === '' || (this.isLoading && !this.isRegistering)) {
            return '';
        }
        if (this.isNickNameValid) {
            return 'has-success';
        }
        if (!this.isNickNameValid) {
            return 'has-error';
        }
        return '';
    }

    get validationIconClass() {
        return (this.isLoading && !this.isRegistering) ||
            this.nickname.trim() === ''
            ? 'invisible icon'
            : 'icon';
    }

    get validationIconHref() {
        return `/resources/slds-icons-action.svg${
            this.isNickNameValid ? '#approval' : '#close'
        }`;
    }
}
