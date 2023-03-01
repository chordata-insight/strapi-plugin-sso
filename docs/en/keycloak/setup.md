# Single sign-on using Keycloak account

First, follow README.md to install the plugin to Strapi Version 4.

A sample local environment is shown below.

## 1. GCP Settings

You must access KC dashboard and create OAuth credentials.

[https://www.keycloak.org/docs/latest/server_admin/](https://www.keycloak.org/docs/latest/server_admin//)

[Credentials] -> [+ CREATE CREDENTIALS] -> [OAuth client ID]

[Application type] -> [WebApplication]

[Authorized JavaScript origins] -> [+ ADD URI] -> "http://localhost:1337"

[Authorized redirect URIs] -> [+ ADD URI] -> "http://localhost:1337/strapi-plugin-sso/keycloak/callback"

[CREATE]

## 2. Plugin Settings

### editing) config/plugins.js

```javascript
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

## 3. Sign in with your Keycloak account

```
http://localhost:1337/strapi-plugin-sso/keycloak
```

If you can see the authentication screen for your Keycloak account and then log in to the administration screen, you are done!
