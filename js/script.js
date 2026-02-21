document.addEventListener('DOMContentLoaded', () => {

    // 1. Menu Mobile (Hamburger)
    // Corrigido: hamburger agora é <button>, então gerenciamos aria-expanded e aria-label corretamente
    const hamburger = document.getElementById('hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.classList.toggle('active');
        navList.classList.toggle('active');

        // Atualiza ARIA para leitores de tela
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });

    // Fechar menu ao clicar em um link
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
    }, {
        threshold: 0.15
    });

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });

    // 3. Modal da Galeria
    // Corrigido: foco gerenciado, trap de foco, aria-hidden, e botão semântico
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementById("close-modal-btn");
    const galleryBtns = document.querySelectorAll('.gallery-btn');

    // Elemento que tinha o foco antes de abrir o modal (para restaurar ao fechar)
    let lastFocusedElement = null;

    function openModal(imgSrc, imgAlt) {
        lastFocusedElement = document.activeElement;
        modalImg.src = imgSrc;
        modalImg.alt = imgAlt;
        modal.style.display = "block";
        modal.setAttribute('aria-hidden', 'false');
        // Move o foco para o botão de fechar ao abrir
        closeBtn.focus();
        // Impede scroll da página por baixo
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = "none";
        modal.setAttribute('aria-hidden', 'true');
        modalImg.src = '';
        modalImg.alt = '';
        document.body.style.overflow = '';
        // Restaura o foco para o elemento que abriu o modal
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    galleryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const img = btn.querySelector('img');
            openModal(img.src, img.alt);
        });
    });

    closeBtn.addEventListener('click', closeModal);

    // Fechar modal clicando fora da imagem
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Fechar modal com tecla Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Trap de foco dentro do modal: Tab e Shift+Tab ficam presos no modal enquanto está aberto
    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        // O único elemento focalizável no modal é o botão de fechar
        // Então prevenimos que o foco saia
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
            // Atualiza aria-selected nos dots (que agora são <button>)
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
    // Corrigido: atualiza aria-hidden nas imagens para que apenas a ativa seja lida
    const heroSlides = document.querySelectorAll('.hero-image .slide');
    let currentHeroSlide = 0;

    if (heroSlides.length > 1) {
        setInterval(() => {
            // Esconde imagem atual e marca como aria-hidden
            heroSlides[currentHeroSlide].classList.remove('active');
            heroSlides[currentHeroSlide].setAttribute('aria-hidden', 'true');

            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;

            // Mostra próxima imagem e remove aria-hidden
            heroSlides[currentHeroSlide].classList.add('active');
            heroSlides[currentHeroSlide].removeAttribute('aria-hidden');

        }, 4000);
    }
});