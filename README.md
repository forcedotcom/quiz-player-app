# Multiplayer quiz app built on Salesforce technology (player app)

ℹ️ Please refer to the [quiz host app](https://github.com/pozil/quiz-host-app) for documentation.

## Heroku deploy (recommended)

Click on this button and follow the instructions to deploy the app:

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/pozil/quiz-player-app/edit/master">
    <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
  </a>
<p>

## Local setup (development only)

Create a `.env` file at the root of the project:

```
SF_LOGIN_URL='https://test.salesforce.com'
SF_USERNAME='YOUR_SALESFORCE_USERNAME'
SF_PASSWORD='YOUR_SALESFORCE_PASSWORD'
SF_TOKEN='YOUR_SALESFORCE_SECURITY_TOKEN'
QUIZ_API_KEY='YOUR_QUIZ_API_KEY'
```

Run the project with `npm start`
