// ============================================
// QA Test Cases Generator - Test Case Utilities
// Shared utilities for test case manipulation
// ============================================

import { DEBUG_MODE } from './constants.js';

/**
 * Parses test cases from Pusher event data
 * Handles various formats from n8n
 * @param {Object|Array} data - Data received from Pusher
 * @returns {Array} Array of test cases in Xray format
 */
export function parseTestCasesFromPusher(data) {
    if (DEBUG_MODE) {
        console.log('📦 Parsing test cases from:', data);
    }

    let rawTestCases = [];

    // Extract test cases based on received structure
    if (Array.isArray(data)) {
        // Format: [{..., payload: [...]}] or directly [testCase, testCase, ...]
        if (data.length > 0 && data[0].payload && Array.isArray(data[0].payload)) {
            // Pusher format with wrapper: [{success, payload: [...]}]
            rawTestCases = data[0].payload;
        } else if (data.length > 0 && data[0].xray_issue_type) {
            // Direct format: array of Xray test cases
            rawTestCases = data;
        }
    } else if (data.payload && Array.isArray(data.payload)) {
        // Object format with payload
        rawTestCases = data.payload;
    } else if (data.testCases && Array.isArray(data.testCases)) {
        // Legacy format
        rawTestCases = data.testCases;
    }

    if (DEBUG_MODE) {
        console.log(`📦 Parsed ${rawTestCases.length} raw test cases`);
    }

    return rawTestCases;
}

/**
 * Transforms raw test cases for UI display
 * Adds frontend-specific properties while preserving Xray format
 * @param {Array} rawTestCases - Array of test cases in Xray format
 * @returns {Array} Array of test cases with UI properties
 */
export function transformTestCasesForUI(rawTestCases) {
    return rawTestCases.map((tc, index) => ({
        // Preserve ENTIRE original Xray structure for injection
        ...tc,
        // Add properties for review interface
        id: `tc-${Date.now()}-${index}`,
        selected: true,
        // Display properties (mapped from Xray format)
        _displayTitle: tc.fields?.summary || 'Test case sans titre',
        _displaySteps: tc.xray_gherkin_def || '',
        _displayType: tc.xray_testtype || 'Cucumber'
    }));
}

/**
 * Cleans test cases for Xray injection
 * Removes frontend-specific properties
 * @param {Array} testCases - Array of test cases with UI properties
 * @returns {Array} Array of clean Xray test cases
 */
export function cleanTestCasesForXray(testCases) {
    return testCases.map(tc => {
        // Create a copy without frontend properties
        const { id, selected, _displayTitle, _displaySteps, _displayType, ...xrayData } = tc;
        return xrayData;
    });
}

/**
 * Generates mock test cases for debug/development
 * @param {number} count - Number of test cases to generate
 * @returns {Array} Array of mock test cases in Xray format
 */
