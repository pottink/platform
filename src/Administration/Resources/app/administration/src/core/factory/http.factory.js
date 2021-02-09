/**
 * @module core/factory/http
 */
import Axios from 'axios';
import RefreshTokenHelper from 'src/core/helper/refresh-token.helper';

/**
 * Initializes the HTTP client with the provided context. The context provides the API end point and will be used as
 * the base url for the HTTP client.
 *
 * @method createHTTPClient
 * @memberOf module:core/factory/http
 * @param {Context} context Information about the environment
 * @returns {AxiosInstance}
 */
export default function createHTTPClient(context) {
    return createClient(context);
}

/**
 * Provides CancelToken so a request's promise from Http Client could be canceled.
 *
 * @returns { CancelToken, isCancel, Cancel}
 */
export const { CancelToken, isCancel, Cancel } = Axios;

/**
 * Creates the HTTP client with the provided context.
 *
 * @param {Context} context Information about the environment
 * @returns {AxiosInstance}
 */
function createClient() {
    const client = Axios.create({
        baseURL: getBasePath(Shopware.Context.api.apiVersion - 1)
    });

    refreshTokenInterceptor(client);
    globalErrorHandlingInterceptor(client);

    wrapMethod(client, 'request', (args) => changeVersion(args[0]));
    wrapMethod(client, 'get', (args) => changeVersion(args[1]));
    wrapMethod(client, 'delete', (args) => changeVersion(args[1]));
    wrapMethod(client, 'head', (args) => changeVersion(args[1]));
    wrapMethod(client, 'options', (args) => changeVersion(args[1]));
    wrapMethod(client, 'post', (args) => changeVersion(args[2]));
    wrapMethod(client, 'put', (args) => changeVersion(args[2]));
    wrapMethod(client, 'patch', (args) => changeVersion(args[2]));

    return client;
}

/**
 * Creates a wrapper around a method
 *
 * @param original
 * @param functionName
 * @param cb {function}
 */
function wrapMethod(original, functionName, cb) {
    (function wrap() {
        const _original = original[functionName];

        original[functionName] = function wrappedFunction(...args) {
            cb(args);

            return _original.apply(this, args);
        };
    }());
}

/**
 * change the request url with the given version in the configuration
 * @param config
 */
function changeVersion(config) {
    if (!config || !config.version) {
        checkVersionDeprecation(Shopware.Context.api.apiVersion - 1);
        return;
    }

    config.baseURL = getBasePath(config.version);

    checkVersionDeprecation(config.version);

    delete config.version;
}

function checkVersionDeprecation(version) {
    if (version >= Shopware.Context.api.apiVersion) {
        return;
    }

    Shopware.Utils.debug.warn(
        'httpClient',
        `The request uses a deprecated api version: ${version}. You should upgrade the request to the latest api version.`
    );
}

/**
 * Returns the base path of the version
 * @param {number} version
 * @returns {string}
 */
function getBasePath(version = Shopware.Context.api.apiVersion) {
    if (version <= 0) {
        version = Shopware.Context.api.apiVersion;
    }

    return `${Shopware.Context.api.apiPath}/v${version}`;
}

/**
 * Sets up an interceptor to process global request errors
 * @param {AxiosInstance} client
 * @returns {AxiosInstance}
 */
function globalErrorHandlingInterceptor(client) {
    client.interceptors.response.use(response => response, error => {
        const { response: { status, data: { errors, data } } } = error;

        try {
            handleErrorStates({ status, errors, error, data });
        } catch (e) {
            Shopware.Utils.debug.error(e);

            if (errors) {
                errors.forEach(singleError => {
                    Shopware.State.dispatch('notification/createNotification', {
                        variant: 'error',
                        title: singleError.title,
                        message: singleError.detail
                    });
                });
            }
        }

        return Promise.reject(error);
    });

    return client;
}

/**
 * Determines the different status codes and creates a matching error via Shopware.State
 * @param {Number} status
 * @param {Array} errors
 * @param {Object} error
 * @param {Object} data
 */
