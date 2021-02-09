import template from './sw-extension-store-listing.html.twig';
import './sw-extension-store-listing.scss';

const { Component } = Shopware;

/**
 * @private
 */
Component.register('sw-extension-store-listing', {
    name: 'sw-extension-store-listing',
    template,

    inject: ['feature'],

    mixins: ['sw-extension-error'],

    data() {
        return {
            isLoading: false
        };
    },

    computed: {
        extensions() {
            return Shopware.State.get('shopwareExtensions').extensionListing;
        },

        currentSearch() {
            return Shopware.State.get('shopwareExtensions').search;
        },

        page() {
            return this.currentSearch.page;
        },

        limit() {
            return this.currentSearch.limit;
        },

        total() {
            return this.extensions.total || 0;
        },

        category() {
            return this.currentSearch.category;
        },

        rating() {
            return this.currentSearch.rating;
        },

        languageId() {
            return Shopware.State.get('session').languageId;
        },

        assetFilter() {
            return Shopware.Filter.getByName('asset');
        },

        currentLocale() {
            return Shopware.State.get('session').currentLocale === 'de-DE' ? 'de' : 'en';
        }
    },

    watch: {
        currentSearch: {
            deep: true,
            handler() {
                this.getList();
            }
        },
        languageId(newValue) {
            if (newValue !== '') {
                this.getStoreCategories();
                this.getList();
            }
        }
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.getStoreCategories();
        },

        async getList() {
            this.isLoading = true;

            if (this.languageId === '') {
                return;
            }

            try {
                await Shopware.State.dispatch('shopwareExtensions/search');
            } catch (e) {
                this.showExtensionErrors(e);
            } finally {
                this.isLoading = false;
            }
        },

        setPage({ limit, page }) {
            Shopware.State.commit('shopwareExtensions/setSearchValue', { key: 'limit', value: limit });
            Shopware.State.commit('shopwareExtensions/setSearchValue', { key: 'page', value: page });
        },

        async getStoreCategories() {
            if (this.languageId === '') {
                return;
            }

            try {
                await Shopware.State.dispatch('shopwareExtensions/getStoreCategories');
            } catch (e) {
                this.showExtensionErrors(e);
            }
        }
    }
});
