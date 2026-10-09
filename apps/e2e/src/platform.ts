// Where each part of the platform answers during development. The tests see
// the platform from here, through a browser and over HTTP, and never through
// its code.
export const shopperUrl = 'http://localhost:3000';
export const apiUrl = 'http://localhost:3001';
export const dashboardUrl = 'http://localhost:3002';
export const keycloakUrl = 'http://localhost:8080';

// The realm that issues the platform's logins.
export const realmUrl = `${keycloakUrl}/realms/pcp`;
