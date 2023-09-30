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
LDAPPASSWORD='testpass'

if [ "${HTTPCODE}" != "200" ]; then
    echo "login ${USERNAME} failed!"
    exit 1
else
    SESSIONID="$( echo "${SESSION}" | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
    echo "login ${USERNAME} successful (SESSIONID: ${SESSIONID})."
fi

## create users
for user in "${USERS[@]}"; do
    echo "Creating LDAP account for ${user}"
    MAILNAME="$( echo "${user}" | tr '[:upper:]' '[:lower:]' | sed 's/\ /\_/g' )"
    MAILBOX="${MAILNAME}@example.org"
    ## replace space in DISPLAYNAME with encoded space (%20)
    DISPLAYNAME="${user}%20Testuser"
    LDAPPASSWORDBASE64="$( echo -n "${LDAPPASSWORD}" | base64 )"
    URL="sign-up/user-account/${MAILBOX}/${MAILBOX}/${DISPLAYNAME}/${LDAPPASSWORDBASE64}"
    echo "POST ${URL}"
    ## mind "Accept" header!
    RESULT="$( curl -sS -H "Cookie: JSESSIONID=${SESSIONID}" -H "Accept: application/json" -X POST "${HOST}/${URL}" -i 2>&1 )"
    echo "RESULT: ${RESULT}"
done

## test ldap login
for user in "${USERS[@]}"; do
    MAILNAME="$( echo "${user}" | tr '[:upper:]' '[:lower:]' | sed 's/\ /\_/g' )"
    MAILBOX="${MAILNAME}@example.org"
    BASE64=$( echo -n "${MAILBOX}:${LDAPPASSWORD}" | base64 )
    AUTH="Authorization: LDAP ${BASE64}"
    ## Test user creation was successful by checking login and accessing the private workspace.
    URL='access-control/user/workspace'
    LOGIN_RESPONSE="$( curl -I -sS -H "${AUTH}" "${HOST}/${URL}" )"
    HTTP_CODE="$( echo "${LOGIN_RESPONSE}" | head -n1 | cut -d' ' -f2 )"
    if [ ${HTTP_CODE} -eq 200 ]; then
        SESSION_ID="$( echo "${LOGIN_RESPONSE}" | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
        echo "login ${MAILBOX} successful (id=${SESSION_ID}). (HTTPCODE=${HTTPCODE})"
    else
        echo "login ${MAILBOX} failed! (HTTPCODE=${HTTPCODE})"
        exit 1
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
