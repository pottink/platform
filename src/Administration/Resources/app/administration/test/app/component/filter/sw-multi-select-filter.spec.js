import { shallowMount, createLocalVue } from '@vue/test-utils';
import 'src/app/component/filter/sw-multi-select-filter';
import 'src/app/component/filter/sw-base-filter';
import 'src/app/component/form/select/entity/sw-entity-multi-select';
import 'src/app/component/form/select/base/sw-select-base';
import 'src/app/component/form/field-base/sw-block-field';
import 'src/app/component/form/field-base/sw-base-field';
import 'src/app/component/form/select/base/sw-select-result-list';
import 'src/app/component/form/select/base/sw-select-selection-list';
import 'src/app/component/utils/sw-loader';
import 'src/app/component/utils/sw-popover';
import 'src/app/component/form/select/base/sw-select-result';
import 'src/app/component/base/sw-highlight-text';

const { Criteria, EntityCollection } = Shopware.Data;

const entities = [
    { id: 'id1', name: 'first' }
];

function getCollection() {
    return new EntityCollection(
        '/test-entity',
        'testEntity',
        null,
        { isShopwareContext: true },
        entities,
        entities.length,
        null
    );
}
function createWrapper() {
    const localVue = createLocalVue();
    localVue.directive('popover', {});
    localVue.directive('tooltip', {});

    return shallowMount(Shopware.Component.build('sw-multi-select-filter'), {
        localVue,
        stubs: {
            'sw-base-filter': Shopware.Component.build('sw-base-filter'),
            'sw-entity-multi-select': Shopware.Component.build('sw-entity-multi-select'),
            'sw-block-field': Shopware.Component.build('sw-block-field'),
            'sw-select-base': Shopware.Component.build('sw-select-base'),
            'sw-base-field': Shopware.Component.build('sw-base-field'),
            'sw-select-result-list': Shopware.Component.build('sw-select-result-list'),
            'sw-select-selection-list': Shopware.Component.build('sw-select-selection-list'),
            'sw-loader': Shopware.Component.build('sw-loader'),
            'sw-popover': Shopware.Component.build('sw-popover'),
            'sw-select-result': Shopware.Component.build('sw-select-result'),
            'sw-highlight-text': Shopware.Component.build('sw-highlight-text'),
            'sw-icon': true,
            'sw-label': true,
            'sw-field-error': {
                template: '<div></div>'
            }
        },
        provide: {
            repositoryFactory: {
                create: () => {
                    return {
                        get: (value) => Promise.resolve({ id: value, name: value }),
                        search: () => Promise.resolve(getCollection())
                    };
                }
            }
        },
        mocks: {
            $tc: t => t
        },
        propsData: {
            filter: {
                name: 'category-filter',
                property: 'category',
                placeholder: 'placeholder',
                label: 'Test',
                schema: {
                    entity: 'entity',
                    referenceField: 'id'
                }
            }
        }
    });
}

describe('src/app/component/filter/sw-multi-select-filter', () => {
    it('should be a Vue.js component', async () => {
        const wrapper = createWrapper();

        expect(wrapper.vm).toBeTruthy();
    });

    it('Should display title and placeholder', () => {
        const wrapper = createWrapper();

        expect(wrapper.find('.sw-base-filter .sw-base-filter__title').text()).toBe('Test');
        expect(wrapper.find('.sw-select-selection-list__input').attributes().placeholder).toBe('placeholder');
    });

    it('should emit `updateFilter` event when user choose entity', async () => {
        const wrapper = createWrapper();

        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        wrapper.find('.sw-select__selection').trigger('click');

        await wrapper.find('input').trigger('change');
        await wrapper.vm.$nextTick();

        const list = wrapper.find('.sw-select-result-list__item-list').findAll('li');

        list.at(0).trigger('click');

        expect(wrapper.emitted().updateFilter[0]).toEqual([
            'category-filter',
            [Criteria.equalsAny('category.id', ['id1'])]
        ]);

        expect(wrapper.emitted().resetFilter).toBeFalsy();
    });

    it('should emit `resetFilter` event when click Reset button', async () => {
        const wrapper = createWrapper();

        const entityCollection = new EntityCollection(null, null, null, new Criteria(), [
            { id: 'id1', name: 'item1' },
            { id: 'id2', name: 'item2' }
        ]);

        await wrapper.setData({
            values: entityCollection
        });

        // Trigger click Reset button
        wrapper.find('.sw-base-filter__reset').trigger('click');
        expect(wrapper.emitted().updateFilter).toBeFalsy();
        expect(wrapper.emitted().resetFilter).toBeTruthy();
    });
});
