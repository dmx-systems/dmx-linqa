#!/bin/bash
##
## This script deploys a docker instance on# a gitlab-runner
## with access to the shell and docker. (jpn - 20230616)
##
##  variables:
if [ -z "${TIER}" ]; then
    TIER='dev'
fi
if [ -z "${COMPOSE_PROJECT_NAME}" ]; then
    COMPOSE_PROJECT_NAME="${CI_PROJECT_NAME}_${CI_COMMIT_REF_SLUG}"
fi
if [ "${CI_COMMIT_BRANCH}" != "${CI_COMMIT_REF_SLUG}" ]; then
    echo "CI_COMMIT_BRANCH: ${CI_COMMIT_BRANCH}"
    echo "CI_COMMIT_REF_SLUG: ${CI_COMMIT_REF_SLUG}"
fi
if [ -z "${WEB_URL}" ] && [ "${CI_COMMIT_BRANCH}" == "master" ]; then
    WEB_URL="${CI_PROJECT_NAME}-${TIER}.ci.dmx.systems"
elif [ -z "${WEB_URL}" ] && [ "${CI_COMMIT_BRANCH}" != "master" ]; then
    WEB_URL="${CI_COMMIT_REF_SLUG}_${CI_PROJECT_NAME}-${TIER}.ci.dmx.systems"
fi
if [ -z "${CONFIG_DIR}" ]; then
    CONFIG_DIR='deploy/.config'
fi
if [ -z "${ENV_FILE}" ]; then
    ENV_FILE="${CONFIG_DIR}/.env.${CI_COMMIT_REF_SLUG}.ci"
fi
###    DEEPL_AUTH_KEY: ${DEEPL_AUTH_KEY}
###    DMX_ADMIN_PASSWORD: ${DMX_ADMIN_PASSWORD}
###    LDAP_ADMIN_PASSWORD: ${LDAP_ADMIN_PASSWORD}
if [ -z "${WEBDIR}" ]; then
    WEBDIR='https://download.dmx.systems/ci'
fi
if [ -z "${WEBCGI}" ]; then                              # <= stable|latest
    WEBCGI='https://download.dmx.systems/cgi-bin/v1/latest-version.cgi?'  # <= stable|latest
fi

