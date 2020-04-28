import { LightningElement, api } from 'lwc';

export default class Input extends LightningElement {
    @api label;
    @api autocomplete;
    @api readonly;
    @api isValid;
    @api maxLength;
    @api errorMessage;

    @api
    set value(newValue) {
        this._value = newValue;
    }
    get value() {
        return this._value;
    }

    _value = '';
    isDirty = false;

    handleInput(event) {
        this.isDirty = true;
        this._value = event.target.value;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    value: this._value
                }
            })
        );
    }

    get formElementClass() {
        if (this.isDirty) {
            if (this.isValid) {
                return 'has-success';
            }
            return 'has-error';
        }
        return '';
    }

    get validationIconHref() {
        return `/resources/slds-icons-action.svg${
            this.isValid ? '#approval' : '#close'
        }`;
    }
}
