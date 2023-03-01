module.exports = [
  {
    method: 'GET',
    path: '/keycloak',
    handler: 'keycloak.keycloakSignIn',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/keycloak/callback',
    handler: 'keycloak.keycloakSignInCallback',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/sso-roles',
    handler: 'role.find',
  },
  {
    method: 'PUT',
    path: '/sso-roles',
    handler: 'role.update',
  },
];
