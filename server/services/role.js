'use strict';

module.exports = ({ strapi }) => ({
  SSO_TYPE_KEYCLOAK: '1',
  ssoRoles() {
    return [
      {
        'oauth-type': this.SSO_TYPE_KEYCLOAK,
        name: 'Keycloak',
      },
    ];
  },
  async keycloakRoles() {
    return await strapi.query('plugin::strapi-plugin-sso.roles').findOne({
      'oauth-type': this.SSO_TYPE_KEYCLOAK,
    });
  },
  async find() {
    return await strapi.query('plugin::strapi-plugin-sso.roles').findMany();
  },
  async update(roles) {
    const query = strapi.query('plugin::strapi-plugin-sso.roles');
    await Promise.all(
      roles.map((role) => {
        return query.findOne({ 'oauth-type': role['oauth-type'] }).then((ssoRole) => {
          if (ssoRole) {
            query.update({
              where: { 'oauth-type': role['oauth-type'] },
              data: { roles: role.role },
            });
          } else {
            query.create({
              data: {
                'oauth-type': role['oauth-type'],
                roles: role.role,
              },
            });
          }
        });
      }),
    );
  },
});
