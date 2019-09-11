import { LightningElement, track } from 'lwc';
import { getErrorMessage } from 'utils/error';
import { submitAnswer } from 'services/answer';

export default class Question extends LightningElement {
    @track errorMessage = '';

    handleAnswerClick(event) {
        const { answer } = event.target.dataset;

        submitAnswer(answer)
            .then(result => {
                console.log(result);
            })
            .catch(error => {
                console.error(error);
                this.displayError(error);
            });

        /*
        const answerEvent = new CustomEvent('answer', {
            detail: {
                answer
            }
        });
        this.dispatchEvent(answerEvent);
        */
    }

    displayError(errors) {
        this.errorMessage = getErrorMessage(errors);
    }
}
