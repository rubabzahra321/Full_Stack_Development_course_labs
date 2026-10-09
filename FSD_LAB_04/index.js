// =============================
// 1. GET HTML ELEMENTS
// =============================
function get(id) {
    return document.getElementById(id);
}

var phone = get("productPreview");
var nameInput = get("nameInput");
var dropZone = get("dropZone");
var paymentModal = get("paymentModal");

// =============================
// 2. MAIN VARIABLES
// =============================
var premium = false;
var color = "Black";
var phoneColor = "#292d35";
var storage = "128 GB";
var price = 799;
var quantity = 0;
var paymentType = "premium";
var paymentMethod = "card";
var maxLetters = 14;

// =============================
// 3. MESSAGE
// =============================
function message(text) {
    var box = document.createElement("div");
    box.className = "toast";
    box.textContent = text;
    get("toastArea").appendChild(box);

    setTimeout(function () {
        box.remove();
    }, 2500);
}

// =============================
// 4. STOP COPY AND CUT
// =============================
get("description").addEventListener("copy", function (event) {
    event.preventDefault();
    message("Copy is not allowed.");
});

get("description").addEventListener("cut", function (event) {
    event.preventDefault();
    message("Cut is not allowed.");
});

// =============================
// 5. UPDATE PHONE
// =============================
function updatePhone() {
    phone.style.background = phoneColor;
    get("productName").textContent = "iPhone 17 Pro · " + storage;
    get("productPrice").textContent = "$" + price;
    get("engravingText").textContent = nameInput.value || "Your Name";
    applyPremiumEffects();
}

// =============================
// 5A. PREMIUM PHONE EFFECTS
// =============================
function applyPremiumEffects() {
    // Remove old effects first
    phone.classList.remove("effect-glow");
    phone.classList.remove("effect-shimmer");
    phone.classList.remove("effect-aurora");
    get("engravingText").classList.remove("effect-script");

    // Apply selected effects
    if (get("glow").classList.contains("active")) {
        phone.classList.add("effect-glow");
    }

    if (get("shimmer").classList.contains("active")) {
        phone.classList.add("effect-shimmer");
    }

    if (get("script").classList.contains("active")) {
        get("engravingText").classList.add("effect-script");
    }

    if (get("aurora").classList.contains("active")) {
        phone.classList.add("effect-aurora");
    }
}

// =============================
// 6. COLOURS
// =============================
function chooseColor(name, colour, button) {
    if (button.className.indexOf("premium-color") !== -1 && premium === false) {
        message("🔒 This colour needs Premium.");
        openPayment("premium");
        return;
    }

    color = name;
    phoneColor = colour;

    var buttons = document.getElementsByClassName("color");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    button.classList.add("active");
    updatePhone();
}

get("black").onclick = function () { chooseColor("Black", "#292d35", this); };
get("white").onclick = function () { chooseColor("White", "#dddddd", this); };
get("blue").onclick = function () { chooseColor("Blue", "#3e638f", this); };
get("gold").onclick = function () { chooseColor("Gold", "#c9a646", this); };
get("rose").onclick = function () { chooseColor("Rose", "#c9798e", this); };

// =============================
// 7. STORAGE
// =============================
function chooseStorage(size, amount, button) {
    storage = size;
    price = amount;

    var buttons = document.getElementsByClassName("storage");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    button.classList.add("active");
    updatePhone();
}

get("storage128").onclick = function () { chooseStorage("128 GB", 799, this); };
get("storage256").onclick = function () { chooseStorage("256 GB", 899, this); };
get("storage512").onclick = function () { chooseStorage("512 GB", 1099, this); };

// =============================
// 8. ENGRAVING
// =============================
nameInput.oninput = function () {
    var text = nameInput.value;

    get("engravingText").textContent = text || "Your Name";
    get("charCount").textContent = text.length + " / " + maxLetters + " characters";

    if (text.length >= maxLetters) {
        get("nameError").textContent = "Character limit reached.";
    } else {
        get("nameError").textContent = "";
    }
};

// =============================
// 9. SIMPLE PHONE EFFECT
// =============================
phone.onmouseover = function () {
    get("previewMessage").textContent = "You can drag the phone into the cart.";
};

phone.onmouseout = function () {
    get("previewMessage").textContent = "Move your pointer over the phone.";
};

// =============================
// 10. DRAG AND DROP
// =============================
phone.ondragstart = function (event) {
    event.dataTransfer.setData("phone", "yes");
};

dropZone.ondragover = function (event) {
    event.preventDefault();
    dropZone.classList.add("over");
};

dropZone.ondragleave = function () {
    dropZone.classList.remove("over");
};

dropZone.ondrop = function (event) {
    event.preventDefault();
    dropZone.classList.remove("over");

    if (event.dataTransfer.getData("phone") === "yes") {
        addToCart();
    }
};

get("addToCartBtn").onclick = addToCart;

