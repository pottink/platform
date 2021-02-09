const { Component, Utils } = Shopware;

Component.extend('sw-cms-el-config-product-name', 'sw-cms-el-config-text', {
    computed: {
        isProductPage() {
            return Utils.get(this.cmsPageState, 'currentPage.type', '') === 'product_detail';
        }
    },

    methods: {
        createdComponent() {
            this.initElementConfig('product-name');

            if (this.isProductPage && !Utils.get(this.element, 'translated.config.content')) {
                this.element.config.content.source = 'mapped';
                this.element.config.content.value = 'product.name';
            }
        }
    }
});