function handleErrorStates({ status, errors, error = null, data }) {
    // Get $tc for translations and bind the Vue component scope to make it working
    const viewRoot = Shopware.Application.view.root;
    const $tc = viewRoot.$tc.bind(viewRoot);

    // Handle sync-api errors
    if (status === 400 &&
        Shopware.Feature.isActive('FEATURE_NEXT_10539') &&
        Shopware.Utils.get(error, 'response.config.url', '').includes('_action/sync')) {
        if (!data) {
            return;
        }

        // Get data for each entity
        Object.values(data).forEach((item) => {
            // Get error for each result
            item.result.forEach((resultItem) => {
                if (!resultItem.errors.length) {
                    return;
                }

                const statusCode = parseInt(resultItem.errors[0].status, 10);
                handleErrorStates({ status: statusCode, errors: resultItem.errors, data });
            });
        });
    }

    if (status === 403) {
        const missingPrivilegeErrors = errors.filter(e => e.code === 'FRAMEWORK__MISSING_PRIVILEGE_ERROR');
        missingPrivilegeErrors.forEach(missingPrivilegeError => {
            const detail = JSON.parse(missingPrivilegeError.detail);
            let missingPrivileges = detail.missingPrivileges;

            // check if response is an object and not an array. If yes, then convert it
            if (!Array.isArray(missingPrivileges) && typeof missingPrivileges === 'object') {
                missingPrivileges = Object.values(missingPrivileges);
            }

            const missingPrivilegesMessage = missingPrivileges.reduce((message, privilege) => {
                return `${message}<br>"${privilege}"`;
            }, '');

            Shopware.State.dispatch('notification/createNotification', {
                variant: 'error',
                system: true,
                autoClose: false,
                growl: true,
                title: $tc('global.error-codes.FRAMEWORK__MISSING_PRIVILEGE_ERROR'),
                message: `${$tc('sw-privileges.error.description')} <br> ${missingPrivilegesMessage}`
            });
        });
    }

    if (status === 409) {
        if (errors[0].code === 'FRAMEWORK__DELETE_RESTRICTED') {
            const parameters = errors[0].meta.parameters;

            const entityName = parameters.entity;
            let blockingEntities = '';
            if (Shopware.Feature.isActive('FEATURE_NEXT_10539')) {
                blockingEntities = parameters.usages.reduce((message, usageObject) => {
                    const times = usageObject.count;
                    const timesSnippet = $tc('global.default.xTimesIn', times);
                    const blockingEntitiesSnippet = $tc(`global.entities.${usageObject.entityName}`, times[1]);
                    return `${message}<br>${timesSnippet} <b>${blockingEntitiesSnippet}</b>`;
                }, '');
            } else {
                blockingEntities = parameters.usages.reduce((message, entity) => {
                    const times = entity.match(/ \(([0-9]*)?\)/, '');
                    const timesSnippet = $tc('global.default.xTimesIn', times[1]);
                    const blockingEntitiesSnippet = $tc(`global.entities.${entity.replace(/ \([0-9]*?\)/, '')}`, times[1]);
                    return `${message}<br>${timesSnippet} <b>${blockingEntitiesSnippet}</b>`;
                }, '');
            }
            Shopware.State.dispatch('notification/createNotification', {
                variant: 'error',
                title: $tc('global.default.error'),
                message: `${$tc(
                    'global.notification.messageDeleteFailed',
                    3,
                    { entityName: $tc(`global.entities.${entityName}`) }
                )
                }${blockingEntities}`
            });
        }
    }

    if (status === 412) {
        const frameworkLanguageNotFound = errors.find((e) => e.code === 'FRAMEWORK__LANGUAGE_NOT_FOUND');

        if (frameworkLanguageNotFound) {
            localStorage.removeItem('sw-admin-current-language');

            Shopware.State.dispatch('notification/createNotification', {
                variant: 'error',
                system: true,
                autoClose: false,
                growl: true,
                title: frameworkLanguageNotFound.title,
                message: `${frameworkLanguageNotFound.detail} Please reload the administration.`,
                actions: [
                    {
                        label: 'Reload administration',
                        method: () => window.location.reload()
                    }
                ]
            });
        }
    }
}

/**
 * Sets up an interceptor to refresh the token, cache the requests and retry them after the token got refreshed.
 *
 * @param {AxiosInstance} client
 * @returns {AxiosInstance}
 */
function refreshTokenInterceptor(client) {
    const tokenHandler = new RefreshTokenHelper();

    client.interceptors.response.use((response) => {
        return response;
    }, (error) => {
        const { config, response: { status } } = error;
        const originalRequest = config;
        const resource = originalRequest.url.replace(originalRequest.baseURL, '');

        if (tokenHandler.whitelist.includes(resource)) {
            return Promise.reject(error);
        }

        if (status === 401) {
            if (!tokenHandler.isRefreshing) {
                tokenHandler.fireRefreshTokenRequest().catch(() => {
                    return Promise.reject(error);
                });
            }

            return new Promise((resolve, reject) => {
                tokenHandler.subscribe((newToken) => {
                    // replace the expired token and retry
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    originalRequest.url = originalRequest.url.replace(originalRequest.baseURL, '');
                    resolve(Axios(originalRequest));
                }, (err) => {
                    if (!Shopware.Application.getApplicationRoot()) {
                        reject(err);
                        window.location.reload();
                        return;
                    }
                    Shopware.Application.getApplicationRoot().$router.push({ name: 'sw.login.index' });
                    reject(err);
                });
            });
        }

        return Promise.reject(error);
    });

    return client;
}