// =============================
// 11. CART
// =============================
function addToCart() {
    quantity = quantity + 1;
    showCart();
    message("iPhone added to cart.");
}

function showCart() {
    get("cartCount").textContent = quantity;
    get("cartQty").textContent = quantity;

    if (quantity === 0) {
        get("cartItem").textContent = "No item in cart.";
        get("cartTotal").textContent = "$0";
    } else {
        get("cartItem").textContent = "iPhone 17 Pro - " + color + " - " + storage;
        get("cartTotal").textContent = "$" + (price * quantity);
    }
}

get("clearCartBtn").onclick = function () {
    quantity = 0;
    showCart();
    message("Cart cleared.");
};

// =============================
// 12. PREMIUM LOCKS
// =============================
function activatePremium() {
    premium = true;
    get("userStatus").textContent = "Premium User ✨";
    get("userStatus").style.background = "#7b5b18";

    var locked = document.getElementsByClassName("locked");
    for (var i = 0; i < locked.length; i++) {
        locked[i].classList.remove("locked");
    }

    get("gold").textContent = "Gold";
    get("rose").textContent = "Rose";
    get("glow").textContent = "Glow";
    get("shimmer").textContent = "Shimmer";
    get("script").textContent = "Script";
    get("aurora").textContent = "Aurora";

    get("premiumUnlocked").style.display = "block";
    get("premiumMessage").textContent =
        "Premium is active! Gold, Rose and all special effects are unlocked.";

    if (premiumAnimation) {
        premiumAnimation.goToAndStop(0, true);
        premiumAnimation.play();
    }

    message("✨ Premium features unlocked.");
}

function checkPremium() {
    if (premium === false) {
        message("🔒 This is a Premium feature.");
        openPayment("premium");
        return false;
    }
    return true;
}

get("glow").onclick = function () {
    if (checkPremium()) {
        this.classList.toggle("active");
        applyPremiumEffects();
        message(this.classList.contains("active") ? "Glow enabled." : "Glow disabled.");
    }
};

get("shimmer").onclick = function () {
    if (checkPremium()) {
        this.classList.toggle("active");
        applyPremiumEffects();
        message(this.classList.contains("active") ? "Shimmer enabled." : "Shimmer disabled.");
    }
};

get("script").onclick = function () {
    if (checkPremium()) {
        this.classList.toggle("active");
        applyPremiumEffects();
        message(this.classList.contains("active") ? "Script style enabled." : "Script style disabled.");
    }
};

get("aurora").onclick = function () {
    if (checkPremium()) {
        this.classList.toggle("active");
        applyPremiumEffects();
        message(this.classList.contains("active") ? "Aurora enabled." : "Aurora disabled.");
    }
};

get("openPaymentBtn").onclick = function () { openPayment("premium"); };

get("demoResetBtn").onclick = function () {
    premium = false;
    get("userStatus").textContent = "Free User";
    get("userStatus").style.background = "#34405f";

    var locked = ["gold", "rose", "glow", "shimmer", "script", "aurora"];
    for (var i = 0; i < locked.length; i++) {
        get(locked[i]).classList.add("locked");
    }

    get("gold").textContent = "🔒 Gold";
    get("rose").textContent = "🔒 Rose";
    get("glow").textContent = "🔒 Glow";
    get("shimmer").textContent = "🔒 Shimmer";
    get("script").textContent = "🔒 Script";
    get("aurora").textContent = "🔒 Aurora";

    get("glow").classList.remove("active");
    get("shimmer").classList.remove("active");
    get("script").classList.remove("active");
    get("aurora").classList.remove("active");
    applyPremiumEffects();

    get("premiumUnlocked").style.display = "none";
    message("Returned to Free User.");
};

// =============================
// 13. PAYMENT METHOD
// =============================
function choosePaymentMethod(method, button) {
    paymentMethod = method;

    var methods = document.getElementsByClassName("payment-method");
    for (var i = 0; i < methods.length; i++) {
        methods[i].classList.remove("active");
    }

    button.classList.add("active");

    if (method === "card") {
        get("paymentForm").style.display = "block";
    } else {
        get("paymentForm").style.display = "block";
        message(method + " selected. Demo payment will use the same form.");
    }
}

get("cardMethod").onclick = function () { choosePaymentMethod("card", this); };
get("paypalMethod").onclick = function () { choosePaymentMethod("PayPal", this); };
get("walletMethod").onclick = function () { choosePaymentMethod("Wallet", this); };

// =============================
// 14. OPEN PAYMENT
// =============================
function openPayment(type) {
    paymentType = type;

    if (type === "premium") {
        get("payTitle").textContent = "Premium Payment";
        get("planPrice").textContent = "$9.99";
    } else {
        get("payTitle").textContent = "Order Payment";
        get("planPrice").textContent = "$" + (price * quantity);
    }

    get("paymentFormArea").style.display = "block";
    get("processing").style.display = "none";
    get("success").style.display = "none";
    paymentModal.style.display = "block";
}