export function generateMockTestCases(count = 3) {
    const mockData = [
        {
            title: 'Vérifier la recherche de chambres disponibles',
            gherkin: `Feature: Recherche de chambres disponibles

Scenario: Recherche avec dates valides
  Given l'utilisateur est sur la page d'accueil
  When il sélectionne une date d'arrivée "2024-03-15"
  And il sélectionne une date de départ "2024-03-18"
  And il clique sur "Rechercher"
  Then une liste de chambres disponibles s'affiche
  And chaque chambre affiche son prix par nuit`,
            type: 'Cucumber'
        },
        {
            title: 'Valider le processus de réservation avec paiement par carte',
            gherkin: `Feature: Processus de réservation

Scenario: Réservation avec carte de crédit
  Given l'utilisateur a sélectionné une chambre "Suite Deluxe"
  And le prix affiché est "250€ par nuit"
  When il remplit le formulaire de réservation
  And il entre les informations de carte bancaire
  And il clique sur "Confirmer la réservation"
  Then un email de confirmation est envoyé
  And le statut de la réservation est "Confirmée"`,
            type: 'Cucumber'
        },
        {
            title: 'Test d\'annulation de réservation dans les délais',
            gherkin: `Feature: Annulation de réservation

Scenario: Annulation gratuite sous 48h
  Given l'utilisateur a une réservation active
  And la date d'arrivée est dans plus de 48 heures
  When il accède à "Mes réservations"
  And il clique sur "Annuler"
  And il confirme l'annulation
  Then la réservation est annulée
  And aucun frais n'est prélevé
  And un email de confirmation d'annulation est envoyé`,
            type: 'Cucumber'
        },
        {
            title: 'Vérifier l\'affichage des équipements de la chambre',
            gherkin: `Feature: Affichage des équipements

Scenario: Liste des équipements visibles
  Given l'utilisateur consulte une fiche chambre
  When la page est complètement chargée
  Then les équipements suivants sont affichés:
    | WiFi gratuit |
    | Climatisation |
    | Mini-bar |
    | Coffre-fort |
  And chaque équipement a une icône associée`,
            type: 'Cucumber'
        },
        {
            title: 'Validation des champs obligatoires du formulaire client',
            gherkin: `Feature: Validation formulaire client

Scenario: Soumission avec champs manquants
  Given l'utilisateur est sur le formulaire de réservation
  When il laisse le champ "Email" vide
  And il clique sur "Continuer"
  Then un message d'erreur s'affiche sous le champ Email
  And le message indique "Ce champ est obligatoire"
  And le formulaire n'est pas soumis`,
            type: 'Cucumber'
        },
        {
            title: 'Test de connexion avec identifiants invalides',
            gherkin: `Feature: Authentification utilisateur

Scenario: Connexion échouée avec mauvais mot de passe
  Given l'utilisateur est sur la page de connexion
  When il entre l'email "test@hotel.com"
  And il entre un mot de passe incorrect
  And il clique sur "Se connecter"
  Then un message d'erreur s'affiche
  And le message indique "Identifiants incorrects"
  And l'utilisateur reste sur la page de connexion`,
            type: 'Cucumber'
        },
        {
            title: 'Vérifier le calcul du prix total avec taxes',
            gherkin: `Feature: Calcul du prix

Scenario: Prix total avec TVA et taxe de séjour
  Given l'utilisateur a sélectionné une chambre à 100€/nuit
  And la durée du séjour est de 3 nuits
  When le récapitulatif de prix s'affiche
  Then le sous-total est "300€"
  And la TVA (10%) est "30€"
  And la taxe de séjour est "6€"
  And le total est "336€"`,
            type: 'Cucumber'
        },
        {
            title: 'Test responsive sur mobile - Menu navigation',
            gherkin: `Feature: Navigation mobile

Scenario: Menu hamburger sur smartphone
  Given l'utilisateur accède au site sur un écran 375px
  When la page est chargée
  Then le menu principal est masqué
  And un bouton hamburger est visible
  When l'utilisateur clique sur le bouton hamburger
  Then le menu s'ouvre en overlay
  And tous les liens de navigation sont accessibles`,
            type: 'Manual'
        },
        {
            title: 'Vérifier la persistance du panier',
            gherkin: `Feature: Persistance panier

Scenario: Panier conservé après rafraîchissement
  Given l'utilisateur a ajouté une chambre au panier
  When il rafraîchit la page
  Then le panier contient toujours la chambre sélectionnée
  And le prix affiché est identique`,
            type: 'Cucumber'
        },
        {
            title: 'Test de performance - Chargement page d\'accueil',
            gherkin: `Feature: Performance

Scenario: Temps de chargement acceptable
  Given le cache du navigateur est vidé
  When l'utilisateur accède à la page d'accueil
  Then la page est interactive en moins de 3 secondes
  And le Largest Contentful Paint est inférieur à 2.5s
  And aucune erreur console n'est présente`,
            type: 'Manual'
        }
    ];

    const testCases = [];
    for (let i = 0; i < count; i++) {
        const mock = mockData[i % mockData.length];
        testCases.push({
            xray_issue_type: 'Test',
            xray_testtype: mock.type,
            xray_gherkin_def: mock.gherkin,
            fields: {
                summary: mock.title,
                project: { key: 'HOTEL' },
                issuetype: { name: 'Test' }
            },
            // UI display properties
            id: `tc-mock-${Date.now()}-${i}`,
            selected: i !== 2, // 3rd one is deselected to test styling
            _displayTitle: mock.title,
            _displaySteps: mock.gherkin,
            _displayType: mock.type
        });
    }
    return testCases;
}
