const jsforce = require('jsforce'),
    Configuration = require('./utils/configuration.js'),
    WebSocketService = require('./utils/webSocketService.js'),
    QuizSessionRestResource = require('./rest/quiz-session.js'),
    PlayerRestResource = require('./rest/player.js'),
    AnswerRestResource = require('./rest/answer.js'),
    ConfigurationRestResource = require('./rest/configuration.js'),
    LWR = require('lwr');

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

// Setup Quiz Session REST resources
const quizSessionRest = new QuizSessionRestResource(sfdc, wss);
app.get('/api/quiz-sessions', (request, response) => {
    quizSessionRest.getSession(request, response);
});
app.put('/api/quiz-sessions', (request, response) => {
    quizSessionRest.updateSession(request, response);
});

// Setup Players REST resources
const playerRest = new PlayerRestResource(sfdc);
app.get('/api/players', (request, response) => {
    playerRest.isNicknameAvailable(request, response);
});
app.get('/api/players/:playerId/stats', (request, response) => {
    playerRest.getPlayerStats(request, response);
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

// Setup Configuration REST resources
const configurationRest = new ConfigurationRestResource();
app.get('/api/configuration', (request, response) => {
    configurationRest.getConfiguration(request, response);
});

// HTTP and WebSocket Listen
wss.connect(lwrServer.server);
lwrServer
    .listen(({ port, serverMode }) => {
        console.log(`App listening on port ${port} in ${serverMode} mode\n`);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
