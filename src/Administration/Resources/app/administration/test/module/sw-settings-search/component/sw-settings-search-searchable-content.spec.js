import { createLocalVue, shallowMount } from '@vue/test-utils';
import 'src/module/sw-settings-search/component/sw-settings-search-searchable-content';
import 'src/module/sw-settings-search/component/sw-settings-search-example-modal';

function createWrapper() {
    const localVue = createLocalVue();

    return shallowMount(Shopware.Component.build('sw-settings-search-searchable-content'), {
        localVue,

        mocks: {
            $tc: key => key
        },

        stubs: {
            'sw-card': true,
            'sw-container': true,
            'sw-button': {
                template: '<button @click="$emit(\'click\', $event)"><slot></slot></button>'
            },
            'sw-icon': true,
            'sw-tabs': true,
            'sw-settings-search-example-modal': Shopware.Component.build('sw-settings-search-example-modal'),
            'sw-modal': true
        }
    });
}

describe('module/sw-settings-search/component/sw-settings-search-searchable-content', () => {
    it('should be a Vue.JS component', async () => {
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm).toBeTruthy();
    });

    it('Should be show example modal when the link was clicked ', async () => {
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        const linkElement = wrapper.find('.sw-settings-search__searchable-content-show-example-link');

        await linkElement.trigger('click');
        expect(wrapper.vm.showExampleModal).toBe(true);

        await wrapper.vm.onShowExampleModal();
        const modalElement = wrapper.find('.sw-settings-search-example-modal');
        expect(modalElement.isVisible()).toBe(true);
    });
});
