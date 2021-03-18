import template from './sw-customer-list.html.twig';
import './sw-customer-list.scss';

const { Component, Mixin } = Shopware;
const { Criteria } = Shopware.Data;

Component.register('sw-customer-list', {
    template,

    inject: ['repositoryFactory', 'acl', 'filterFactory'],

    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('salutation'),
        Mixin.getByName('listing')
    ],

    data() {
        return {
            customers: null,
            sortBy: 'customerNumber',
            naturalSorting: true,
            sortDirection: 'DESC',
            isLoading: false,
            showDeleteModal: false,
            filterLoading: false,
            availableAffiliateCodes: [],
            affiliateCodeFilter: [],
            availableCampaignCodes: [],
            campaignCodeFilter: [],
            showOnlyCustomerGroupRequests: false,
            filterCriteria: [],
            defaultFilters: [
                'salutation-filter',
                'account-status-filter',
                'default-payment-method-filter',
                'group-filter',
                'billing-address-country-filter',
                'shipping-address-country-filter',
                'tags-filter'
            ],
            storeKey: 'grid.filter.customer',
            activeFilterNumber: 0
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        };
    },

    computed: {
        customerRepository() {
            return this.repositoryFactory.create('customer');
        },

        customerColumns() {
            return this.getCustomerColumns();
        },

        defaultCriteria() {
            const defaultCriteria = new Criteria(this.page, this.limit);
            this.naturalSorting = this.sortBy === 'customerNumber';

            defaultCriteria.setTerm(this.term);
            if (this.affiliateCodeFilter.length > 0) {
                defaultCriteria.addFilter(Criteria.equalsAny('affiliateCode', this.affiliateCodeFilter));
            }
            if (this.campaignCodeFilter.length > 0) {
                defaultCriteria.addFilter(Criteria.equalsAny('campaignCode', this.campaignCodeFilter));
            }

            if (this.showOnlyCustomerGroupRequests) {
                defaultCriteria.addFilter(Criteria.not('OR', [Criteria.equals('requestedGroupId', null)]));
            }

            this.sortBy.split(',').forEach(sortBy => {
                defaultCriteria.addSorting(Criteria.sort(sortBy, this.sortDirection, this.naturalSorting));
            });

            defaultCriteria
                .addAssociation('defaultBillingAddress')
                .addAssociation('group')
                .addAssociation('requestedGroup')
                .addAssociation('salesChannel');

            this.filterCriteria.forEach(filter => {
                defaultCriteria.addFilter(filter);
            });

            return defaultCriteria;
        },

        filterSelectCriteria() {
            const criteria = new Criteria(1, 1);
            criteria.addFilter(Criteria.not(
                'AND',
                [Criteria.equals('affiliateCode', null), Criteria.equals('campaignCode', null)]
            ));
            criteria.addAggregation(Criteria.terms('affiliateCodes', 'affiliateCode', null, null, null));
            criteria.addAggregation(Criteria.terms('campaignCodes', 'campaignCode', null, null, null));

            return criteria;
        },

        listFilters() {
            return this.filterFactory.create('customer', {
                'salutation-filter': {
                    property: 'salutation',
                    label: this.$tc('sw-customer.filter.salutation.label'),
                    placeholder: this.$tc('sw-customer.filter.salutation.placeholder'),
                    labelProperty: 'displayName'
                },
                'account-status-filter': {
                    property: 'active',
                    label: this.$tc('sw-customer.filter.status.label'),
                    placeholder: this.$tc('sw-customer.filter.status.placeholder')
                },
                'default-payment-method-filter': {
                    property: 'defaultPaymentMethod',
                    label: this.$tc('sw-customer.filter.defaultPaymentMethod.label'),
                    placeholder: this.$tc('sw-customer.filter.defaultPaymentMethod.placeholder')
                },
                'group-filter': {
                    property: 'group',
                    label: this.$tc('sw-customer.filter.customerGroup.label'),
                    placeholder: this.$tc('sw-customer.filter.customerGroup.placeholder')
                },
                'billing-address-country-filter': {
                    property: 'defaultBillingAddress.country',
                    label: this.$tc('sw-customer.filter.billingCountry.label'),
                    placeholder: this.$tc('sw-customer.filter.billingCountry.placeholder')
                },
                'shipping-address-country-filter': {
                    property: 'defaultShippingAddress.country',
                    label: this.$tc('sw-customer.filter.shippingCountry.label'),
                    placeholder: this.$tc('sw-customer.filter.shippingCountry.placeholder')
                },
                'tags-filter': {
                    property: 'tags',
                    label: this.$tc('sw-customer.filter.tags.label'),
                    placeholder: this.$tc('sw-customer.filter.tags.placeholder')
                }
            });
        }
    },

    created() {
        this.createdComponent();
    },

    watch: {
        defaultCriteria: {
            handler() {
                this.getList();
            },
            deep: true
        }
    },

    methods: {
        createdComponent() {
            this.loadFilterValues();
        },

        onInlineEditSave(promise, customer) {
            promise.then(() => {
                this.createNotificationSuccess({
                    message: this.$tc('sw-customer.detail.messageSaveSuccess', 0, { name: this.salutation(customer) })
                });
            }).catch(() => {
                this.getList();
                this.createNotificationError({
                    message: this.$tc('sw-customer.detail.messageSaveError')
                });
            });
        },

        async getList() {
            this.isLoading = true;

            const criteria = await Shopware.Service('filterService')
                .mergeWithStoredFilters(this.storeKey, this.defaultCriteria);

            this.activeFilterNumber = criteria.filters.length;

            try {
                const items = await this.customerRepository.search(this.defaultCriteria, Shopware.Context.api);

                this.total = items.total;
                this.customers = items;
                this.isLoading = false;
                this.selection = {};
            } catch {
                this.isLoading = false;
            }
        },

        onDelete(id) {
            this.showDeleteModal = id;
        },

        onCloseDeleteModal() {
            this.showDeleteModal = false;
        },

        onConfirmDelete(id) {
            this.showDeleteModal = false;

            return this.customerRepository.delete(id, Shopware.Context.api).then(() => {
                this.getList();
            });
        },

        getCustomerColumns() {
            const columns = [{
                property: 'firstName',
                dataIndex: 'lastName,firstName',
                inlineEdit: 'string',
                label: 'sw-customer.list.columnName',
                routerLink: 'sw.customer.detail',
                width: '250px',
                allowResize: true,
                primary: true,
                useCustomSort: true
            }, {
                property: 'defaultBillingAddress.street',
                label: 'sw-customer.list.columnStreet',
                allowResize: true,
                useCustomSort: true
            }, {
                property: 'defaultBillingAddress.zipcode',
                label: 'sw-customer.list.columnZip',
                align: 'right',
                allowResize: true,
                useCustomSort: true
            }, {
                property: 'defaultBillingAddress.city',
                label: 'sw-customer.list.columnCity',
                allowResize: true,
                useCustomSort: true
            }, {
                property: 'customerNumber',
                dataIndex: 'customerNumber',
                naturalSorting: true,
                label: 'sw-customer.list.columnCustomerNumber',
                allowResize: true,
                inlineEdit: 'string',
                align: 'right',
                useCustomSort: true
            }, {
                property: 'group',
                dataIndex: 'group',
                naturalSorting: true,
                label: 'sw-customer.list.columnGroup',
                allowResize: true,
                inlineEdit: 'string',
                align: 'right',
                useCustomSort: true
            }, {
                property: 'email',
                inlineEdit: 'string',
                label: 'sw-customer.list.columnEmail',
                allowResize: true,
                useCustomSort: true
            }, {
                property: 'affiliateCode',
                inlineEdit: 'string',
                label: 'sw-customer.list.columnAffiliateCode',
                allowResize: true,
                visible: false,
                useCustomSort: true
            }, {
                property: 'campaignCode',
                inlineEdit: 'string',
                label: 'sw-customer.list.columnCampaignCode',
                allowResize: true,
                visible: false,
                useCustomSort: true
            }, {
                property: 'boundSalesChannelId',
                label: 'sw-customer.list.columnBoundSalesChannel',
                allowResize: true,
                visible: false,
                useCustomSort: true
            }];

            return columns;
        },

        loadFilterValues() {
            this.filterLoading = true;

            return this.customerRepository.search(this.filterSelectCriteria, Shopware.Context.api)
                .then(({ aggregations }) => {
                    this.availableAffiliateCodes = aggregations.affiliateCodes.buckets;
                    this.availableCampaignCodes = aggregations.campaignCodes.buckets;
                    this.filterLoading = false;

                    return aggregations;
                }).catch(() => {
                    this.filterLoading = false;
                });
        },

        onChangeAffiliateCodeFilter(value) {
            this.affiliateCodeFilter = value;
            this.getList();
        },

        onChangeCampaignCodeFilter(value) {
            this.campaignCodeFilter = value;
            this.getList();
        },

        onChangeRequestedGroupFilter(value) {
            this.showOnlyCustomerGroupRequests = value;
            this.getList();
        },

        updateCriteria(criteria) {
            this.page = 1;
            this.filterCriteria = criteria;
        }
    }
});
