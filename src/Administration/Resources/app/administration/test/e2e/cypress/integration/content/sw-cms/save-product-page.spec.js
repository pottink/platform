/// <reference types="Cypress" />

import MediaPageObject from '../../../support/pages/module/sw-media.page-object';

describe('CMS: check validation of product detail page', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                return cy.createCmsFixture();
            })
            .then(() => {
                cy.viewport(1920, 1080);
                cy.openInitialPage(`${Cypress.env('admin')}#/sw/cms/index`);
            });
    });

    it('@content: create product detail page', () => {
        cy.onlyOnFeature('FEATURE_NEXT_10078');

        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/cms-page`,
            method: 'post'
        }).as('saveData');

        // Fill in basic data
        cy.contains('Create new layout').click();
        cy.get('.sw-cms-detail').should('be.visible');
        cy.contains('.sw-cms-create-wizard__page-type', 'Product page').click();
        cy.get('.sw-cms-create-wizard__title').contains('Choose a section type to start with.');
        cy.contains('.sw-cms-stage-section-selection__default', 'Full width').click();
        cy.get('.sw-cms-create-wizard__title').contains('How do you want to label your new layout?');
        cy.contains('.sw-button--primary', 'Create layout').should('not.be.enabled');
        cy.get('#sw-field--page-name').typeAndCheck('PDP Layout');
        cy.contains('.sw-button--primary', 'Create layout').should('be.enabled');
        cy.contains('.sw-button--primary', 'Create layout').click();
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-cms-section__empty-stage').should('not.be.visible');
        cy.get('.sw-cms-block-product-heading').should('be.visible');

        cy.get('.sw-cms-detail__save-action').click();

        // Shows layout assignment modal the first time saving after the wizard
        cy.get('.sw-cms-layout-assignment-modal').should('be.visible');
        cy.get('.sw-cms-product-assignment-select').should('be.visible');

        // Confirm without layout
        cy.get('.sw-cms-layout-assignment-modal__action-confirm').click();
        cy.get('.sw-cms-layout-assignment-modal').should('not.be.visible');
        cy.get('.sw-cms-detail__save-action').click();
    });
});
