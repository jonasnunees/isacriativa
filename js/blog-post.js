/**
 * blog-post.js — Scripts compartilhados para todos os posts
 * Isa Criativa | isacriativa.com.br
 *
 * Funcionalidades:
 *  1. Menu mobile (hamburger) — herdado do script.js global,
 *     mas repetido aqui para caso o post seja carregado sem ele.
 *  2. FAQ accordion acessível
 *  3. Rastreamento de cliques no WhatsApp via GTM dataLayer
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Menu Mobile (Hamburger) ─────────────────────────────
    // Garante funcionamento mesmo se script.js global não estiver presente.
    const hamburger = document.getElementById('hamburger');
    const navList   = document.querySelector('.nav-list');
    const navLinks  = document.querySelectorAll('.nav-link');

    if (hamburger && navList) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navList.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            hamburger.setAttribute(
                'aria-label',
                isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'
            );
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navList.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.setAttribute('aria-label', 'Abrir menu de navegação');
            });
        });
    }

    // ── 2. Scroll Reveal ──────────────────────────────────────
    // Ativa as seções com classe .reveal ao entrar na viewport.
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        reveals.forEach(el => revealObserver.observe(el));
    }

    // ── 3. FAQ Accordion ──────────────────────────────────────
    // Cada botão .faq-question abre/fecha sua resposta .faq-answer.
    // Acessível: usa aria-expanded e aria-controls conforme WAI-ARIA.
    const faqBtns = document.querySelectorAll('.faq-question');

    faqBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isOpen   = btn.getAttribute('aria-expanded') === 'true';
            const answerId = btn.getAttribute('aria-controls');
            const answer   = document.getElementById(answerId);

            // Fecha todos os itens abertos
            faqBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
            document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));

            // Se estava fechado, abre o clicado
            if (!isOpen && answer) {
                btn.setAttribute('aria-expanded', 'true');
                answer.classList.add('open');
            }
        });
    });

    // Suporte a teclado: Enter e Espaço já disparam click em <button>,
    // mas garantimos que Escape fecha o item aberto.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        faqBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
        document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    });

    // ── 4. Rastreamento WhatsApp via GTM dataLayer ─────────────
    // Dispara evento 'whatsapp_click' para cada link wa.me clicado.
    // Configure o trigger no GTM usando o evento 'whatsapp_click'.
    window.dataLayer = window.dataLayer || [];

    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', function () {
            const label    = this.getAttribute('aria-label') || 'WhatsApp';
            const isFloat  = this.classList.contains('whatsapp-float');
            const isCTA    = this.closest('#cta-final-post') !== null;
            const isInline = this.closest('.post-cta-inline') !== null;
            const isSidebar= this.closest('.sidebar-cta') !== null;

            let location = 'botao_pagina';
            if (isFloat)   location = 'botao_flutuante';
            else if (isCTA)    location = 'cta_final_post';
            else if (isInline) location = 'cta_inline';
            else if (isSidebar)location = 'sidebar';

            window.dataLayer.push({
                event          : 'whatsapp_click',
                event_category : 'Contato',
                event_label    : label,
                event_location : location,
            });
        });
    });

});