get("closePaymentBtn").onclick = function () {
    paymentModal.style.display = "none";
};

get("payNowBtn").onclick = function () {
    if (quantity === 0) {
        message("Your cart is empty.");
        return;
    }

    openPayment("order");
};

// =============================
// 15. LOTTIE ANIMATION
// =============================
var paymentAnimation;
var successAnimation;
var premiumAnimation;

if (typeof lottie !== "undefined") {
    paymentAnimation = lottie.loadAnimation({
        container: get("paymentAnimation"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "payment-loading.json"
    });

    successAnimation = lottie.loadAnimation({
        container: get("successAnimation"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "payment-success.json"
    });

    premiumAnimation = lottie.loadAnimation({
        container: get("premiumAnimation"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "payment-success.json"
    });
}

// =============================
// 16. PAYMENT VALIDATION
// =============================
function clearErrors() {
    get("cardNameError").textContent = "";
    get("cardNumberError").textContent = "";
    get("cardExpiryError").textContent = "";
    get("cardCvvError").textContent = "";
}

function checkPayment() {
    clearErrors();

    var good = true;
    var name = get("cardName").value;
    var number = get("cardNumber").value;
    var expiry = get("cardExpiry").value;
    var cvv = get("cardCvv").value;

    if (name === "") {
        get("cardNameError").textContent = "Enter your name.";
        good = false;
    }

    if (number.length !== 16 || isNaN(number)) {
        get("cardNumberError").textContent = "Enter 16 digits.";
        good = false;
    }

    if (expiry.length !== 5 || expiry.charAt(2) !== "/") {
        get("cardExpiryError").textContent = "Use MM/YY.";
        good = false;
    }

    if (cvv.length < 3 || isNaN(cvv)) {
        get("cardCvvError").textContent = "Enter 3 or 4 digits.";
        good = false;
    }

    return good;
}

get("paymentForm").onsubmit = function (event) {
    event.preventDefault();

    if (checkPayment() === false) return;

    get("paymentFormArea").style.display = "none";
    get("processing").style.display = "block";

    if (paymentAnimation) paymentAnimation.play();

    setTimeout(function () {
        finishPayment();
    }, 1800);
};

// =============================
// 17. PAYMENT FINISHED
// =============================
function finishPayment() {
    get("processing").style.display = "none";
    get("success").style.display = "block";

    if (successAnimation) {
        successAnimation.goToAndStop(0, true);
        successAnimation.play();
    }

    if (paymentType === "premium") {
        activatePremium();
        get("successTitle").textContent = "Payment Successful!";
        get("successText").textContent = "You are now a Premium User.";
    } else {
        get("successTitle").textContent = "Order Placed!";
        get("successText").textContent = "Your iPhone order has been placed.";
        quantity = 0;
        showCart();
    }

    get("paymentForm").reset();
}

get("doneBtn").onclick = function () {
    paymentModal.style.display = "none";
};

// =============================
// 18. SAVE DESIGN
// =============================
get("customForm").onsubmit = function (event) {
    event.preventDefault();

    var name = nameInput.value;

    if (name.length < 2) {
        get("nameError").textContent = "Enter at least 2 characters.";
        return;
    }

    get("nameError").textContent = "";
    get("formMessage").textContent = "Design saved: " + color + ", " + storage + ".";
};

// =============================
// 19. RESET
// =============================
get("customForm").onreset = function () {
    setTimeout(function () {
        color = "Black";
        phoneColor = "#292d35";
        storage = "128 GB";
        price = 799;

        var colors = document.getElementsByClassName("color");
        for (var i = 0; i < colors.length; i++) colors[i].classList.remove("active");
        get("black").classList.add("active");

        var storages = document.getElementsByClassName("storage");
        for (var j = 0; j < storages.length; j++) storages[j].classList.remove("active");
        get("storage128").classList.add("active");

        get("charCount").textContent = "0 / 14 characters";
        get("nameError").textContent = "";
        get("formMessage").textContent = "";

        updatePhone();
    }, 0);
};

// =============================
// 20. VIDEO
// =============================
get("adVideo").onplay = function () { get("videoMessage").textContent = "Video is playing."; };
get("adVideo").onpause = function () { get("videoMessage").textContent = "Video paused."; };
get("adVideo").onended = function () { get("videoMessage").textContent = "Video finished."; };

// =============================
// 21. CLICKABLE BADGE
// =============================
var badgeColors = ["#292d55", "#7c3aed", "#0f766e", "#be185d"];
var badgeNumber = 0;

get("heroBadge").onclick = function () {
    badgeNumber = badgeNumber + 1;
    if (badgeNumber === badgeColors.length) badgeNumber = 0;
    get("badgeCore").style.background = badgeColors[badgeNumber];
};

// Start the page
updatePhone();
showCart();
