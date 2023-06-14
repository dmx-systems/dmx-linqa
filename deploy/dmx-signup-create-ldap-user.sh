declare -a USERS=($1)

USERNAME='admin'
PASSWORD="${DMX_ADMIN_PASSWORD}"
HOST="https://${WEB_URL}:443/"
## Test access to Administration workspace to ensure login as admin was successful.
URL='core/topic/uri/dmx.workspaces.administration'
# URL='access-control/user/workspace'
BASE64="$( echo -n "${USERNAME}:${PASSWORD}" | base64 )"
AUTH="Authorization: Basic ${BASE64}"
#SESSIONID="$( curl -sS -H "${AUTH}" "${HOST}/${URL}" -i 2>&1 | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
SESSION="$( curl -sS -H "${AUTH}" "${HOST}/${URL}" -i 2>&1 )"
HTTPCODE="$( echo "${SESSION}" | grep HTTP | cut -d' ' -f2 )"
echo "HTTPCODE: ${HTTPCODE}"
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
    LDAPPASSWORD='testpass'
    LDAPPASSWORDBASE64="$( echo -n "${LDAPPASSWORD}" | base64 )"
    URL="sign-up/custom-handle/${MAILBOX}/${DISPLAYNAME}/${LDAPPASSWORDBASE64}"
    echo "GET ${URL}"
    ## mind "Accept" header!
    RESULT="$( curl -sS -H "Cookie: JSESSIONID=${SESSIONID}" -H "Accept: application/json" -X GET "${HOST}/${URL}" -i 2>&1 )"
    echo "RESULT: ${RESULT}"
done

## test ldap login
for user in "${USERS[@]}"; do
    MAILNAME="$( echo "${user}" | tr '[:upper:]' '[:lower:]' | sed 's/\ /\_/g' )"
    MAILBOX="${MAILNAME}@example.org"
    BASE64=$( echo -n "${MAILBOX}:${LDAPPASSWORD}" | base64 )
    AUTH="Authorization: LDAP ${BASE64}"
    ## Test user creation was successful by checking login and membership in Display Names workspace
    URL='core/topic/uri/dmx.signup.display_names_ws'
    LOGIN_RESPONSE="$( curl -I -sS -H "${AUTH}" "${HOST}/${URL}" )"
    HTTP_CODE="$( echo "${LOGIN_RESPONSE}" | head -n1 | cut -d' ' -f2 )"
    if [ ${HTTP_CODE} -eq 200 ]; then
        SESSION_ID="$( echo "${LOGIN_RESPONSE}" | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
        echo "login ${MAILBOX} successful (id=${SESSION_ID})."
    else
        echo "login ${MAILBOX} failed! (${HTTP_CODE})"
        exit 1
    fi
done
