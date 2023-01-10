#!/bin/sh -l
function send_request(){
	curl "https://www.google-analytics.com/${7}mp/collect?api_secret=$3&measurement_id=$2" -d "{\"client_id\":\"github\",\"non_personalized_ads\":true,\"events\":[{\"name\":\"$1\",\"params\":{\"items\":[],\"description\":\"$6\",\"url\":\"https://github.com/$4/commit/$5\"}}]}"
}

apk add curl
apk add jq

send_validation=$(send_request "$1" "$2" "$3" "$4" "$5" "$6" "debug/")
send_request=$(send_request "$1" "$2" "$3" "$4" "$5" "$6")

validation_response=$(echo "$send_validation")

# validate the request
echo "Validating the request..."
if [ $(echo "$validation_response" | jq .validationMessages | jq length) -eq 0 ]
then
	echo "Request is valid"
	# make the actual request now
	echo "Sending the request..."
	$send_request
else
	echo "Request is not valid"
	exit 1
fi;
