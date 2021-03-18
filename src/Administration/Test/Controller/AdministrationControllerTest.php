<?php declare(strict_types=1);

namespace Shopware\Administration\Test\Controller;

use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Test\TestCaseBase\AdminApiTestBehaviour;
use Shopware\Core\Framework\Test\TestCaseBase\IntegrationTestBehaviour;

class AdministrationControllerTest extends TestCase
{
    use IntegrationTestBehaviour;
    use AdminApiTestBehaviour;

    public function testSnippetRoute(): void
    {
        $this->getBrowser()->request('GET', '/api/_admin/snippets?locale=de-DE');
        static::assertEquals(200, $this->getBrowser()->getResponse()->getStatusCode());
        $content = $this->getBrowser()->getResponse()->getContent();
        static::assertNotFalse($content);

        $response = json_decode($content, true);
        static::assertArrayHasKey('de-DE', $response);
        static::assertArrayHasKey('en-GB', $response);
    }
}
