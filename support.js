const {displayGraphQL, displayRest} = require('./display');

/**
 * Helpers design to be over written by specific auth code, if needed. Expects in auth format
 * https://github.com/request/request#http-authentication
 */
const bearerAuth = () => Cypress.env('accessToken') ? { bearer: Cypress.env('accessToken') } : null;
const graphQLAuth = () => Cypress.env('graphQLAuth') ? Cypress.env('graphQLAuth') : bearerAuth();
const restAuth = () => Cypress.env('restAuth') ? Cypress.env('restAuth') : bearerAuth();

/**
 * Helper to perform GraphQL queries on the API
 * Will display the query and response in the pane, for easy review.
 * Automatically uses cy.env('accessToken') for auth
 * @param  {graphQL} query - Query or Mutation graphQL
 * @param  {Object} variables - Key value pairs/object used as parameters to the query
 */
Cypress.Commands.add('graphQL', { prevSubject: false }, (query, variables) => {
  // Perform the query
  cy.request({
    method: 'POST',
    url: `${Cypress.config().baseUrl}/graphql`,
    body: { query, variables },
    auth: graphQLAuth(),
    log: false,
    failOnStatusCode: false,
  }).then((res) => {
    const {
      duration,
      body: { errors, data },
      status,
      statusText,
      ...debug
    } = res;
    const title = `${query.substring(0, query.indexOf('('))}`
    const message = `${title} - ${duration} ms  (${statusText})`;

    const interestingData = {
      title,
      query,
      variables,
      status,
      statusText,
      duration,
      data,
      errors,
      debug,
    };

    // log the response
    Cypress.log({
      name: 'GraphQL',
      message,
      consoleProps() {
        return interestingData;
      },
    });

    displayGraphQL(interestingData);

    return interestingData;
  });
});

/**
 * Helper to periodically perform a graphQL query, checking the response against a condition.
 * 
 * @param  {graphQL} query - Query or Mutation graphQL
 * @param  {Object} variables - Key value pairs/object used as parameters to the query
 * @param  {Function} condition - Response data passed to this function, failed expects will trigger a loop. 
 * @param  {Number} wait=100 - Millisecond delay between polling
 * @param  {Number} maxTries=5 - Maximum number of retries before failing totally.
 */
Cypress.Commands.add('graphQLPolling', { prevSubject: false }, (query, variables, condition, wait = 100, maxTries = 5) => {
    let retries = -1;
    function makeRequest() {
      retries++;
      return cy.graphQL(query, variables).then((resp) => {
        try {
          condition(resp);
        } catch (err) {
          if (retries > maxTries)
            throw new Error(`retried too many times (${retries})`);
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(wait);
          return makeRequest();
        }
        return resp;
      });
    }

    return makeRequest();
  },
);

/**
 * Wrapper to perform REST based API queries. Improved logging and review.
 * @param  {String} method='GET' - REST method to use
 * @param  {String} url - relative or absolute URL to hit
 * @param  {Object} postBody - Post body
 */
Cypress.Commands.add('rest', { prevSubject: false }, (method = 'GET', url, postBody) => {
  const fullUrl = url.substring(0,4) == 'http' ? url : `${Cypress.config().baseUrl}${url}`;

  // Perform the query
  cy.request({
    method: method,
    url: fullUrl,
    body: postBody,
    auth: restAuth(),
    log: false,
    failOnStatusCode: false,
  }).then((res) => {
    const {
      duration,
      body,
      status,
      statusText,
      ...debug
    } = res;
    const title = `${method} ${url}`;
    const message = `${title} - ${duration} ms  (${statusText})`;

    const interestingData = {
      title,
      url,
      postBody,
      status,
      statusText,
      duration,
      body,
      debug,
    };

    // log the response
    Cypress.log({
      name: 'REST',
      message,
      consoleProps() {
        return interestingData;
      },
    });

    displayRest(interestingData);

    return interestingData;
  });
});

/**
 * Helper to periodically perform a graphQL query, checking the response against a condition.
 * 
 * @param  {String} method='GET' - REST method to use
 * @param  {String} url - relative or absolute URL to hit
 * @param  {Object} postBody - Post body
 * @param  {Function} condition - Response data passed to this function, failed expects will trigger a loop. 
 * @param  {Number} wait=100 - Millisecond delay between polling
 * @param  {Number} maxTries=5 - Maximum number of retries before failing totally.
 */
 Cypress.Commands.add('restPolling', { prevSubject: false }, (method = 'GET', url, postBody, condition, wait = 100, maxTries = 5) => {
  let retries = -1;
  function makeRequest() {
    retries++;
    return cy.rest(method, url, postBody).then((resp) => {
      try {
        condition(resp);
      } catch (err) {
        if (retries > maxTries)
          throw new Error(`retried too many times (${retries})`);
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(wait);
        return makeRequest();
      }
      return resp;
    });
  }

  return makeRequest();
},
);