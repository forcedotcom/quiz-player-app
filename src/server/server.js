const jsforce = require('jsforce'),
    Configuration = require('./utils/configuration.js'),
    WebSocketService = require('./utils/webSocketService.js'),
    QuizSessionRestResource = require('./rest/quiz-session.js'),
    PlayerRestResource = require('./rest/player.js'),
    AnswerRestResource = require('./rest/answer.js'),
    ConfigurationRestResource = require('./rest/configuration.js'),
    LWR = require('lwr'),
    express = require('express');

// Load and check config
require('dotenv').config();
if (!Configuration.isValid()) {
    process.exit(-1);
}

// Configure server
const lwrServer = LWR.createServer();
const app = lwrServer.getInternalServer();
const wss = new WebSocketService();

// Connect to Salesforce
const sfdc = new jsforce.Connection({
    loginUrl: Configuration.getSfLoginUrl(),
    version: Configuration.getSfApiVersion()
});
sfdc.login(
    Configuration.getSfUsername(),
    Configuration.getSfSecuredPassword(),
    (error) => {
        if (error) {
            console.error('Failed to connect to Salesforce org');
            console.error(error);
            process.exit(-1);
        }
    }
).then(() => {
    console.log('Connected to Salesforce');
});

// Prepare API server
const apiServer = express();
apiServer.use(express.json());

// Setup Quiz Session REST resources
const quizSessionRest = new QuizSessionRestResource(sfdc, wss);
apiServer.get('/quiz-sessions/:sessionId', (request, response) => {
    quizSessionRest.getSession(request, response);
});
apiServer.put('/quiz-sessions/:sessionId', (request, response) => {
    quizSessionRest.updateSession(request, response);
});

// Setup Players REST resources
const playerRest = new PlayerRestResource(sfdc);
apiServer.get('/quiz-sessions/:sessionId/players', (request, response) => {
    playerRest.isNicknameAvailable(request, response);
});
apiServer.post('/quiz-sessions/:sessionId/players', (request, response) => {
    playerRest.registerPlayer(request, response);
});
apiServer.get(
    '/quiz-sessions/:sessionId/players/:playerId/stats',
    (request, response) => {
        playerRest.getPlayerStats(request, response);
    }
);
apiServer.get(
    '/quiz-sessions/:sessionId/players/:playerId/leaderboard',
    (request, response) => {
        playerRest.getPlayerLeaderboard(request, response);
    }
);

// Setup Answer REST resources
const answerRest = new AnswerRestResource(sfdc);
apiServer.post('/answers', (request, response) => {
    answerRest.submitAnswer(request, response);
});

// Setup Configuration REST resources
const configurationRest = new ConfigurationRestResource();
apiServer.get('/configuration', (request, response) => {
    configurationRest.getConfiguration(request, response);
});

// HTTP and WebSocket Listen
app.use('/api', apiServer);
wss.connect(lwrServer.server);
lwrServer
    .listen(({ port, serverMode }) => {
        console.log(`App listening on port ${port} in ${serverMode} mode\n`);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
