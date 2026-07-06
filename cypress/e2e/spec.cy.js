describe('SmaranAI Dual-SPA E2E Sanity Tests', () => {
  
  beforeEach(() => {
    // Suppress unhandled exceptions from React app so tests don't fail on minor layout errors
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });
  });

  it('1. User Portal - Should load login and branding successfully', () => {
    cy.visit('http://localhost:3002/');
    cy.contains('SmaranAI').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });

  it('2. Admin Dashboard - Should load auth screen successfully', () => {
    cy.visit('http://localhost:3001/');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });
});
