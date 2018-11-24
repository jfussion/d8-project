#!/usr/bin/env bash

set -a
. .env
set +a

# @TODO automate project creation

# Export each Environment variable to CircleCI
echo "Setting environment variables to CircleCI..."
path="${CIRCLE_API_PATH}project/${CIRCLE_VCS_TYPE}/${CIRCLE_USER}/${CIRCLE_PROJECT}"

# On curl command, return only the http_code to check if it was successfully created.
curl_options="-so /dev/null -w %{http_code} -X POST -u ${CIRCLE_TOKEN}:"
curl_header="Content-Type: application/json"

for i in $(awk '/#--end--/{found=0} {if(found) print} /#--circleci--/{found=1}' .env); do
  echo $i | cut -d "=" -f 1 | xargs -I name printf "Setting name variable... ";
  echo $i |  awk '{split($0,a,"="); printf "\{\\\"name\\\": \\\"%s\\\", \\\"value\\\": \\\"%s\\\"\}",a[1],a[2];}' | \
    xargs -I data curl ${curl_options} -d 'data' -H 'Content-Type: application/json' ${path}/envvar | \
    awk '/201/{created=1} {if(created) printf "Done!\n"; else printf "something went wrong\n";}'
done

# Add SSH key
curl ${curl_options} ${path}/ssh-key \
-F "hostname=${SERVER_IP}" \
-F "private_key=$(cat $PRIVATE_KEY_PATH)" \

