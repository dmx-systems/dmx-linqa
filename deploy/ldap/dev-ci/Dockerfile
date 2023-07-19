FROM osixia/openldap:stable
#FROM container-registry.dmx.systems/dmx-intern/docker-images/openldap

## Default LDAP Volumes
#VOLUME ["/var/lib/ldap"]
#VOLUME ["/etc/ldap/slapd.d"]

# Copies our custom bootstrap files, so that they are picked up when the container is run
COPY bootstrap /container/service/slapd/assets/config/bootstrap/ldif/custom

