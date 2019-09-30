const express = require('express'),
    path = require('path'),
    jsforce = require('jsforce'),
    WebSocketService = require('./utils/webSocketService.js'),
    QuizSessionRestResource = require('./rest/quiz-session.js'),
    PlayerRestResource = require('./rest/player.js'),
    AnswerRestResource = require('./rest/answer.js');

const PORT = process.env.PORT || 3002;
const DIST_DIR = path.join(__dirname, '../../dist');

// Load and check config
require('dotenv').config();
const { SF_USERNAME, SF_PASSWORD, SF_TOKEN, SF_LOGIN_URL } = process.env;
if (!(SF_USERNAME && SF_PASSWORD && SF_TOKEN && SF_LOGIN_URL)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

// Configure and start express
const app = express();
app.use(express.static(DIST_DIR));
app.use(express.json());

const wss = new WebSocketService();

// Connect to Salesforce
const sfdc = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL,
    version: '47.0'
});
sfdc.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, err => {
    if (err) {
        console.error(err);
        process.exit(-1);
    }
}).then(() => {
    console.log('Connected to Salesforce');
    // Subscribe to Change Data Capture on Quiz Session record
    sfdc.streaming
        .topic('/data/Quiz_Session__ChangeEvent')
        .subscribe(cdcEvent => {
            console.log(cdcEvent.payload);
            const { Phase__c } = cdcEvent.payload;
            const header = cdcEvent.payload.ChangeEventHeader;
            // Filter events related to phase changes
            if (header.changeType === 'UPDATE' && Phase__c) {
                // Reformat message and send it to client via WebSocket
                const message = {
                    type: 'phaseChangeEvent',
                    data: {
                        Phase__c
                    }
                };
                wss.broadcast(JSON.stringify(message));
            }
        });
});

// Setup Quiz Session REST resources
const quizSessionRest = new QuizSessionRestResource(sfdc);
app.get('/api/quiz-sessions', (request, response) => {
    quizSessionRest.getSession(request, response);
});

// Setup Players REST resources
const playerRest = new PlayerRestResource(sfdc);
app.get('/api/players', (request, response) => {
    playerRest.isNicknameAvailable(request, response);
});
app.get('/api/players/:playerId/leaderboard', (request, response) => {
    playerRest.getPlayerLeaderboard(request, response);
});
app.post('/api/players', (request, response) => {
    playerRest.registerPlayer(request, response);
});

// Setup Answer REST resources
const answerRest = new AnswerRestResource(sfdc);
app.post('/api/answers', (request, response) => {
    answerRest.submitAnswer(request, response);
});

// HTTP and WebSocket Listen
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
wss.connect(server);
