<?php declare(strict_types=1);

namespace Shopware\Core\System\Tag;

use Shopware\Core\Checkout\Customer\CustomerCollection;
use Shopware\Core\Checkout\Order\OrderCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Content\Category\CategoryCollection;
use Shopware\Core\Content\LandingPage\LandingPageCollection;
use Shopware\Core\Content\Media\MediaCollection;
use Shopware\Core\Content\Newsletter\Aggregate\NewsletterRecipient\NewsletterRecipientCollection;
use Shopware\Core\Content\Product\ProductCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class TagEntity extends Entity
{
    use EntityIdTrait;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var ProductCollection|null
     */
    protected $products;

    /**
     * @var MediaCollection|null
     */
    protected $media;

    /**
     * @var CategoryCollection|null
     */
    protected $categories;

    /**
     * @var CustomerCollection|null
     */
    protected $customers;

    /**
     * @var OrderCollection|null
     */
    protected $orders;

    /**
     * @var ShippingMethodCollection|null
     */
    protected $shippingMethods;

    /**
     * @var NewsletterRecipientCollection|null
     */
    protected $newsletterRecipients;

    /**
     * @internal (flag:FEATURE_NEXT_12032)
     *
     * @var LandingPageCollection|null
     */
    protected $landingPages;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getProducts(): ?ProductCollection
    {
        return $this->products;
    }

    public function setProducts(ProductCollection $products): void
    {
        $this->products = $products;
    }

    public function getMedia(): ?MediaCollection
    {
        return $this->media;
    }

    public function setMedia(MediaCollection $media): void
    {
        $this->media = $media;
    }

    public function getCategories(): ?CategoryCollection
    {
        return $this->categories;
    }

    public function setCategories(CategoryCollection $categories): void
    {
        $this->categories = $categories;
    }

    public function getCustomers(): ?CustomerCollection
    {
        return $this->customers;
    }

    public function setCustomers(CustomerCollection $customers): void
    {
        $this->customers = $customers;
    }

    public function getOrders(): ?OrderCollection
    {
        return $this->orders;
    }

    public function setOrders(OrderCollection $orders): void
    {
        $this->orders = $orders;
    }

    public function getShippingMethods(): ?ShippingMethodCollection
    {
        return $this->shippingMethods;
    }

    public function setShippingMethods(ShippingMethodCollection $shippingMethods): void
    {
        $this->shippingMethods = $shippingMethods;
    }

    public function getNewsletterRecipients(): ?NewsletterRecipientCollection
    {
        return $this->newsletterRecipients;
    }

    public function setNewsletterRecipients(NewsletterRecipientCollection $newsletterRecipients): void
    {
        $this->newsletterRecipients = $newsletterRecipients;
    }

    /**
     * @internal (flag:FEATURE_NEXT_12032)
     */
    public function getLandingPages(): ?LandingPageCollection
    {
        return $this->landingPages;
    }

    /**
     * @internal (flag:FEATURE_NEXT_12032)
     */
    public function setLandingPages(LandingPageCollection $landingPages): void
    {
        $this->landingPages = $landingPages;
    }
}
