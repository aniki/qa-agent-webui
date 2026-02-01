// ==UserScript==
// @name         Jira Xray - Insertion div avant iframe
// @namespace    http://tampermonkey.net/
// @version      8.1
// @description  Insère une div avant l'iframe Xray avec génération de tests QAI et animation métro
// @author       You
// @match        https://*.atlassian.net/*
// @grant        none
// @run-at       document-idle
// @require      https://js.pusher.com/8.4.0/pusher.min.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('🟢 Script actif - Recherche de l\'iframe Xray');

    let pusher = null;
    let channel = null;

    // Fonction pour recharger l'iframe Xray
    function rechargerIframeXray() {
        const iframe = document.querySelector('iframe[id^="com.xpandit.plugins.xray"]');

        if (!iframe) {
            console.log('⚠️ Impossible de recharger : iframe Xray non trouvée');
            return false;
        }

        console.log('🔄 Rechargement de l\'iframe Xray...');

        // Méthode 1 : Recharger le contenu de l'iframe
        try {
            iframe.contentWindow.location.reload();
            console.log('✅ Iframe rechargée (méthode 1)');
            return true;
        } catch (e) {
            console.log('⚠️ Méthode 1 échouée, tentative méthode 2...');
        }

        // Méthode 2 : Recharger en modifiant le src
        try {
            const currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(() => {
                iframe.src = currentSrc;
                console.log('✅ Iframe rechargée (méthode 2)');
            }, 100);
            return true;
        } catch (e) {
            console.error('❌ Impossible de recharger l\'iframe:', e);
            return false;
        }
    }

    // Créer la ligne de métro
    function creerLigneMetro() {
        const ligneMetro = document.createElement('div');
        ligneMetro.id = 'ligne-metro';
        ligneMetro.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 20px 0;
            padding: 20px 0;
            position: relative;
        `;

        const stations = [
            { id: 'requete', label: 'Requête\nenvoyée', emoji: '🚀' },
            { id: 'generated', label: 'Tests\ngénérés', emoji: '🤖' },
            { id: 'inserted', label: 'Tests\ninsérés', emoji: '📝' },
            { id: 'linked', label: 'Tests\nliés', emoji: '🔗' },
            { id: 'reloaded', label: 'Page\nrechargée', emoji: '✨' }
        ];

        // Créer la ligne de fond
        const ligne = document.createElement('div');
        ligne.style.cssText = `
            position: absolute;
            top: 31%;
            left: 5%;
            right: 5%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            z-index: 0;
            border-radius: 2px;
        `;
        ligneMetro.appendChild(ligne);

        // Créer les stations
        stations.forEach((station, index) => {
            const stationDiv = document.createElement('div');
            stationDiv.id = `station-${station.id}`;
            stationDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                z-index: 1;
                flex: 1;
            `;

            const pastille = document.createElement('div');
            pastille.className = 'pastille';
            pastille.style.cssText = `
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                border: 4px solid #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            `;
            pastille.textContent = station.emoji;

            const label = document.createElement('div');
            label.style.cssText = `
                margin-top: 10px;
                font-size: 11px;
                text-align: center;
                color: white;
                font-weight: 500;
                max-width: 80px;
                white-space: pre-line;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            `;
            label.textContent = station.label;

            stationDiv.appendChild(pastille);
            stationDiv.appendChild(label);
            ligneMetro.appendChild(stationDiv);
        });

        // Ajouter le style pour l'animation clignotante
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% {
                    background: #ffc107;
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
                }
                50% {
                    background: #ff9800;
                    transform: scale(1.1);
                    box-shadow: 0 4px 16px rgba(255, 152, 0, 0.6);
                }
            }
            .pastille-active {
                background: #4caf50 !important;
                box-shadow: 0 4px 16px rgba(76, 175, 80, 0.6) !important;
                transform: scale(1.05);
            }
            .pastille-en-cours {
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);

        return ligneMetro;
    }

    // Mettre à jour l'état d'une station
    function mettreAJourStation(stationId, etat) {
        const station = document.querySelector(`#station-${stationId} .pastille`);
        if (!station) return;

        station.classList.remove('pastille-active', 'pastille-en-cours');

        if (etat === 'active') {
            station.classList.add('pastille-active');
        } else if (etat === 'en-cours') {
            station.classList.add('pastille-en-cours');
        }
    }

    // Avancer à la prochaine étape
    function avancerEtape(stationId) {
        // Marquer la station actuelle comme active
        mettreAJourStation(stationId, 'active');

        // Déterminer la prochaine station
        const stations = ['requete', 'generated', 'inserted', 'linked', 'reloaded'];
        const indexActuel = stations.indexOf(stationId);

        if (indexActuel < stations.length - 1) {
            const prochaine = stations[indexActuel + 1];
            setTimeout(() => {
                mettreAJourStation(prochaine, 'en-cours');
            }, 300);
        }
    }

    // Réinitialiser la ligne de métro
    function reinitialiserMetro() {
        const stations = ['requete', 'generated', 'inserted', 'linked', 'reloaded'];
        stations.forEach(id => {
            const station = document.querySelector(`#station-${id} .pastille`);
            if (station) {
                station.classList.remove('pastille-active', 'pastille-en-cours');
                station.style.background = 'rgba(255, 255, 255, 0.3)';
            }
        });
    }

    // Initialiser Pusher
    function initialiserPusher() {
        if (pusher) return; // Déjà initialisé

        Pusher.logToConsole = false;
        pusher = new Pusher('f07b39b2b4b01021840d', {
            cluster: 'eu'
        });
        channel = pusher.subscribe('qa-channel-front');

        // Écouter les 3 événements
        channel.bind('tests-generated', function(data) {
            console.log('📨 Event reçu: tests-generated', data);
            avancerEtape('generated');
        });

        channel.bind('tests-inserted', function(data) {
            console.log('📨 Event reçu: tests-inserted', data);
            avancerEtape('inserted');
        });

        channel.bind('tests-linked', function(data) {
            console.log('📨 Event reçu: tests-linked', data);
            avancerEtape('linked');

            // Recharger l'iframe Xray après avoir reçu tests-linked
            setTimeout(() => {
                const recharge = rechargerIframeXray();
                if (recharge) {
                    avancerEtape('reloaded');
                }
            }, 500);
        });

        console.log('✅ Pusher initialisé et souscrit au channel qa-channel-front');
    }

    // Extraire la clé Jira de l'URL
    function getJiraKey() {
        const urlMatch = window.location.href.match(/\/browse\/([A-Z]+-\d+)/);
        return urlMatch ? urlMatch[1] : 'ROOMFR-22527'; // Valeur par défaut
    }

    // Envoyer le POST
    async function genererTests() {
        const jiraKey = getJiraKey();
        // const url = 'https://n8n.accor-ecom.fr/webhook-test/3e387bf6-3843-4851-8f0d-d3396ff9d159';
        const url = 'https://n8n.accor-ecom.fr/webhook/3e387bf6-3843-4851-8f0d-d3396ff9d159';

        const payload = {
            "jira_key": jiraKey,
            "format": "gherkin",
            "prompt": "",
            "user_agent": "web_ui",
            "channel_id": "qa-channel-front",
            "text": `${jiraKey} gherkin`
        };

        // Afficher la ligne de métro si elle n'existe pas
        const conteneur = document.getElementById('ma-div-avant-xray');
        if (conteneur && !document.getElementById('ligne-metro')) {
            const ligneMetro = creerLigneMetro();
            conteneur.appendChild(ligneMetro);
        }

        // Réinitialiser la ligne de métro
        reinitialiserMetro();

        // Démarrer à la première station
        mettreAJourStation('requete', 'en-cours');

        console.log('🚀 Envoi POST:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Réponse reçue:', result);
                avancerEtape('requete');
            } else {
                console.error('❌ Erreur HTTP:', response.status);
                reinitialiserMetro();
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi:', error);
            reinitialiserMetro();
        }
    }

    function insererDivAvantIframe() {
        const iframe = document.querySelector('iframe[id^="com.xpandit.plugins.xray"]');

        if (!iframe) {
            console.log('⏳ Iframe Xray non trouvée');
            return false;
        }

        // Vérifier si la div a déjà été insérée
        if (document.getElementById('ma-div-avant-xray')) {
            console.log('ℹ️ Div déjà insérée');
            return true;
        }

        console.log('🎯 Iframe Xray trouvée:', iframe);

        // Créer la nouvelle div
        const nouvelleDiv = document.createElement('div');
        nouvelleDiv.id = 'ma-div-avant-xray';
        nouvelleDiv.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 20px 5px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        `;

        // Créer le header avec le bouton
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        `;

        const titre = document.createElement('h3');
        titre.textContent = '🤖 Générateur de Tests QAI';
        titre.style.cssText = `
            margin: 0;
            color: white;
            font-size: 18px;
            font-weight: 600;
        `;

        // Créer le bouton
        const bouton = document.createElement('button');
        bouton.textContent = '▶ Générer les tests';
        bouton.style.cssText = `
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            font-size: 14px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        bouton.onmouseover = () => {
            bouton.style.transform = 'translateY(-2px)';
            bouton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        };
        bouton.onmouseout = () => {
            bouton.style.transform = 'translateY(0)';
            bouton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        };

        header.appendChild(titre);
        header.appendChild(bouton);

        // Gérer le clic
        bouton.onclick = () => {
            console.log('🔘 Bouton cliqué');
            genererTests();
        };

        nouvelleDiv.appendChild(header);

        // Insérer AVANT l'iframe
        iframe.parentNode.insertBefore(nouvelleDiv, iframe);

        // Initialiser Pusher après l'insertion de la div
        initialiserPusher();

        console.log('✅ Div insérée avec succès avant l\'iframe');

        return true;
    }

    // Tentatives immédiates
    insererDivAvantIframe();
    setTimeout(insererDivAvantIframe, 1000);
    setTimeout(insererDivAvantIframe, 2000);
    setTimeout(insererDivAvantIframe, 3000);
    setTimeout(insererDivAvantIframe, 5000);

    // Observer pour détecter l'apparition de l'iframe
    const observer = new MutationObserver(() => {
        insererDivAvantIframe();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();