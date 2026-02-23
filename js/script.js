document.addEventListener('DOMContentLoaded', () => {

    // 1. Menu Mobile (Hamburger)
    const hamburger = document.getElementById('hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('active');
        navList.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navList.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Abrir menu de navegação');
        });
    });

    // 2. Scroll Reveal Animation (Intersection Observer)
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(reveal => revealOnScroll.observe(reveal));

    // 3. Modal da Galeria
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementById("close-modal-btn");
    const galleryBtns = document.querySelectorAll('.gallery-btn');
    let lastFocusedElement = null;

    function openModal(imgSrc, imgAlt) {
        lastFocusedElement = document.activeElement;
        modalImg.src = imgSrc;
        modalImg.alt = imgAlt;
        modal.style.display = "block";
        modal.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = "none";
        modal.setAttribute('aria-hidden', 'true');
        modalImg.src = '';
        modalImg.alt = '';
        document.body.style.overflow = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    galleryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const img = btn.querySelector('img');
            openModal(img.src, img.alt);
        });
    });

    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });

    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        closeBtn.focus();
    });

    // 4. Carrossel de Depoimentos (Automático)
    let slideIndex = 0;
    let autoSlideInterval;

    function showSlides(index) {
        const slides = document.querySelectorAll(".testimonial");
        const dots = document.querySelectorAll(".dot");

        if (index >= slides.length) slideIndex = 0;
        if (index < 0) slideIndex = slides.length - 1;

        slides.forEach(slide => slide.classList.remove("active"));
        dots.forEach(dot => {
            dot.classList.remove("active");
            dot.setAttribute('aria-selected', 'false');
        });

        slides[slideIndex].classList.add("active");
        dots[slideIndex].classList.add("active");
        dots[slideIndex].setAttribute('aria-selected', 'true');
    }

    function nextSlide() {
        slideIndex++;
        showSlides(slideIndex);
    }

    window.currentSlide = function(index) {
        slideIndex = index;
        showSlides(slideIndex);
        resetInterval();
    };

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    showSlides(slideIndex);
    startAutoSlide();

    // 5. Slideshow Automático do Hero
    // Corrigido: inicialização explícita do aria-hidden em todos os slides,
    // garantindo consistência mesmo quando o carrossel volta ao índice 0.
    const heroSlides = document.querySelectorAll('.hero-image .slide');
    let currentHeroSlide = 0;

    if (heroSlides.length > 1) {

        // Inicializa aria-hidden em todos os slides de forma explícita
        heroSlides.forEach((slide, i) => {
            if (i === 0) {
                slide.removeAttribute('aria-hidden');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }
        });

        setInterval(() => {
            heroSlides[currentHeroSlide].classList.remove('active');
            heroSlides[currentHeroSlide].setAttribute('aria-hidden', 'true');

            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;

            heroSlides[currentHeroSlide].classList.add('active');
            heroSlides[currentHeroSlide].removeAttribute('aria-hidden');
        }, 4000);
    }

    // 6. Rastreamento de cliques no WhatsApp via GTM (dataLayer)
    // Corrigido: GTM estava instalado mas sem eventos configurados.
    // Agora cada clique em botão de WhatsApp dispara um evento no dataLayer,
    // permitindo configurar conversões no Google Analytics e Google Ads.
    window.dataLayer = window.dataLayer || [];

    const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');

    whatsappLinks.forEach(link => {
        link.addEventListener('click', function () {
            const label = this.getAttribute('aria-label') || 'WhatsApp';
            window.dataLayer.push({
                event: 'whatsapp_click',
                event_category: 'Contato',
                event_label: label,
                event_location: this.classList.contains('whatsapp-float') ? 'botao_flutuante' : 'botao_pagina'
            });
        });
    });

});