/**
 * script.js
 * Controla os comportamentos interativos do site de papelaria personalizada.
 *
 * Módulos:
 *  1. initMobileMenu        — Menu hamburger para dispositivos móveis
 *  2. initScrollReveal      — Animação de entrada de elementos ao rolar a página
 *  3. initGalleryModal      — Modal de visualização de imagens da galeria
 *  4. initTestimonialCarousel — Carrossel automático de depoimentos
 *  5. initHeroSlideshow     — Slideshow automático da seção hero
 *  6. initWhatsAppTracking  — Rastreamento de cliques no WhatsApp via GTM
 */

// IIFE (Immediately Invoked Function Expression) isola todas as constantes e
// funções deste arquivo do escopo global, evitando conflitos com outros scripts
// carregados na mesma página (blog-post.js, blog.js, etc.).
(() => {

    // ─── Constantes ────────────────────────────────────────────────────────────

    // Intervalos de tempo dos slideshows (em milissegundos)
    const TESTIMONIAL_INTERVAL_MS = 5000;
    const HERO_INTERVAL_MS        = 4000;

    // Percentual de visibilidade do elemento para disparar a animação de reveal
    const REVEAL_THRESHOLD = 0.15;

    // Labels de acessibilidade centralizados para evitar desincronização
    const ARIA_LABELS = {
        menuOpen:   'Fechar menu de navegação',
        menuClosed: 'Abrir menu de navegação',
    };

    // ─── Módulos ───────────────────────────────────────────────────────────────

    /**
     * 1. Menu Mobile (Hamburger)
     * Alterna a visibilidade do menu de navegação em dispositivos móveis.
     * Fecha automaticamente ao clicar em qualquer link interno.
     */
    function initMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navList   = document.querySelector('.nav-list');

        // Guard: sai sem erros se os elementos não existirem na página atual
        if (!hamburger || !navList) return;

        const navLinks = document.querySelectorAll('.nav-link');

        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navList.classList.toggle('active');

            // Atualiza os atributos ARIA usando as constantes centralizadas
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? ARIA_LABELS.menuOpen : ARIA_LABELS.menuClosed);
        });

        // Fecha o menu ao navegar para uma âncora interna (UX em single-page)
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
     * Adiciona a classe 'active' em elementos com a classe 'reveal'
     * quando eles entram na área visível da viewport.
     *
     * Usamos IntersectionObserver em vez de listeners de scroll para evitar
     * cálculos de layout contínuos (reflow), o que melhora a performance.
     */
    function initScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Deixa de observar após a animação para economizar recursos
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: REVEAL_THRESHOLD });

        reveals.forEach(el => observer.observe(el));
    }

    /**
     * 3. Modal da Galeria
     * Abre uma imagem em tamanho ampliado dentro de um overlay.
     *
     * Boas práticas de acessibilidade implementadas:
     * - Foco é movido para o botão de fechar ao abrir o modal
     * - Foco é restaurado ao elemento de origem ao fechar
     * - Scroll do body é bloqueado via classe CSS (mais previsível que style inline)
     * - Fechar via tecla Escape e clique fora do modal
     * - Tab fica preso dentro do modal enquanto ele está aberto
     */
    function initGalleryModal() {
        const modal       = document.getElementById('image-modal');
        const modalImg    = document.getElementById('modal-img');
        const closeBtn    = document.getElementById('close-modal-btn');
        const galleryBtns = document.querySelectorAll('.gallery-btn');

        // Guard: sai sem erros em páginas que não têm galeria
        if (!modal || !modalImg || !closeBtn) return;

        // Guarda o elemento que abriu o modal para restaurar o foco ao fechar,
        // garantindo a navegação contínua para usuários de teclado e leitores de tela.
        let lastFocusedElement = null;

        function openModal(imgSrc, imgAlt) {
            lastFocusedElement = document.activeElement;
            modalImg.src = imgSrc;
            modalImg.alt = imgAlt;
            modal.style.display = 'block';
            modal.setAttribute('aria-hidden', 'false');
            // Usando classe CSS ao invés de style inline para evitar conflito
            // com outros componentes que também possam manipular o overflow do body
            document.body.classList.add('modal-open');
            closeBtn.focus();
        }

        function closeModal() {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            // Limpa o src para interromper qualquer carregamento em progresso
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

        // Fecha ao clicar no overlay (fora do conteúdo do modal)
        window.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // Fecha com Escape — comportamento esperado pelo usuário em qualquer modal
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
        });

        // Mantém o foco preso dentro do modal (focus trap) enquanto ele está aberto,
        // impedindo que o usuário de teclado "escape" para o conteúdo por trás
        modal.addEventListener('keydown', e => {
            if (e.key !== 'Tab') return;
            e.preventDefault();
            closeBtn.focus();
        });
    }

    /**
     * 4. Carrossel de Depoimentos (Automático)
     * Alterna entre depoimentos automaticamente e permite navegação manual pelos dots.
     *
     * Os dots são ativados via event listeners no JS (sem onclick no HTML),
     * mantendo a separação de responsabilidades entre HTML e JS.
     *
     * Uma live region informa leitores de tela sobre a mudança de slide,
     * tornando o carrossel acessível para usuários com deficiência visual.
     */
    function initTestimonialCarousel() {
        const slides         = document.querySelectorAll('.testimonial');
        const dots           = document.querySelectorAll('.dot');
        const carouselStatus = document.getElementById('carousel-status');

        // Guard: sai sem erros em páginas sem carrossel de depoimentos
        if (!slides.length || !dots.length) return;

        let slideIndex      = 0;
        let autoSlideInterval;

        function showSlides(index) {
            // Normaliza o índice para criar loop circular
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

            // Notifica leitores de tela sobre a troca de slide via live region
            // O elemento #carousel-status deve ter aria-live="polite" no HTML
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
            resetInterval();
        }

        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, TESTIMONIAL_INTERVAL_MS);
        }

        function resetInterval() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }

        // Registra os listeners nos dots via JS, eliminando a necessidade de
        // atributos onclick="currentSlide(N)" diretamente no HTML
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => goToSlide(i));
        });

        // Expõe goToSlide globalmente apenas como fallback para HTMLs
        // que ainda usem onclick inline — remover após atualizar o HTML
        window.currentSlide = goToSlide;

        showSlides(slideIndex);
        startAutoSlide();
    }

    /**
     * 5. Slideshow Automático do Hero
     * Alterna entre imagens de fundo da seção hero em loop contínuo.
     *
     * aria-hidden é gerenciado explicitamente em todos os slides para garantir
     * que leitores de tela não anunciem conteúdo de slides inativos.
     * Não inicia o intervalo se houver apenas um slide (otimização).
     */
    function initHeroSlideshow() {
        const heroSlides = document.querySelectorAll('.hero-image .slide');

        // Guard: sem slides ou com apenas um, não há nada a animar
        if (heroSlides.length <= 1) return;

        let currentHeroSlide = 0;

        // Inicializa o estado ARIA de todos os slides de forma explícita,
        // evitando inconsistências ao reiniciar o loop no índice 0
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
        }, HERO_INTERVAL_MS);
    }

    /**
     * 6. Rastreamento de Cliques no WhatsApp via GTM (dataLayer)
     * Dispara um evento customizado no dataLayer a cada clique em link de WhatsApp,
     * permitindo configurar metas de conversão no Google Analytics e Google Ads
     * sem alterar o código de rastreamento base do GTM.
     *
     * O event_location diferencia cliques no botão flutuante dos demais botões,
     * possibilitando análise granular do comportamento do usuário.
     */
    function initWhatsAppTracking() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        if (!whatsappLinks.length) return;

        // Garante que o dataLayer exista mesmo se o GTM ainda não carregou
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
     * 7. Swiper da Galeria (Mobile)
     * Inicializa o carrossel SwiperJS na seção de galeria apenas em telas
     * com largura menor que 768px. Exibe 3 slides visíveis por vez com o
     * slide central em destaque (efeito coverflow).
     *
     * A instância é destruída/recriada ao redimensionar a janela para garantir
     * que o componente só rode no mobile, sem interferir no layout desktop.
     */
    function initGallerySwiper() {
        const swiperEl = document.querySelector('.gallery-swiper');
        if (!swiperEl) return;

        let swiperInstance = null;

        function mountSwiper() {
            if (window.innerWidth < 768 && !swiperInstance) {
                swiperInstance = new Swiper('.gallery-swiper', {
                    effect: 'coverflow',
                    grabCursor: true,
                    centeredSlides: true,
                    slidesPerView: 1.6,   // mostra ~3 slides: 1 central + bordas dos adjacentes
                    loop: true,
                    coverflowEffect: {
                        rotate: 0,
                        stretch: 0,
                        depth: 120,
                        modifier: 1.5,
                        slideShadows: false,
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

        // Reavalia ao redimensionar (ex: rotação de tela)
        window.addEventListener('resize', mountSwiper);
    }



    /**
     * Ponto de entrada único da aplicação.
     * A ordem de inicialização segue a hierarquia visual da página (topo → base).
     */
    document.addEventListener('DOMContentLoaded', () => {
        initMobileMenu();
        initScrollReveal();
        initGalleryModal();
        initTestimonialCarousel();
        initHeroSlideshow();
        initWhatsAppTracking();
        initGallerySwiper();
    });

})();