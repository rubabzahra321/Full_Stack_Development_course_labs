// =============================
// FSD Lab 05 - Complete JavaScript
// Question 1: jQuery
// Question 2: Public API
// Question 3: Express Backend
// =============================

// =============================
// GLOBAL VARIABLES
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
var paymentAnimation, successAnimation, premiumAnimation;
var BACKEND_URL = "http://localhost:3000";

// =============================
// TOAST MESSAGE FUNCTION
// =============================
function message(text) {
    var $box = $("<div>").addClass("toast").text(text);
    $("#toastArea").append($box);
    setTimeout(function () {
        $box.fadeOut(300, function () { $(this).remove(); });
    }, 2500);
}

// =============================
// QUESTION 1: UPDATE PHONE PREVIEW (jQuery)
// =============================
function updatePhone() {
    $("#productPreview").css("background", phoneColor);
    $("#productName").text("iPhone 17 Pro · " + storage);
    $("#productPrice").text("$" + price);
    $("#engravingText").text($("#nameInput").val() || "Your Name");
    applyPremiumEffects();
}

// =============================
// QUESTION 1: PREMIUM EFFECTS (jQuery)
// =============================
function applyPremiumEffects() {
    $("#productPreview").removeClass("effect-glow effect-shimmer effect-aurora");
    $("#engravingText").removeClass("effect-script");

    if ($("#glow").hasClass("active")) {
        $("#productPreview").addClass("effect-glow");
    }
    if ($("#shimmer").hasClass("active")) {
        $("#productPreview").addClass("effect-shimmer");
    }
    if ($("#script").hasClass("active")) {
        $("#engravingText").addClass("effect-script");
    }
    if ($("#aurora").hasClass("active")) {
        $("#productPreview").addClass("effect-aurora");
    }
}

// =============================
// QUESTION 1: CHOOSE COLOR (jQuery)
// =============================
function chooseColor(name, colour, $button) {
    if ($button.hasClass("premium-color") && !premium) {
        message("🔒 This colour needs Premium.");
        openPayment("premium");
        return;
    }

    color = name;
    phoneColor = colour;

    $(".color").removeClass("active");
    $button.addClass("active");
    updatePhone();
}

// =============================
// QUESTION 1: CHOOSE STORAGE (jQuery)
// =============================
function chooseStorage(size, amount, $button) {
    storage = size;
    price = amount;

    $(".storage").removeClass("active");
    $button.addClass("active");
    updatePhone();
}

// =============================
// QUESTION 1: CART FUNCTIONS (jQuery)
// =============================
function addToCart() {
    quantity++;
    showCart();
    message("iPhone added to cart.");
}

function showCart() {
    $("#cartCount").text(quantity);
    $("#cartQty").text(quantity);

    if (quantity === 0) {
        $("#cartItem").text("No item in cart.");
        $("#cartTotal").text("$0");
    } else {
        $("#cartItem").text("iPhone 17 Pro - " + color + " - " + storage);
        $("#cartTotal").text("$" + (price * quantity));
    }
}

// =============================
// QUESTION 1: PREMIUM ACTIVATION (jQuery)
// =============================
function activatePremium() {
    premium = true;
    $("#userStatus").text("Premium User ✨").css("background", "#7b5b18");
    $(".locked").removeClass("locked");

    $("#gold").text("Gold");
    $("#rose").text("Rose");
    $("#glow").text("Glow");
    $("#shimmer").text("Shimmer");
    $("#script").text("Script");
    $("#aurora").text("Aurora");

    $("#premiumUnlocked").show();
    $("#premiumMessage").text("Premium is active! Gold, Rose and all special effects are unlocked.");

    if (premiumAnimation) {
        premiumAnimation.goToAndStop(0, true);
        premiumAnimation.play();
    }

    message("✨ Premium features unlocked.");
}

function checkPremium() {
    if (!premium) {
        message("🔒 This is a Premium feature.");
        openPayment("premium");
        return false;
    }
    return true;
}

