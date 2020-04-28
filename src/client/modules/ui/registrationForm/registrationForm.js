import { LightningElement, wire } from 'lwc';
import { getErrorMessage } from 'utils/error';

import { getConfiguration } from 'services/configuration';
import { isNicknameAvailable, registerPlayer } from 'services/player';

const VALIDATION_DELAY = 500;

const EMAIL_REGEX = new RegExp('[^.]+@[^.]+\\.[^.]+', 'g');

export default class RegistrationForm extends LightningElement {
    configuration;

    nickname = '';
    cleanNickname;
    isNicknameValid;

    email = '';
    isEmailValid;

    isLoading = false;
    isRegistering = false;
    errorMessage = '';

    validationDelayTimeout;

    @wire(getConfiguration)
    getConfiguration({ error, data }) {
        if (data) {
            this.configuration = data;
        } else if (error) {
            this.errorMessage = getErrorMessage(error);
        }
    }

    @wire(isNicknameAvailable, { nickname: '$cleanNickname' })
    isNicknameAvailable({ error, data }) {
        if (data) {
            const { nickname, isAvailable } = data;
            this.isLoading = false;
            this.isNicknameValid = isAvailable;
            if (!isAvailable) {
                this.errorMessage = `Nickname '${nickname}' is already in use.`;
            }
        } else if (error) {
            this.isLoading = false;
            this.displayError(error);
        }
    }

    handleNicknameChange(event) {
        const inputElement = event.target;

        clearTimeout(this.validationDelayTimeout);
        this.isLoading = false;
        inputElement.errorMessage = '';

        this.nickname = inputElement.value;
        const cleanNickname = this.nickname.trim().toLowerCase();

        // Don't validate blank nicknames
        if (cleanNickname === '') {
            this.isNicknameValid = false;
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

    handleEmailChange(event) {
        this.email = event.target.value;
        this.isEmailValid = EMAIL_REGEX.text(this.email);
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
        registerPlayer(nickname)
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
            this.nickname.trim() === '' ||
            !this.isNickNameValid ||
            this.isLoading
        );
    }

    get shouldCollectPlayerEmails() {
        return (
            this.configuration && this.configuration.shouldCollectPlayerEmails
        );
    }
}
