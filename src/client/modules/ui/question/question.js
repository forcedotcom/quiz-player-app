import { LightningElement } from 'lwc';

export default class Question extends LightningElement {
    handleAnswerClick(event) {
        const { answer } = event.target.dataset;
        const answerEvent = new CustomEvent('answer', {
            detail: {
                answer
            }
        });
        this.dispatchEvent(answerEvent);
    }
}
