declare -a USERS=($1)

USERNAME='admin'
PASSWORD="${DMX_ADMIN_PASSWORD}"
HOST="https://${WEB_URL}:443/"
## Test access to Administration workspace to ensure login as admin was successful.
URL='core/topic/uri/dmx.workspaces.administration'
BASE64="$( echo -n "${USERNAME}:${PASSWORD}" | base64 )"
AUTH="Authorization: Basic ${BASE64}"
SESSIONID="$( curl -sS -H "${AUTH}" "${HOST}/${URL}" -i 2>&1 | grep ^Set-Cookie: | cut -d';' -f1 | cut -d'=' -f2 )"
if [ -n "${SESSIONID}" ]; then
    echo "login ${USERNAME} successful (id=${SESSIONID})."
else
    echo "login ${USERNAME} failed!"
    exit 1
fi


## get wsid 
WSID="$( curl -sS -X POST -H "Cookie: JSESSIONID=${SESSIONID}" -H "Content-Type: application/json" https://${WEB_URL}/core/topic/uri/$2 | jq {id} | grep : | sed 's/\ //g' | cut -d':' -f2 }"


## add user to wsid
for user in "${USERS[@]}"; do
    echo "Adding ${user} to $2 (${WSID}):"
    URL="access-control/user/testuser@example.org/workspace/${WSID}"
    echo "GET ${URL}"
    RESULT="$( curl -sS -H "Cookie: JSESSIONID=${SESSIONID}" -H "Accept: application/json" -X GET "${HOST}/${URL}" -i 2>&1 )"
    echo "RESULT: ${RESULT}"
done

