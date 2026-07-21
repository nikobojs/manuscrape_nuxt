# Test SAML2 authorization locally

NOTICE: this does currently not work.

- Make keycloak run locally using the provided docker compose file
- Login using admin:admin
- Create a realm called `test-realm` (or something else matching your `.env`)
- Set ClientID to http://localhost:3001/saml2
- Set RootURL to http://localhost:3001
- Set Valid redirect URIs to to http://localhost:3001/api/auth/saml/callback
- Set Valid post logout redirect URIs to to http://localhost:3001/api/auth/saml/callback
- Set Advanced->Assertion Consumer Service POST Binding URL to http://localhost:3001/api/auth/saml/callback
- TODO: finish this todo list
