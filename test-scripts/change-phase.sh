#!/bin/bash
HOST="http://0.0.0.0:3002"

if [ "$PHASE" == "" ]; then
  echo "Select quiz phase:"
  select PHASE in "Registration" "PreQuestion" "Question" "QuestionResults" "GameResults"; do
    case $PHASE in
          Registration ) break;;
          PreQuestion ) break;;
          Question ) break;;
          QuestionResults ) break;;
          GameResults ) break;;
      esac
  done
  echo ""
fi

# Read API key from .env
API_KEY=$(grep API_KEY .env | cut -d '=' -f 2-)

# Change quiz phase
curl -X PUT \
  $HOST/api/quiz-sessions \
  -H "Api-Key: $API_KEY" \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -d "{ \"Phase__c\": \"$PHASE\" }"
EXIT_CODE="$?"

# Check exit code
echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  echo "Quiz phase changed to $PHASE"
else
  echo "Execution failed."
fi
echo ""
exit $EXIT_CODE