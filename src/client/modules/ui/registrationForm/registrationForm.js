import { LightningElement, wire, api } from 'lwc';
import { getErrorMessage } from 'utils/error';
import { getConfiguration } from 'services/configuration';
import { isNicknameAvailable } from 'services/isNicknameAvailable';
import { registerPlayer } from 'services/player';

const VALIDATION_DELAY = 500;

export default class RegistrationForm extends LightningElement {
    @api sessionId;

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

    @wire(isNicknameAvailable, {
        sessionId: '$sessionId',
        nickname: '$cleanNickname'
    })
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

    async connectedCallback() {
        try {
            this.configuration = await getConfiguration();
        } catch (error) {
            this.formError = getErrorMessage(error);
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
            this.isEmailValid = new RegExp(
                /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/,
                'i'
            ).test(this.email);
            if (this.isEmailValid === false) {
                this.emailError = 'Invalid email format';
            }
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isRegistrationDisabled) {
            return;
        }

        this.isLoading = true;
        this.isRegistering = true;
        const nickname = this.nickname.trim();

        try {
            const result = await registerPlayer(
                this.sessionId,
                nickname,
                this.email
            );
            this.dispatchEvent(
                new CustomEvent('registered', {
                    detail: {
                        nickname,
                        playerId: result.id
                    }
                })
            );
        } catch (error) {
            this.isLoading = false;
            this.isRegistering = false;
            this.isNicknameValid = false;
            this.formError = getErrorMessage(error);
        }
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
