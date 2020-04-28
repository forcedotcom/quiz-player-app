import { LightningElement, wire } from 'lwc';
import { getErrorMessage } from 'utils/error';

import { getConfiguration } from 'services/configuration';
import { isNicknameAvailable, registerPlayer } from 'services/player';

const VALIDATION_DELAY = 500;

const EMAIL_REGEX = new RegExp(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/, 'gi');

export default class RegistrationForm extends LightningElement {
    configuration;

    nickname = '';
    cleanNickname;
    isNicknameValid;
    nicknameError;

    email = '';
    isEmailValid;
    emailError;

    isLoading = false;
    isRegistering = false;
    formError = '';

    validationDelayTimeout;

    @wire(getConfiguration)
    getConfiguration({ error, data }) {
        if (data) {
            this.configuration = data;
        } else if (error) {
            this.formError = getErrorMessage(error);
        }
    }

    @wire(isNicknameAvailable, { nickname: '$cleanNickname' })
    isNicknameAvailable({ error, data }) {
        if (data) {
            const { nickname, isAvailable } = data;
            this.isLoading = false;
            this.isNicknameValid = isAvailable;
            if (!isAvailable) {
                this.nicknameError = `Nickname '${nickname}' is already in use.`;
            }
        } else if (error) {
            this.isLoading = false;
            this.isNicknameValid = false;
            this.nicknameError = getErrorMessage(error);
        }
    }

    handleNicknameChange(event) {
        clearTimeout(this.validationDelayTimeout);
        this.isLoading = false;
        this.nicknameError = null;

        this.nickname = event.detail.value;
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
        this.email = event.detail.value;
        this.emailError = null;
        if (this.email.trim() === '') {
            this.isEmailValid = false;
            this.emailError = 'Email is required';
        } else {
            const isEmailValid = EMAIL_REGEX.test(this.email);
            this.isEmailValid = isEmailValid;
            if (!isEmailValid) {
                this.emailError = 'Invalid email format';
            }
        }
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
        registerPlayer(nickname, this.email)
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
                this.isNicknameValid = false;
                this.formError = getErrorMessage(error);
            });
    }

    // UI expressions

    get isRegistrationDisabled() {
        return (
            this.nickname.trim() === '' ||
            !this.isNicknameValid ||
            (this.shouldCollectPlayerEmails && !this.isEmailValid) ||
            this.isLoading
        );
    }

    get shouldCollectPlayerEmails() {
        return (
            this.configuration && this.configuration.shouldCollectPlayerEmails
        );
    }
}