##  before_script:
echo "TIER=${TIER}"
docker version
docker compose version
docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" container-registry.dmx.systems/dmx-contrib/dmx-docker
docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" container-registry.dmx.systems/dmx-intern/docker-images/busybox-httpd
test -d "${CONFIG_DIR}" || mkdir -p "${CONFIG_DIR}"
test -f "${ENV_FILE}" || touch "${ENV_FILE}"
test -d deploy/instance/${TIER} || mkdir -p deploy/instance/${TIER}/conf deploy/instance/${TIER}/logs deploy/instance/${TIER}/db deploy/instance/${TIER}/filedir deploy/instance/${TIER}/bundle-deploy deploy/instance/${TIER}/plugins
test -f deploy/scripts/dmxstate.sh || curl --silent https://git.dmx.systems/dmx-contrib/dmx-state/-/raw/master/dmxstate.sh --create-dirs -o deploy/scripts/dmxstate.sh
chmod +x deploy/scripts/dmxstate.sh
test -d deploy/dmx/${TIER}-ci/plugins/ || mkdir deploy/dmx/${TIER}-ci/plugins/
if [ -f target/*.jar ]; then
    echo "copying jar file to deploy/dmx/${TIER}-ci/plugins/"
    cp target/*.jar deploy/dmx/${TIER}-ci/plugins/
else
    echo "ERROR! No jar file in target/ found ."
fi
echo "PLUGINS: ${PLUGINS}"
if [ ! -z "${PLUGINS}" ]; then
    for plugin in ${PLUGINS}; do
        echo "getting latest version of ${plugin} plugin"
        plugin_version="$( wget -q -O - "${WEBCGI}/ci/${plugin}/${plugin}-latest.jar" )"
        echo "installing ${plugin_version}"
        wget -q "${plugin_version}" -P deploy/dmx/${TIER}-ci/plugins/
    done
fi
##  script:
USER_ID="$( id -u )"
GROUP_ID="$( id -g )"
DMX_PORT="$( curl --silent --cookie-jar - https://${WEB_URL}/?proxyport=dmx | grep PROXYPORT | grep -o '[^PROXYPORT$]*$' | sed s'/\s//g' )"
if [ -z "${DMX_PORT}" ]; then
    echo "ERROR! Could not retrieve the DMX containers proxyport from ${WEB_URL}."
    exit 1
fi
sleep 1
LOGS_PORT="$( curl --silent --cookie-jar - https://${WEB_URL}/?proxyport=log | grep PROXYPORT | grep -o '[^PROXYPORT$]*$' | sed s'/\s//g' )"
if [ "$( echo "${PLUGINS}" | grep dmx-sendmail )" ]; then
    MAIL_PORT="$( curl --silent --cookie-jar - https://${WEB_URL}/?proxyport=mail | grep PROXYPORT | grep -o '[^PROXYPORT$]*$' | sed s'/\s//g' )"
    echo "MAIL_PORT=${MAIL_PORT}" >>"${ENV_FILE}"
else
    MAIL_PORT=
    echo "INFO: mailhog not installed."
fi

echo "user_id=${USER_ID}" >>"${ENV_FILE}"
echo "group_id=${GROUP_ID}" >>"${ENV_FILE}"
echo "DMX_PORT=${DMX_PORT}" >>"${ENV_FILE}"
echo "LOGS_PORT=${LOGS_PORT}" >>"${ENV_FILE}"
echo "COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}" >>"${ENV_FILE}"
cat "${ENV_FILE}"
echo "dmx.websockets.url = wss://${WEB_URL}/websocket" > deploy/dmx/${TIER}-ci/conf.d/config.properties.d/10_websocket_url
echo "dmx.host.url = https://${WEB_URL}/" > deploy/dmx/${TIER}-ci/conf.d/config.properties.d/10_host_url
DOCKER_IMAGE="$( docker inspect ${CI_PROJECT_NAME}-${TIER}-ldap-container | jq .[].Config.Image | sed 's/\"//g' )"
echo "DOCKER_IMAGE=${DOCKER_IMAGE}"
docker compose --env-file "${ENV_FILE}" --file deploy/docker-compose.${TIER}-ci.yaml down -v --remove-orphans || true
#docker container ls | grep ${CI_PROJECT_NAME}-${TIER}
#date +%s
sleep 2
#date +%s
#docker container ls | grep ${CI_PROJECT_NAME}-${TIER}
#if [ $( echo "${PLUGINS}" | grep dmx-ldap ) ] || [ "${CI_PROJECT_NAME}" == "dmx-ldap" ]; then
if [ "$( docker image ls | grep "${DOCKER_IMAGE}" )" ]; then
    docker container stop ${CI_PROJECT_NAME}-${TIER}-ldap-container || true
    if [ "$( docker container ls -a | grep ${CI_PROJECT_NAME}-${TIER}-ldap-container )" ]; then 
        docker container rm ${CI_PROJECT_NAME}-${TIER}-ldap-container || true
        sleep 1
    fi
    echo "deleting old docker image ${DOCKER_IMAGE}"
    docker image rm ${DOCKER_IMAGE} || true
fi
## pull latest images (to keep versions up to date)
docker compose --env-file "${ENV_FILE}" --file deploy/docker-compose.${TIER}-ci.yaml pull
docker compose --env-file "${ENV_FILE}" --file deploy/docker-compose.${TIER}-ci.yaml up --force-recreate -d
test -d ./deploy/instance/${TIER}/logs/ || echo "ERROR! Directory ./deploy/instance/${TIER}/logs/ not found."
deploy/scripts/dmxstate.sh ./deploy/instance/${TIER}/logs/dmx0.log 30 || cat ./deploy/instance/${TIER}/logs/dmx0.log

## TEST
sleep 1
echo "testing ${WEB_URL}"
EXTERNAL_PROJECT_URL="https://${WEB_URL}/core/topic/0"
HTTP_CODE="$( curl -s -o /dev/null -w "%{http_code}" ${EXTERNAL_PROJECT_URL} )"
echo "HTTP_CODE ${HTTP_CODE}"
if [ ${HTTP_CODE} -ne 200 ]; then echo "HTTP test failed with error code ${HTTP_CODE}."; exit 1; fi
echo "You can now browse to https://${WEB_URL}/ for testing."
