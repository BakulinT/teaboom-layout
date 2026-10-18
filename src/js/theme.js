console.log("[theme.js] Start");

document.addEventListener("DOMContentLoaded", function() {
    const modalMessage = document.querySelector(".modal-message");
    const popupImage = document.getElementById("popup-gallery");

    // Модалка под уведолмения
    function showModal(message) {
        if (!modalMessage) return;

        var toastTimer;

        modalMessage.textContent = message;

        if (toastTimer) clearTimeout(toastTimer);
        if (!modalMessage.classList.contains("is-visible")) {
            modalMessage.classList.add("is-visible");
        }

        toastTimer = setTimeout(
            () => modalMessage.classList.remove("is-visible"), 
            2800
        );
    }

    // Управление попапом
    function showPopap() {
        popupImage.classList.add("popup_show");
        document.body.classList.add("lock");
    }

    function hindePopap() {
        popupImage.classList.remove("popup_show");
        document.body.classList.remove("lock");
    }

    // Добавление в корзину
    function onAddInCart(btn) {
        if (!btn) return;
        if (btn.classList.contains("is-active")) {
            showModal("Уже в корзине");
            return;
        }

        const span = btn.querySelector("span");
        btn.classList.add("is-active");
        if (span) span.innerText = "В корзине";

        showModal(`${btn.dataset.cartAdd ?? ""} «Ананасового улуна» добавлено в корзину`);
    }

    // Добавление в вишлист
    function onFavorite(e) {
        const btn = e.currentTarget;

        if (!btn) return;

        const itemInFavorites = btn.classList.contains("is-active");
        const span = btn.querySelector("span");
        if (span) {
            span.innerText = itemInFavorites ? "В избранное" : "Добавлено";
            showModal(itemInFavorites ? "Товар удален из вишлиста": "Товар добавлен в вишлист");

        }
        btn.classList.toggle("is-active");
    }


    // Заглушки для кнопок
    document.querySelectorAll("[data-cart-add]").forEach((btn) => {
        btn.addEventListener("click", onAddInCart.bind(this, btn));
    });

    // Открытие попапа
    document.querySelectorAll("[data-popup-open]").forEach((btn) => {
        btn.addEventListener("click", showPopap);
    });

    // Закрытие попапа
    document.querySelectorAll("[data-popup-close]").forEach((btn) => {
        btn.addEventListener("click", hindePopap);
    });

    document.querySelector("[data-favorites-trigger]")?.addEventListener("click", onFavorite);
});