#!/bin/bash

API="http://localhost:4741"
URL_PATH="/messages"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "message": {
      "text": "'"${TEXT}"'"
    }
  }'

echo
