<?php declare(strict_types=1);

namespace Shopware\Core\Content\Rule\DataAbstractionLayer;

use Shopware\Core\Content\Rule\RuleDefinition;
use Shopware\Core\Content\Rule\RuleEntity;
use Shopware\Core\Content\Rule\RuleEvents;
use Shopware\Core\Framework\Adapter\Cache\CacheClearer;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityLoadedEvent;
use Shopware\Core\Framework\Feature;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class RulePayloadSubscriber implements EventSubscriberInterface
{
    /**
     * @var CacheClearer
     */
    private $cacheClearer;

    /**
     * @var RulePayloadUpdater
     */
    private $updater;

    public function __construct(RulePayloadUpdater $updater, CacheClearer $cacheClearer)
    {
        $this->updater = $updater;
        $this->cacheClearer = $cacheClearer;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            RuleEvents::RULE_LOADED_EVENT => 'unserialize',
        ];
    }

    public function unserialize(EntityLoadedEvent $event): void
    {
        $this->indexIfNeeded($event);

        /** @var RuleEntity $entity */
        foreach ($event->getEntities() as $entity) {
            $payload = $entity->getPayload();
            if ($payload === null || !\is_string($payload)) {
                continue;
            }

            $entity->setPayload(unserialize($payload));
        }
    }

    private function indexIfNeeded(EntityLoadedEvent $event): void
    {
        $rules = [];

        /** @var RuleEntity $rule */
        foreach ($event->getEntities() as $rule) {
            if ($rule->getPayload() === null && !$rule->isInvalid()) {
                $rules[$rule->getId()] = $rule;
            }
        }

        if (!\count($rules)) {
            return;
        }

        $updated = $this->updater->update(array_keys($rules));

        foreach ($updated as $id => $entity) {
            $rules[$id]->assign($entity);
        }

        //@internal (flag:FEATURE_NEXT_10514) Remove with feature flag
        if (!Feature::isActive('FEATURE_NEXT_10514')) {
            $this->cacheClearer->invalidateIds(array_keys($updated), RuleDefinition::ENTITY_NAME);
        }
    }
}
