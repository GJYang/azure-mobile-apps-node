// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
/* Not including this in documentation of the public API
@module azure-mobile-apps/express/tables/attachRoutes
@description
This module takes a table configuration object generated by the {@link module:azure-mobile-apps/express/tables/table table module}
and adds appropriate routes for each HTTP verb to a provided express router.
*/

var parseQuery = require('../middleware/parseQuery'),
    parseItem = require('../middleware/parseItem'),
    authorize = require('../middleware/authorize');

/* Creates an express router with appropriate routes configures for each HTTP verb.
@param {module:azure-mobile-apps/express/tables/table} configuration Table configuration object.
@param {express.Router} router Router to attach routes to.
@param {module:azure-mobile-apps/express/middleware/executeOperation} executeOperation An instance of the executeOperation middleware for this table.
@returns An express router with routes configured.
*/
module.exports = function (configuration, router, executeOperation) {
    var defaultRoute = '/',
        idRoute = '/:id';

    configureOperation('read', 'get', [parseQuery(configuration)], [defaultRoute, idRoute]);
    configureOperation('insert', 'post', [parseItem(configuration)], [defaultRoute]);
    configureOperation('undelete', 'post', [parseQuery(configuration)], [idRoute]);
    configureOperation('update', 'patch', [parseItem(configuration)], [defaultRoute, idRoute]);
    configureOperation('delete', 'delete', [parseQuery(configuration)], [defaultRoute, idRoute]);

    // Return table middleware configured by the user (set on the middleware.execute property by the table module).
    // If none has been provided, just return the router we configured
    return !configuration.middleware.execute || configuration.middleware.execute.length === 0
        ? [router]
        : configuration.middleware.execute;

    // attach middleware for the specified operation to the appropriate routes
    function configureOperation(operation, verb, pre, routes) {
        var operationMiddleware = configuration.middleware[operation] || [],
            // if no middleware has been configured for the specific operation, just use the executeOperation middleware
            middleware = operationMiddleware.length === 0
                ? [executeOperation]
                : operationMiddleware;

        // hook up the authorize middleware if specified
        if (configuration.authorize || (configuration[operation] && configuration[operation].authorize)) middleware.unshift(authorize);

        // add required internal middleware, e.g. parseItem, parseQuery
        if (pre) middleware.unshift.apply(middleware, pre);

        routes.forEach(function (route) {
            router[verb](route, middleware);
        });
    }
};