// =============================
// QUESTION 1: PAYMENT METHODS (jQuery)
// =============================
function choosePaymentMethod(method, $button) {
    paymentMethod = method;
    $(".payment-method").removeClass("active");
    $button.addClass("active");
    $("#paymentForm").show();
    if (method !== "card") {
        message(method + " selected. Demo payment will use the same form.");
    }
}

// =============================
// QUESTION 1: OPEN PAYMENT MODAL (jQuery)
// =============================
function openPayment(type) {
    paymentType = type;

    if (type === "premium") {
        $("#payTitle").text("Premium Payment");
        $("#planPrice").text("$9.99");
    } else {
        $("#payTitle").text("Order Payment");
        $("#planPrice").text("$" + (price * quantity));
    }

    $("#paymentFormArea").show();
    $("#processing").hide();
    $("#success").hide();
    $("#paymentModal").show();
}

// =============================
// QUESTION 1: PAYMENT VALIDATION (jQuery)
// =============================
function clearErrors() {
    $("#cardNameError, #cardNumberError, #cardExpiryError, #cardCvvError").text("");
}

function checkPayment() {
    clearErrors();
    var good = true;

    var name = $("#cardName").val();
    var number = $("#cardNumber").val();
    var expiry = $("#cardExpiry").val();
    var cvv = $("#cardCvv").val();

    if (name === "") {
        $("#cardNameError").text("Enter your name.");
        good = false;
    }
    if (number.length !== 16 || isNaN(number)) {
        $("#cardNumberError").text("Enter 16 digits.");
        good = false;
    }
    if (expiry.length !== 5 || expiry.charAt(2) !== "/") {
        $("#cardExpiryError").text("Use MM/YY.");
        good = false;
    }
    if (cvv.length < 3 || isNaN(cvv)) {
        $("#cardCvvError").text("Enter 3 or 4 digits.");
        good = false;
    }
    return good;
}

// =============================
// QUESTION 1: FINISH PAYMENT (jQuery)
// =============================
function finishPayment() {
    $("#processing").hide();
    $("#success").show();

    if (successAnimation) {
        successAnimation.goToAndStop(0, true);
        successAnimation.play();
    }

    if (paymentType === "premium") {
        activatePremium();
        $("#successTitle").text("Payment Successful!");
        $("#successText").text("You are now a Premium User.");
    } else {
        $("#successTitle").text("Order Placed!");
        $("#successText").text("Your iPhone order has been placed.");
        quantity = 0;
        showCart();
    }

    $("#paymentForm")[0].reset();
}

// =============================
// QUESTION 1: LOTTIE ANIMATIONS
// =============================
function initLottie() {
    if (typeof lottie !== "undefined") {
        paymentAnimation = lottie.loadAnimation({
            container: document.getElementById("paymentAnimation"),
            renderer: "svg",
            loop: true,
            autoplay: true,
            path: "payment-loading.json"
        });

        successAnimation = lottie.loadAnimation({
            container: document.getElementById("successAnimation"),
            renderer: "svg",
            loop: false,
            autoplay: false,
            path: "payment-success.json"
        });

        premiumAnimation = lottie.loadAnimation({
            container: document.getElementById("premiumAnimation"),
            renderer: "svg",
            loop: false,
            autoplay: false,
            path: "payment-success.json"
        });
    }
}

