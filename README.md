# Strapi plugin strapi-plugin-sso

The plugin provides single sign-on for strapi >=4.

Makes possible to login strapi via oauth provider, currently only implemented for keycloak

# Install

```shell
yarn add @chordata-insight/strapi-plugin-sso
```

or

```shell
npm i @chordata-insight/strapi-plugin-sso
```

# Requirements

- Strapi v4
- **strapi-plugin-sso**
- Keycloak

# Example Configuration

```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  'strapi-plugin-sso': {
    enabled: true,
    config: {
      // Keycloak
      KEYCLOAK_DOMAIN: '',
      KEYCLOAK_REALM:  '',
      KEYCLOAK_CLIENT_ID: '[Client ID created in GCP]',
      KEYCLOAK_CLIENT_SECRET:'[Client Secret created in GCP]',
      KEYCLOAK_REDIRECT_URI: 'http://localhost:1337/strapi-plugin-sso/keycloak/callback', // URI after successful login
      KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE: 'strapi.super_admin',
      KEYCLOAK_STRAPI_EDITOR_ROLE: 'strapi.editor',
      KEYCLOAK_STRAPI_AUTHOR_ROLE: 'strapi.author',
    },
  },
});
```

# Documentation(English)

[Keycloak SSO Setup](https://github.com/chordata-insight/strapi-plugin-sso/blob/main/docs/en/keycloak/setup.md)

[Keycloak SSO Specifications](https://github.com/chordata-insight/strapi-plugin-sso/blob/main/docs/en/keycloak/admin.md)
