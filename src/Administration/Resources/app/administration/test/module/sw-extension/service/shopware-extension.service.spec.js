import createHttpClient from 'src/core/factory/http.factory';
import createLoginService from 'src/core/service/login.service';
import 'src/module/sw-extension/service';
import 'src/module/sw-extension/';
import 'src/module/sw-extension/store';
import appModulesFixtures from '../../../app/service/_mocks/testApps.json';

const httpClient = createHttpClient(Shopware.Context.api);
Shopware.Application.getContainer('init').httpClient = httpClient;
Shopware.Service().register('loginService', () => {
    return createLoginService(httpClient, Shopware.Context.api);
});

describe('shopware-extension.service', () => {
    let shopwareExtensionService;

    beforeAll(() => {
        shopwareExtensionService = Shopware.Service('shopwareExtensionService');
    });

    describe('canBeOpened', () => {
        it('cant always open themes', () => {
            expect(shopwareExtensionService.canBeOpened({
                isTheme: true
            })).toBe(true);
        });

        it('can not open plugins right now', () => {
            expect(shopwareExtensionService.canBeOpened({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.PLUGIN
            })).toBe(false);
        });

        it('can open apps with main module', () => {
            Shopware.State.commit(
                'shopwareApps/setApps',
                appModulesFixtures
            );

            expect(shopwareExtensionService.canBeOpened({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'testAppA'
            })).toBe(true);
        });

        it('cant not open apps without main modules', () => {
            Shopware.State.commit(
                'shopwareApps/setApps',
                appModulesFixtures
            );

            expect(shopwareExtensionService.canBeOpened({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'testAppB'
            })).toBe(false);
        });
    });

    describe('getOpenLink', () => {
        it('returns always a open link for theme', async () => {
            const themeId = Shopware.Utils.createId();

            const themeRepo = {
                searchIds() {
                    return { data: [themeId] };
                }
            };

            Shopware.Service().register('repositoryFactory', () => ({ create: () => themeRepo }));

            const openLink = await shopwareExtensionService.getOpenLink({
                isTheme: true,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'SwagExampleApp'
            });

            expect(openLink).toEqual({
                name: 'sw.theme.manager.detail',
                params: { id: themeId }
            });
        });

        it('returns valid open link for app with main module', () => {
            Shopware.State.commit(
                'shopwareApps/setApps',
                appModulesFixtures
            );

            expect(shopwareExtensionService.getOpenLink({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'testAppA'
            })).toEqual({
                name: 'sw.my.apps.index',
                params: {
                    appName: 'testAppA'
                }
            });
        });

        test('returns no open link for app without main module', () => {
            Shopware.State.commit(
                'shopwareApps/setApps',
                appModulesFixtures
            );

            expect(shopwareExtensionService.getOpenLink({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'testAppB'
            })).toBeNull();
        });

        it('returns no open link if app can not be found', () => {
            Shopware.State.commit(
                'shopwareApps/setApps',
                appModulesFixtures
            );

            expect(shopwareExtensionService.getOpenLink({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.APP,
                name: 'ThisAppDoesNotExist'
            })).toBeNull();
        });

        it('returns no open link for plugins right now', () => {
            expect(shopwareExtensionService.getOpenLink({
                isTheme: false,
                type: shopwareExtensionService.EXTENSION_TYPES.PLUGIN,
                name: 'SwagNoModule'
            })).toBeNull();
        });
    });
});