// =============================
// QUESTION 2: PUBLIC API FUNCTIONS
// =============================
function fetchSingleProduct() {
    $("#apiLoading").show();
    $("#apiError").text("");
    $("#apiResult").html("");

    $.ajax({
        url: "https://fakestoreapi.com/products/1",
        type: "GET",
        dataType: "json",
        success: function (response) {
            $("#apiLoading").hide();

            var html = '<h3 style="color:#43e0a5;">✅ Public API Response (GET)</h3>';
            html += '<div style="display:flex; gap:20px; align-items:flex-start; background:#202a4b; padding:20px; border-radius:12px; flex-wrap:wrap;">';
            html += '<img src="' + response.image + '" alt="product" style="width:120px; height:120px; object-fit:contain; background:white; border-radius:8px; padding:10px;">';
            html += '<div style="flex:1; min-width:200px;">';
            html += '<h3 style="margin:0 0 8px 0; color:#72a7ff;">' + response.title + '</h3>';
            html += '<p style="margin:0 0 8px 0; color:#b9c3dd;">' + response.description.substring(0, 150) + '...</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Price:</strong> $' + response.price + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Category:</strong> ' + response.category + '</p>';
            html += '<p style="margin:0;"><strong>Rating:</strong> ⭐ ' + response.rating.rate + ' (' + response.rating.count + ' reviews)</p>';
            html += '</div></div>';

            $("#apiResult").html(html);
            message("✅ Product fetched from Public API!");
        },
        error: function (xhr, status, error) {
            $("#apiLoading").hide();
            $("#apiError").text("❌ Failed to fetch product: " + error);
            message("❌ Public API request failed.");
        }
    });
}

function fetchMultipleProducts() {
    $("#apiLoading").show();
    $("#apiError").text("");
    $("#apiResult").html("");

    $.ajax({
        url: "https://fakestoreapi.com/products?limit=4",
        type: "GET",
        dataType: "json",
        success: function (response) {
            $("#apiLoading").hide();

            var html = '<h3 style="color:#43e0a5;">✅ Public API Response - Multiple Products (GET)</h3>';
            html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">';

            $.each(response, function (index, product) {
                html += '<div style="background:#202a4b; padding:15px; border-radius:12px; text-align:center;">';
                html += '<img src="' + product.image + '" alt="product" style="width:80px; height:80px; object-fit:contain; background:white; border-radius:8px; padding:8px;">';
                html += '<h4 style="margin:10px 0 5px 0; font-size:14px;">' + product.title.substring(0, 40) + '...</h4>';
                html += '<p style="margin:0; color:#f5c85b; font-weight:bold;">$' + product.price + '</p>';
                html += '<p style="margin:5px 0 0 0; font-size:12px; color:#9fa9c4;">' + product.category + '</p>';
                html += '</div>';
            });

            html += '</div>';
            $("#apiResult").html(html);
            message("✅ " + response.length + " products fetched from Public API!");
        },
        error: function (xhr, status, error) {
            $("#apiLoading").hide();
            $("#apiError").text("❌ Failed to fetch products: " + error);
            message("❌ Public API request failed.");
        }
    });
}

// =============================
// QUESTION 3: BACKEND FUNCTIONS
// =============================
function backendGetProducts() {
    $("#backendLoading").show();
    $("#backendError").text("");
    $("#backendResult").html("");

    $.ajax({
        url: BACKEND_URL + "/api/products",
        type: "GET",
        dataType: "json",
        success: function (response) {
            $("#backendLoading").hide();

            if (!response.success) {
                $("#backendError").text("Backend returned error");
                return;
            }

            var html = '<h3 style="color:#43e0a5;">✅ Backend Response (GET /api/products)</h3>';
            html += '<p style="color:#9fa9c4;">Found ' + response.count + ' products</p>';
            html += '<div style="display:grid; gap:15px;">';

            $.each(response.data, function (i, product) {
                html += '<div style="background:#202a4b; padding:15px; border-radius:12px; border-left:4px solid #72a7ff;">';
                html += '<h4 style="margin:0 0 8px 0; color:#72a7ff;">' + product.name + '</h4>';
                html += '<p style="margin:0 0 5px 0;">' + product.description + '</p>';
                html += '<p style="margin:0 0 5px 0;"><strong>Base Price:</strong> $' + product.basePrice + '</p>';
                html += '<p style="margin:0 0 5px 0;"><strong>Colors:</strong> ' + product.colors.join(", ") + '</p>';
                html += '<p style="margin:0;"><strong>Storage:</strong> ' + product.storageOptions.join(", ") + '</p>';
                html += '</div>';
            });

            html += '</div>';
            $("#backendResult").html(html);
            message("✅ Products fetched from backend!");
        },
        error: function (xhr, status, error) {
            $("#backendLoading").hide();
            $("#backendError").text("❌ Backend not reachable. Make sure server is running on port 3000. Error: " + error);
            message("❌ Backend request failed. Is the server running?");
        }
    });
}

