/**
 * script.js
 * Controla os comportamentos interativos do site de papelaria personalizada.
 *
 * Módulos:
 *  1. initMobileMenu          — Menu hamburger para dispositivos móveis
 *  2. initScrollReveal        — Animação de entrada de elementos ao rolar a página
 *  3. initGalleryModal        — Modal de visualização de imagens da galeria
 *  4. initTestimonialCarousel — Carrossel automático de depoimentos
 *  5. initWhatsAppTracking    — Rastreamento de cliques no WhatsApp via GTM
 *  6. initGallerySwiper       — Carrossel Swiper da galeria (somente mobile < 768px)
 *
 * REMOVIDO: initHeroSlideshow — o hero usa imagem estática, sem elementos .slide.
 */

(() => {

    // ─── Constantes ────────────────────────────────────────────────────────────

    const TESTIMONIAL_INTERVAL_MS = 5000;
    const REVEAL_THRESHOLD        = 0.15;

    const ARIA_LABELS = {
        menuOpen:   'Fechar menu de navegação',
        menuClosed: 'Abrir menu de navegação',
    };

    // ─── Módulos ───────────────────────────────────────────────────────────────

    /**
     * 1. Menu Mobile (Hamburger)
     */
    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navList   = document.querySelector('.nav-list');
        if (!hamburger || !navList) return;

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
     * 2. Scroll Reveal Animation (Intersection Observer)
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
     * 3. Modal da Galeria
     */
    function initGalleryModal() {
        const modal       = document.getElementById('image-modal');
        const modalImg    = document.getElementById('modal-img');
        const closeBtn    = document.getElementById('close-modal-btn');
        const galleryBtns = document.querySelectorAll('.gallery-btn');
        if (!modal || !modalImg || !closeBtn) return;

        let lastFocusedElement = null;

        function openModal(imgSrc, imgAlt) {
            lastFocusedElement = document.activeElement;
            modalImg.src = imgSrc;
            modalImg.alt = imgAlt;
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            closeBtn.focus();
        }

        function closeModal() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            modalImg.src = '';
            modalImg.alt = '';
            document.body.classList.remove('modal-open');
            if (lastFocusedElement) lastFocusedElement.focus();
        }

        galleryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const img = btn.querySelector('img');
                if (img) openModal(img.src, img.alt);
            });
        });

        closeBtn.addEventListener('click', closeModal);

        window.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
        });

        modal.addEventListener('keydown', e => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            closeBtn.focus();
        });
    }

    /**
     * 4. Carrossel de Depoimentos (Automático)
     */
    function initTestimonialCarousel() {
        const slides         = document.querySelectorAll('.testimonial');
        const dots           = document.querySelectorAll('.dot');
        const carouselStatus = document.getElementById('carousel-status');
        if (!slides.length || !dots.length) return;

        let slideIndex      = 0;
        let autoSlideInterval;

        function showSlides(index) {
            if (index >= slides.length) slideIndex = 0;
            if (index < 0)             slideIndex = slides.length - 1;

            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            });

            slides[slideIndex].classList.add('active');
            dots[slideIndex].classList.add('active');
            dots[slideIndex].setAttribute('aria-selected', 'true');

            if (carouselStatus) {
                carouselStatus.textContent = `Depoimento ${slideIndex + 1} de ${slides.length}`;
            }
        }

        function nextSlide() {
            slideIndex++;
            showSlides(slideIndex);
        }

        function goToSlide(index) {
            slideIndex = index;
            showSlides(slideIndex);
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(nextSlide, TESTIMONIAL_INTERVAL_MS);
        }

        // Registra listeners nos dots via JS (os onclick no HTML são redundantes
        // mas mantidos como fallback — veja nota no index.html)
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => goToSlide(i));
        });

        // Fallback para onclick inline ainda presente no HTML
        window.currentSlide = goToSlide;

        showSlides(slideIndex);
        autoSlideInterval = setInterval(nextSlide, TESTIMONIAL_INTERVAL_MS);
    }

    /**
     * 5. Rastreamento de Cliques no WhatsApp via GTM (dataLayer)
     */
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

    /**
     * 6. Swiper da Galeria (Mobile)
     * Inicializa o SwiperJS apenas em telas < 768px.
     * Destrói e recria ao redimensionar (ex: rotação de tela).
     */
    function initGallerySwiper() {
        const swiperEl = document.querySelector('.gallery-swiper');
        if (!swiperEl) return;

        let swiperInstance = null;

        function mountSwiper() {
            if (window.innerWidth < 768 && !swiperInstance) {
                if (typeof Swiper === 'undefined') return;
                swiperInstance = new Swiper('.gallery-swiper', {
                    grabCursor: true,
                    slidesPerView: 1,
                    loop: true,
                    pagination: {
                        el: '.gallery-swiper-pagination',
                        clickable: true,
                    },
                    a11y: {
                        prevSlideMessage: 'Foto anterior',
                        nextSlideMessage: 'Próxima foto',
                    },
                });
            } else if (window.innerWidth >= 768 && swiperInstance) {
                swiperInstance.destroy(true, true);
                swiperInstance = null;
            }
        }

        mountSwiper();
        window.addEventListener('resize', mountSwiper);
    }

    // ─── Ponto de entrada ──────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        initMobileMenu();
        initScrollReveal();
        initGalleryModal();
        initTestimonialCarousel();
        initWhatsAppTracking();
        initGallerySwiper();
    });

})();