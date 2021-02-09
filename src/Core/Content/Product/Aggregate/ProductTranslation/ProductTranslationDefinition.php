<?php declare(strict_types=1);

namespace Shopware\Core\Content\Product\Aggregate\ProductTranslation;

use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityTranslationDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\CustomFields;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\AllowHtml;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\JsonField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ListField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\LongTextField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\Framework\Feature;

class ProductTranslationDefinition extends EntityTranslationDefinition
{
    public const ENTITY_NAME = 'product_translation';

    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    public function isVersionAware(): bool
    {
        return true;
    }

    public function getCollectionClass(): string
    {
        return ProductTranslationCollection::class;
    }

    public function getEntityClass(): string
    {
        return ProductTranslationEntity::class;
    }

    public function since(): ?string
    {
        return '6.0.0.0';
    }

    protected function getParentDefinitionClass(): string
    {
        return ProductDefinition::class;
    }

    protected function defineFields(): FieldCollection
    {
        $collection = new FieldCollection([
            new StringField('meta_description', 'metaDescription'),
            (new StringField('name', 'name'))->addFlags(new Required()),
            new LongTextField('keywords', 'keywords'),
            (new LongTextField('description', 'description'))->addFlags(new AllowHtml()),
            new StringField('meta_title', 'metaTitle'),
            new StringField('pack_unit', 'packUnit'),
            new StringField('pack_unit_plural', 'packUnitPlural'),
            new ListField('custom_search_keywords', 'customSearchKeywords'),

            new CustomFields(),
        ]);

        if (Feature::isActive('FEATURE_NEXT_10078')) {
            $collection->add(
                new JsonField('slot_config', 'slotConfig')
            );
        }

        return $collection;
    }
}