function backendPostConfiguration() {
    $("#backendLoading").show();
    $("#backendError").text("");
    $("#backendResult").html("");

    var effects = [];
    if ($("#glow").hasClass("active")) effects.push("glow");
    if ($("#shimmer").hasClass("active")) effects.push("shimmer");
    if ($("#script").hasClass("active")) effects.push("script");
    if ($("#aurora").hasClass("active")) effects.push("aurora");

    var configData = {
        productName: "iPhone 17 Pro",
        color: color,
        storage: storage,
        engraving: $("#nameInput").val() || "",
        premium: premium,
        effects: effects,
        price: price
    };

    var jsonData = JSON.stringify(configData);
    console.log("POST Data (JSON string):", jsonData);

    $.ajax({
        url: BACKEND_URL + "/api/configure",
        type: "POST",
        contentType: "application/json",
        data: jsonData,
        dataType: "json",
        success: function (response) {
            $("#backendLoading").hide();

            var html = '<h3 style="color:#43e0a5;">✅ Configuration Submitted (POST /api/configure)</h3>';
            html += '<div style="background:#173b38; padding:15px; border-radius:12px; border-left:4px solid #43e0a5;">';
            html += '<p style="margin:0 0 10px 0;"><strong>Server Response:</strong> ' + response.message + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Config ID:</strong> ' + response.data.id + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Product:</strong> ' + response.data.productName + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Color:</strong> ' + response.data.color + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Storage:</strong> ' + response.data.storage + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Engraving:</strong> ' + (response.data.engraving || "None") + '</p>';
            html += '<p style="margin:0 0 5px 0;"><strong>Premium:</strong> ' + response.data.premium + '</p>';
            html += '<p style="margin:0;"><strong>Submitted At:</strong> ' + response.data.submittedAt + '</p>';
            html += '</div>';
            $("#backendResult").html(html);
            message("✅ Configuration sent to backend!");
        },
        error: function (xhr, status, error) {
            $("#backendLoading").hide();
            var errMsg = "❌ POST failed. ";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errMsg += xhr.responseJSON.message;
            } else {
                errMsg += "Make sure server is running on port 3000.";
            }
            $("#backendError").text(errMsg);
            message("❌ Configuration POST failed.");
        }
    });
}

function backendViewConfigs() {
    $("#backendLoading").show();
    $("#backendError").text("");
    $("#backendResult").html("");

    $.ajax({
        url: BACKEND_URL + "/api/configurations",
        type: "GET",
        dataType: "json",
        success: function (response) {
            $("#backendLoading").hide();

            if (response.count === 0) {
                $("#backendResult").html('<p style="color:#9fa9c4;">No configurations saved yet. Click "POST Configuration" first.</p>');
                return;
            }

            var html = '<h3 style="color:#72a7ff;">📋 Saved Configurations (' + response.count + ')</h3>';
            html += '<div style="display:grid; gap:12px;">';

            $.each(response.data, function (i, config) {
                html += '<div style="background:#202a4b; padding:12px; border-radius:8px;">';
                html += '<p style="margin:0 0 5px 0;"><strong>#' + config.id + '</strong> - ' + config.productName + '</p>';
                html += '<p style="margin:0 0 3px 0; font-size:14px;">Color: ' + config.color + ' | Storage: ' + config.storage + '</p>';
                html += '<p style="margin:0 0 3px 0; font-size:14px;">Engraving: ' + (config.engraving || "None") + '</p>';
                html += '<p style="margin:0; font-size:12px; color:#9fa9c4;">' + config.submittedAt + '</p>';
                html += '</div>';
            });

            html += '</div>';
            $("#backendResult").html(html);
            message("✅ Configurations loaded!");
        },
        error: function (xhr, status, error) {
            $("#backendLoading").hide();
            $("#backendError").text("❌ Failed to fetch configurations. Is the server running?");
        }
    });
}

