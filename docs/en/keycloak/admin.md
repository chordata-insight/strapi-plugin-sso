# Specification

## Available setting values

| Key                              | required | default                                                   |
|----------------------------------|----------|-----------------------------------------------------------|
| GOOGLE_OAUTH_CLIENT_ID           | ✅        | -                                                         |
| GOOGLE_OAUTH_CLIENT_SECRET       | ✅        | -                                                         |
| COGNITO_OAUTH_REDIRECT_URI       | ✅        | http://localhost:1337/strapi-plugin-sso/keycloak/callback |
| KEYCLOAK_DOMAIN                  | ✅        | -                                                         |
| KEYCLOAK_REALM                   | ✅        | -                                                         |
| KEYCLOAK_STRAPI_SUPER_ADMIN_ROLE | x        | strapi.super-admin                                        |
| KEYCLOAK_STRAPI_EDITOR_ROLE      | x        | strapi.editor                                             |
| KEYCLOAK_STRAPI_AUTHOR_ROLE      | x        | strapi.author                                             |
