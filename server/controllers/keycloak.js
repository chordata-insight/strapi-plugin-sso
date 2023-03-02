const axios = require('axios');
const { v4 } = require('uuid');
const { getService } = require('@strapi/admin/server/utils');

const configValidation = () => {
  const requiredConfig = ['KEYCLOAK_DOMAIN', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET', 'KEYCLOAK_REDIRECT_URI'];
  const missingConfigs = [];
  const config = strapi.config.get('plugin.strapi-plugin-sso');
  requiredConfig.forEach((key) => {
    if (!config[key]) {
      missingConfigs.push(key);
    }
  });
  if (missingConfigs.length > 0) {
    throw new Error(`[${missingConfigs.join(', ')}] env variables are required but not set`);
  }
  return {
    ...config,
    KEYCLOAK_REDIRECT_URI_ENCODED: encodeURIComponent(config.KEYCLOAK_REDIRECT_URI),
    OAUTH_ENDPOINT: `auth/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
    OAUTH_TOKEN_ENDPOINT: `auth/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    OAUTH_USER_INFO_ENDPOINT: `auth/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
    OAUTH_USER_END_SESSION: `auth/realms/${config.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
    OAUTH_GRANT_TYPE: 'authorization_code',
    OAUTH_RESPONSE_TYPE: 'code',
    OAUTH_SCOPE: 'openid profile',
    KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE: config.KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE || 'strapi.super-admin',
    KEYCLOAK_STRAPI_EDITOR_ROLE: config.KEYCLOAK_STRAPI_EDITOR_ROLE || 'strapi.editor',
    KEYCLOAK_STRAPI_AUTHOR_ROLE: config.KEYCLOAK_STRAPI_AUTHOR_ROLE || 'strapi.author',
  };
};

/**
 * Redirect to Keycloak
 * @param ctx
 * @return {Promise<*>}
 */
async function keycloakSignIn(ctx) {
  const { OAUTH_ENDPOINT, KEYCLOAK_DOMAIN, KEYCLOAK_CLIENT_ID, KEYCLOAK_REDIRECT_URI_ENCODED, OAUTH_SCOPE, OAUTH_RESPONSE_TYPE } = configValidation();
  const url = `${KEYCLOAK_DOMAIN}/${OAUTH_ENDPOINT}?client_id=${KEYCLOAK_CLIENT_ID}&redirect_uri=${KEYCLOAK_REDIRECT_URI_ENCODED}&scope=${OAUTH_SCOPE}&response_type=${OAUTH_RESPONSE_TYPE}`;
  ctx.set('Location', url);
  return ctx.send({}, 302);
}

/**
 * Verify the token and if there is no account, create one and then log in
 * @param ctx
 * @return {Promise<*>}
 */
async function keycloakSignInCallback(ctx) {
  const {
    KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET,
    KEYCLOAK_REDIRECT_URI,
    KEYCLOAK_DOMAIN,
    KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE,
    KEYCLOAK_STRAPI_EDITOR_ROLE,
    KEYCLOAK_STRAPI_AUTHOR_ROLE,
    OAUTH_TOKEN_ENDPOINT,
    OAUTH_GRANT_TYPE,
    OAUTH_USER_INFO_ENDPOINT,
  } = configValidation();

  const httpClient = axios.create();
  const tokenService = getService('token');
  const userService = getService('user');
  const oauthService = strapi.plugin('strapi-plugin-sso').service('oauth');
  const roleService = strapi.plugin('strapi-plugin-sso').service('role');

  if (!ctx.query.code) {
    return ctx.send(oauthService.renderSignUpError(`code Not Found`));
  }

  const params = new URLSearchParams();
  params.append('code', ctx.query.code);
  params.append('client_id', KEYCLOAK_CLIENT_ID);
  params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
  params.append('redirect_uri', KEYCLOAK_REDIRECT_URI);
  params.append('grant_type', OAUTH_GRANT_TYPE);

  try {
    const response = await httpClient.post(`${KEYCLOAK_DOMAIN}/${OAUTH_TOKEN_ENDPOINT}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const userInfoEndpoint = `${KEYCLOAK_DOMAIN}/${OAUTH_USER_INFO_ENDPOINT}?access_token=${response.data.access_token}`;
    const userResponse = await httpClient.post(userInfoEndpoint, {}, { headers: { authorization: `Bearer ${response.data.access_token}` } });

    const email = userResponse.data.email;

    if (
      !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE) &&
      !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_EDITOR_ROLE) &&
      !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_AUTHOR_ROLE)
    ) {
      return ctx.send(oauthService.renderSignUpError(`You are not allowed to access this site`));
    }

    const dbUser = await userService.findOneByEmail(email);

    let activateUser;
    let jwtToken;

    if (dbUser) {
      // Already registered
      activateUser = dbUser;
      jwtToken = await tokenService.createJwtToken(dbUser);
    } else {
      const isEmailVerified = userResponse.data.email_verified;
      if (!isEmailVerified) {
        return ctx.send(oauthService.renderSignUpError(`Email ${email} is not verified`));
      }
      // Register a new account
      const keycloakRoles = await roleService.keycloakRoles();

      const roles = (
        keycloakRoles && keycloakRoles['roles']
          ? keycloakRoles['roles'].map((role) => {
              if (role === 1 && !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE)) {
                return null;
              }
              if (role === 2 && !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_EDITOR_ROLE)) {
                return null;
              }
              if (role === 3 && !userResponse.data.roles?.includes(KEYCLOAK_STRAPI_AUTHOR_ROLE)) {
                return null;
              }
              return {
                id: role,
              };
            })
          : []
      ).filter(Boolean);

      const defaultLocale = oauthService.localeFindByHeader(ctx.request.headers);
      activateUser = await oauthService.createUser(email, userResponse.data.family_name, userResponse.data.given_name, defaultLocale, roles);
      jwtToken = await tokenService.createJwtToken(activateUser);

      // Trigger webhook
      await oauthService.triggerWebHook(activateUser);
    }
    // Login Event Call
    oauthService.triggerSignInSuccess(activateUser);

    // Client-side authentication persistence and redirection
    const nonce = v4();
    const html = oauthService.renderSignUpSuccess(jwtToken, activateUser, nonce);
    ctx.set('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
    ctx.send(html);
  } catch (e) {
    console.error(e);
    ctx.send(oauthService.renderSignUpError(e.message));
  }
}

module.exports = {
  keycloakSignIn,
  keycloakSignInCallback,
};
