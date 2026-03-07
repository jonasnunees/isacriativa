/**
 * post-ainda-nao-publicado.js
 * Script mínimo para a página de artigo em breve.
 *
 * Módulo único:
 *  - initWhatsAppTracking — Rastreamento de cliques no botão flutuante do WhatsApp via GTM
 */
(() => {
    function initWhatsAppTracking() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        if (!whatsappLinks.length) return;

        window.dataLayer = window.dataLayer || [];

        whatsappLinks.forEach(link => {
            link.addEventListener('click', function () {
                const label    = this.getAttribute('aria-label') || 'WhatsApp';
                const location = this.classList.contains('whatsapp-float')
                    ? 'botao_flutuante'
                    : 'botao_pagina';

                window.dataLayer.push({
                    event:          'whatsapp_click',
                    event_category: 'Contato',
                    event_label:    label,
                    event_location: location,
                });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initWhatsAppTracking();
    });
})();