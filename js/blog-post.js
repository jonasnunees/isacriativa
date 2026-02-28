/**
 * blog-post.js
 * Scripts exclusivos para as páginas individuais de posts do blog.
 * Isa Criativa | isacriativa.com.br
 *
 * Módulos:
 *  1. initPostMenu         — Menu mobile (fallback caso script.js global não carregue)
 *  2. initScrollReveal     — Animação de entrada de elementos ao rolar a página
 *  3. initFaqAccordion     — FAQ accordion acessível com suporte a teclado
 *  4. initWhatsAppTracking — Rastreamento granular de cliques via GTM dataLayer
 *
 * Depende de: script.js (carregado antes no HTML)
 */

// IIFE isola todas as constantes e funções do escopo global, evitando conflitos
// com script.js e blog.js que são carregados juntos na mesma página.
(() => {

    // ─── Constantes ────────────────────────────────────────────────────────────

    const ARIA_LABELS = {
        menuOpen:   'Fechar menu de navegação',
        menuClosed: 'Abrir menu de navegação',
    };

    // Valor levemente menor que o do script.js (0.15) para compensar que seções
    // de post tendem a ser mais longas e entram na viewport mais devagar.
    const REVEAL_THRESHOLD = 0.12;

    // ─── Módulos ───────────────────────────────────────────────────────────────

    /**
     * 1. Menu Mobile (Hamburger) — fallback local
     *
     * Duplicado intencionalmente do script.js global para garantir funcionamento
     * nos casos em que o post é acessado diretamente sem o script global carregado.
     *
     * Quando ambos os scripts estão presentes (caso normal), o script.js registra
     * o listener primeiro. O blog-post.js verifica se o hamburger já está funcional
     * checando se o listener já adicionou a lógica — feito de forma segura pelo
     * guard clause, sem flags globais que poluiriam o escopo compartilhado.
     *
     * Como os dois scripts usam a mesma lógica idempotente (toggle de classes),
     * o duplo registro não causa comportamento errado — apenas um clique extra
     * desnecessário. Para evitar isso, o blog-post.js só registra se o script.js
     * não estiver presente (verificado pela ausência do atributo aria-expanded
     * já configurado pelo initMobileMenu do script.js).
     */
    function initPostMenu() {
        const hamburger = document.getElementById('hamburger');
        const navList   = document.querySelector('.nav-list');

        if (!hamburger || !navList) return;

        // Se o script.js já inicializou o menu, ele terá definido aria-expanded.
        // Nesse caso, não registramos um segundo listener para evitar disparo duplo.
        if (hamburger.hasAttribute('aria-expanded')) return;

        const navLinks = document.querySelectorAll('.nav-link');

        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navList.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? ARIA_LABELS.menuOpen : ARIA_LABELS.menuClosed);
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navList.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.setAttribute('aria-label', ARIA_LABELS.menuClosed);
            });
        });
    }

    /**
     * 2. Scroll Reveal
     *
     * Ativa elementos com classe .reveal ao entrar na viewport.
     * Usa IntersectionObserver para evitar cálculos de layout contínuos (reflow),
     * o que melhora a performance em posts longos com muitos elementos animados.
     */
    function initScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: REVEAL_THRESHOLD });

        reveals.forEach(el => observer.observe(el));
    }

    /**
     * 3. FAQ Accordion
     *
     * Abre/fecha respostas de FAQ com comportamento de acordeão (um aberto por vez).
     *
     * Acessibilidade implementada:
     * - aria-expanded no botão informa leitores de tela sobre o estado aberto/fechado
     * - aria-controls vincula cada botão à sua resposta correspondente
     * - Escape fecha o item aberto sem precisar clicar novamente
     * - Enter e Espaço funcionam nativamente em <button>, sem código extra
     */
    function initFaqAccordion() {
        const faqBtns = document.querySelectorAll('.faq-question');
        if (!faqBtns.length) return;

        function closeAll() {
            faqBtns.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
            document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
        }

        faqBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isOpen   = btn.getAttribute('aria-expanded') === 'true';
                const answerId = btn.getAttribute('aria-controls');
                const answer   = document.getElementById(answerId);

                // Fecha todos antes de abrir o clicado,
                // garantindo que apenas um item fique aberto por vez
                closeAll();

                if (!isOpen && answer) {
                    btn.setAttribute('aria-expanded', 'true');
                    answer.classList.add('open');
                }
            });
        });

        // Escape fecha o item aberto — comportamento esperado conforme
        // padrão WAI-ARIA Disclosure (Accordion) Pattern
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeAll();
        });
    }

    /**
     * 4. Rastreamento de Cliques no WhatsApp via GTM
     *
     * Mais granular que o rastreamento global do script.js: identifica
     * a origem exata do clique (botão flutuante, CTA final, CTA inline ou sidebar),
     * permitindo analisar quais pontos do post convertem melhor.
     */
    function initWhatsAppTracking() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        if (!whatsappLinks.length) return;

        window.dataLayer = window.dataLayer || [];

        whatsappLinks.forEach(link => {
            link.addEventListener('click', function () {
                const label = this.getAttribute('aria-label') || 'WhatsApp';

                // Determina a localização do clique pela hierarquia do DOM,
                // priorizando do mais específico para o mais genérico
                let location = 'botao_pagina';
                if (this.classList.contains('whatsapp-float')) location = 'botao_flutuante';
                else if (this.closest('#cta-final-post'))      location = 'cta_final_post';
                else if (this.closest('.post-cta-inline'))     location = 'cta_inline';
                else if (this.closest('.sidebar-cta'))         location = 'sidebar';

                window.dataLayer.push({
                    event:          'whatsapp_click',
                    event_category: 'Contato',
                    event_label:    label,
                    event_location: location,
                });
            });
        });
    }

    // ─── Inicialização ─────────────────────────────────────────────────────────

    /**
     * Ponto de entrada único da página de post.
     * A ordem segue a hierarquia visual da página (topo → base).
     */
    document.addEventListener('DOMContentLoaded', () => {
        initPostMenu();
        initScrollReveal();
        initFaqAccordion();
        initWhatsAppTracking();
    });

})();