document.addEventListener('DOMContentLoaded', () => {

    // 1. Menu Mobile (Hamburger)
    const hamburger = document.getElementById('hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navList.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navList.classList.remove('active');
        });
    });

    // 2. Scroll Reveal Animation (Intersection Observer)
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Para animar apenas 1 vez
            }
        });
    }, {
        threshold: 0.15 // Dispara quando 15% do elemento está visível
    });

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });

    // 3. Modal da Galeria
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.querySelector(".close-modal");
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imgSrc = item.querySelector('img').src;
            modal.style.display = "block";
            modalImg.src = imgSrc;
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Fechar modal clicando fora da imagem
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
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
        dots.forEach(dot => dot.classList.remove("active"));

        slides[slideIndex].classList.add("active");
        dots[slideIndex].classList.add("active");
    }

    function nextSlide() {
        slideIndex++;
        showSlides(slideIndex);
    }

    // Controle manual dos dots
    window.currentSlide = function(index) {
        slideIndex = index;
        showSlides(slideIndex);
        resetInterval(); // Reseta o timer se clicar manualmente
    };

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000); // Muda a cada 5 segundos
    }

    function resetInterval() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Iniciar carrossel
    showSlides(slideIndex);
    startAutoSlide();

    // 5. Slideshow Automático do Hero
    const heroSlides = document.querySelectorAll('.hero-image .slide');
    let currentHeroSlide = 0;

    // Só executa se houver mais de uma imagem
    if (heroSlides.length > 1) {
        setInterval(() => {
            // Remove a classe 'active' da imagem atual (faz ela sumir)
            heroSlides[currentHeroSlide].classList.remove('active');
            
            // Calcula qual é a próxima imagem (volta pro zero se chegar no final)
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            
            // Adiciona a classe 'active' na nova imagem (faz ela aparecer)
            heroSlides[currentHeroSlide].classList.add('active');
            
        }, 4000); // 4000 = Muda a imagem a cada 4 segundos. Pode alterar esse valor!
    }
});