#!/bin/sh -l
apk add curl
echo "Sending the request..."

curl --fail "https://www.google-analytics.com/mp/collect?api_secret=$3&measurement_id=$2" -d "{\"client_id\":\"github\",\"non_personalized_ads\":true,\"events\":[{\"name\":\"$1\",\"params\":{\"items\":[],\"description\":\"$6\",\"url\":\"https://github.com/$4/commit/$5\"}}]}"
status=$?

[ $status -eq 0 ] && echo "Request was successful" || echo "Request failed"
exit $status