// =============================
// JQUERY DOCUMENT READY
// =============================
$(document).ready(function () {

    // ---- Initialize ----
    updatePhone();
    showCart();
    initLottie();

    // ---- Copy/Cut Prevention ----
    $("#description").on("copy cut", function (event) {
        event.preventDefault();
        message("Copy/Cut is not allowed.");
    });

    // ---- Color Buttons ----
    $("#black").on("click", function () { chooseColor("Black", "#292d35", $(this)); });
    $("#white").on("click", function () { chooseColor("White", "#dddddd", $(this)); });
    $("#blue").on("click", function () { chooseColor("Blue", "#3e638f", $(this)); });
    $("#gold").on("click", function () { chooseColor("Gold", "#c9a646", $(this)); });
    $("#rose").on("click", function () { chooseColor("Rose", "#c9798e", $(this)); });

    // ---- Storage Buttons ----
    $("#storage128").on("click", function () { chooseStorage("128 GB", 799, $(this)); });
    $("#storage256").on("click", function () { chooseStorage("256 GB", 899, $(this)); });
    $("#storage512").on("click", function () { chooseStorage("512 GB", 1099, $(this)); });

    // ---- Engraving Input ----
    $("#nameInput").on("input", function () {
        var text = $(this).val();
        $("#engravingText").text(text || "Your Name");
        $("#charCount").text(text.length + " / " + maxLetters + " characters");
        $("#nameError").text(text.length >= maxLetters ? "Character limit reached." : "");
    });

    // ---- Phone Hover ----
    $("#productPreview").on("mouseover", function () {
        $("#previewMessage").text("You can drag the phone into the cart.");
    }).on("mouseout", function () {
        $("#previewMessage").text("Move your pointer over the phone.");
    });

    // ---- Drag and Drop ----
    $("#productPreview").on("dragstart", function (event) {
        event.originalEvent.dataTransfer.setData("phone", "yes");
    });

    $("#dropZone").on("dragover", function (event) {
        event.preventDefault();
        $(this).addClass("over");
    }).on("dragleave", function () {
        $(this).removeClass("over");
    }).on("drop", function (event) {
        event.preventDefault();
        $(this).removeClass("over");
        if (event.originalEvent.dataTransfer.getData("phone") === "yes") {
            addToCart();
        }
    });

    // ---- Add to Cart ----
    $("#addToCartBtn").on("click", addToCart);

    // ---- Clear Cart ----
    $("#clearCartBtn").on("click", function () {
        quantity = 0;
        showCart();
        message("Cart cleared.");
    });

    // ---- Premium Toggle Buttons ----
    $("#glow").on("click", function () {
        if (checkPremium()) {
            $(this).toggleClass("active");
            applyPremiumEffects();
            message($(this).hasClass("active") ? "Glow enabled." : "Glow disabled.");
        }
    });

    $("#shimmer").on("click", function () {
        if (checkPremium()) {
            $(this).toggleClass("active");
            applyPremiumEffects();
            message($(this).hasClass("active") ? "Shimmer enabled." : "Shimmer disabled.");
        }
    });

    $("#script").on("click", function () {
        if (checkPremium()) {
            $(this).toggleClass("active");
            applyPremiumEffects();
            message($(this).hasClass("active") ? "Script style enabled." : "Script style disabled.");
        }
    });

    $("#aurora").on("click", function () {
        if (checkPremium()) {
            $(this).toggleClass("active");
            applyPremiumEffects();
            message($(this).hasClass("active") ? "Aurora enabled." : "Aurora disabled.");
        }
    });

    // ---- Premium Buttons ----
    $("#openPaymentBtn").on("click", function () { openPayment("premium"); });

    $("#demoResetBtn").on("click", function () {
        premium = false;
        $("#userStatus").text("Free User").css("background", "#34405f");

        ["gold", "rose", "glow", "shimmer", "script", "aurora"].forEach(function (id) {
            $("#" + id).addClass("locked");
        });

        $("#gold").text("🔒 Gold");
        $("#rose").text("🔒 Rose");
        $("#glow").text("🔒 Glow");
        $("#shimmer").text("🔒 Shimmer");
        $("#script").text("🔒 Script");
        $("#aurora").text("🔒 Aurora");

        $("#glow, #shimmer, #script, #aurora").removeClass("active");
        applyPremiumEffects();

        $("#premiumUnlocked").hide();
        message("Returned to Free User.");
    });

    // ---- Payment Methods ----
    $("#cardMethod").on("click", function () { choosePaymentMethod("card", $(this)); });
    $("#paypalMethod").on("click", function () { choosePaymentMethod("PayPal", $(this)); });
    $("#walletMethod").on("click", function () { choosePaymentMethod("Wallet", $(this)); });

    // ---- Payment Modal ----
    $("#closePaymentBtn").on("click", function () {
        $("#paymentModal").hide();
    });

    $("#payNowBtn").on("click", function () {
        if (quantity === 0) {
            message("Your cart is empty.");
            return;
        }
        openPayment("order");
    });

    // ---- Payment Form Submit ----
    $("#paymentForm").on("submit", function (event) {
        event.preventDefault();
        if (!checkPayment()) return;

        $("#paymentFormArea").hide();
        $("#processing").show();
        if (paymentAnimation) paymentAnimation.play();

        setTimeout(finishPayment, 1800);
    });

    // ---- Done Button ----
    $("#doneBtn").on("click", function () {
        $("#paymentModal").hide();
    });

    // ---- Custom Form Submit ----
    $("#customForm").on("submit", function (event) {
        event.preventDefault();
        var name = $("#nameInput").val();

        if (name.length < 2) {
            $("#nameError").text("Enter at least 2 characters.");
            return;
        }

        $("#nameError").text("");
        $("#formMessage").text("Design saved: " + color + ", " + storage + ".");
    });

    // ---- Custom Form Reset ----
    $("#customForm").on("reset", function () {
        setTimeout(function () {
            color = "Black";
            phoneColor = "#292d35";
            storage = "128 GB";
            price = 799;

            $(".color").removeClass("active");
            $("#black").addClass("active");

            $(".storage").removeClass("active");
            $("#storage128").addClass("active");

            $("#charCount").text("0 / 14 characters");
            $("#nameError").text("");
            $("#formMessage").text("");
            updatePhone();
        }, 0);
    });

    // ---- Video Events ----
    $("#adVideo").on("play", function () {
        $("#videoMessage").text("Video is playing.");
    }).on("pause", function () {
        $("#videoMessage").text("Video paused.");
    }).on("ended", function () {
        $("#videoMessage").text("Video finished.");
    });

    // ---- Hero Badge ----
    var badgeColors = ["#292d55", "#7c3aed", "#0f766e", "#be185d"];
    var badgeNumber = 0;

    $("#heroBadge").on("click", function () {
        badgeNumber = (badgeNumber + 1) % badgeColors.length;
        $("#badgeCore").css("background", badgeColors[badgeNumber]);
    });

    // =============================
    // QUESTION 2: PUBLIC API BUTTONS
    // =============================
    $("#fetchProductBtn").on("click", fetchSingleProduct);
    $("#fetchMultipleBtn").on("click", fetchMultipleProducts);

    // =============================
    // QUESTION 3: BACKEND BUTTONS
    // =============================
    $("#backendGetBtn").on("click", backendGetProducts);
    $("#backendPostBtn").on("click", backendPostConfiguration);
    $("#backendConfigsBtn").on("click", backendViewConfigs);
});