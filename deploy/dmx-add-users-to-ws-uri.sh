#!/bin/bash

declare -a USERS=($1)

USERNAME='admin'
PASSWORD="${DMX_ADMIN_PASSWORD}"
if [ -z "${WEB_URL}" ] && [ "${CI_COMMIT_BRANCH}" == "master" ]; then
    WEB_URL="${CI_PROJECT_NAME}-${TIER}.ci.dmx.systems"
elif [ -z "${WEB_URL}" ] && [ "${CI_COMMIT_BRANCH}" != "master" ]; then
    WEB_URL="${CI_COMMIT_REF_SLUG}_${CI_PROJECT_NAME}-${TIER}.ci.dmx.systems"
fi
HOST="https://${WEB_URL}:443/"
## Test access to Administration workspace to ensure login as admin was successful.
URL='core/topic/uri/dmx.workspaces.administration'
# URL='access-control/user/workspace'
BASE64="$( echo -n "${USERNAME}:${PASSWORD}" | base64 )"
AUTH="Authorization: Basic ${BASE64}"
#SESSIONID="$( curl -sS -H "${AUTH}" "${HOST}/${URL}" -i 2>&1 | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
SESSION="$( curl -sS -H "${AUTH}" "${HOST}/${URL}" -i 2>&1 )"
HTTPCODE="$( echo "${SESSION}" | grep HTTP | cut -d' ' -f2 )"
#echo "HTTPCODE: ${HTTPCODE}"
if [ "${HTTPCODE}" != "200" ]; then
    echo "login ${USERNAME} failed!"
    exit 1
else
    SESSIONID="$( echo "${SESSION}" | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
    echo "login ${USERNAME} successful (SESSIONID: ${SESSIONID})."
fi


## get wsid 
if [ -z $2 ]; then
    echo "ERROR! Missing workspace uri."
    exit 1
else
    WSID="$( curl -sS -X GET -H "Cookie: JSESSIONID=${SESSIONID}" -H "Content-Type: application/json" ${HOST}/core/topic/uri/$2 | jq {id} | grep : | sed 's/\ //g' | cut -d':' -f2 )"
    #echo "WSID: ${WSID}"
fi

## add user to wsid
for user in "${USERS[@]}"; do
    USERNAME="$( echo "${user}" | tr '[:upper:]' '[:lower:]' | sed 's/\ /\_/g' )"
    LOGINNAME="${USERNAME}@example.org"
    echo "Adding ${user} <${LOGINNAME}> to workspace $2 (${WSID}):"
    URL="access-control/user/${LOGINNAME}/workspace/${WSID}"
    echo "POST ${URL}"
    RESULT="$( curl -sS -H "Cookie: JSESSIONID=${SESSIONID}" -H "dmx_workspace_id=${WSID}" -H "Content-Type: application/json" -X POST "${HOST}/${URL}" -i 2>&1 )"
    HTTPCODE="$( echo "${RESULT}" | grep HTTP | cut -d' ' -f2 )"
    if [ "${HTTPCODE}" != "204" ]; then
        echo "WARNING! Adding user ${USERNAME} to $2 (${WSID}) failed. (HTTPCODE: ${HTTPCODE})"
    else
        echo "INFO: Successfully added user ${USERNAME} to $2 (${WSID})."
    fi
done

## TEST
sleep 1
echo "testing ${WEB_URL}"
EXTERNAL_PROJECT_URL="https://${WEB_URL}/core/topic/0"
HTTP_CODE="$( curl -s -o /dev/null -w "%{http_code}" ${EXTERNAL_PROJECT_URL} )"
echo "HTTP_CODE ${HTTP_CODE}"
if [ ${HTTP_CODE} -ne 200 ]; then echo "HTTP test failed with error code ${HTTP_CODE}."; exit 1; fi
echo "You can now browse to https://${WEB_URL}/ for testing."
