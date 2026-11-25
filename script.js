const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

function closeNavigation() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isExpanded);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNavigation);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

document.querySelector("#year").textContent = new Date().getFullYear();

const bookingForm = document.querySelector("#booking-form");
const nameInput = bookingForm.elements.name;
const emailInput = bookingForm.elements.email;
const phoneInput = bookingForm.elements.phone;
const messageInput = bookingForm.elements.message;
const bookingStatus = document.querySelector("#booking-status");
const whatsappFallback = document.querySelector("#whatsapp-fallback");
const shareBookingCard = document.querySelector("#share-booking-card");
let generatedBookingCard = null;

function validateBookingContact() {
  const missingContact = !emailInput.value.trim() && !phoneInput.value.trim();
  const error = missingContact ? "Enter an email address or phone number." : "";
  emailInput.setCustomValidity(error);
  phoneInput.setCustomValidity(error);
}

function validateBookingText() {
  nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Enter your name.");
  messageInput.setCustomValidity(messageInput.value.trim() ? "" : "Enter a short message.");
}

emailInput.addEventListener("input", validateBookingContact);
phoneInput.addEventListener("input", validateBookingContact);
nameInput.addEventListener("input", validateBookingText);
messageInput.addEventListener("input", validateBookingText);

function wrapCanvasText(context, text, maxWidth) {
  const lines = [];

  text.split(/\r?\n/).forEach((paragraph) => {
    let line = "";

    paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
      if (context.measureText(word).width > maxWidth) {
        if (line) lines.push(line);
        line = "";

        for (const character of word) {
          if (context.measureText(line + character).width > maxWidth && line) {
            lines.push(line);
            line = character;
          } else {
            line += character;
          }
        }
        return;
      }

      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    lines.push(line);
  });

  return lines;
}

function createBookingCard(details) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const rows = [
    { label: "NAME", value: details.name },
    { label: "CONTACT", value: [details.email, details.phone].filter(Boolean).join(" · ") },
    { label: "MESSAGE", value: details.message },
  ];

  context.font = "30px Arial";
  rows.forEach((row) => {
    row.lines = wrapCanvasText(context, row.value, 1000);
  });

  const lineHeight = 44;
  const height = 400 + rows.reduce((total, row) => total + 60 + row.lines.length * lineHeight, 0);
  canvas.width = 1200;
  canvas.height = height;

  context.fillStyle = "#eee6da";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#c9b39a";
  context.lineWidth = 2;
  context.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  context.fillStyle = "#a87955";
  context.fillRect(80, 78, 5, 85);
  context.fillStyle = "#806b5a";
  context.font = "600 20px Arial";
  context.fillText("GABBY LOUIEE  ·  MOMBASA, KENYA", 108, 104);
  context.fillStyle = "#4a3529";
  context.font = "52px Georgia";
  context.fillText("Booking request", 108, 166);

  let y = 240;
  rows.forEach((row) => {
    context.fillStyle = "#806b5a";
    context.font = "600 18px Arial";
    context.fillText(row.label, 100, y);
    y += 38;
    context.fillStyle = "#4a3529";
    context.font = "30px Arial";
    row.lines.forEach((line) => {
      context.fillText(line, 100, y);
      y += lineHeight;
    });
    y += 22;
  });

  context.fillStyle = "#806b5a";
  context.font = "16px Arial";
  context.fillText(new Date().toLocaleDateString(), 100, canvas.height - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The browser could not create the booking card image."));
      }
    }, "image/png");
  });
}

function downloadBookingCard(file) {
  const imageUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = imageUrl;
  downloadLink.download = file.name;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateBookingContact();
  validateBookingText();

  if (!bookingForm.reportValidity()) return;

  const details = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    message: messageInput.value.trim(),
  };
  const contactLines = [
    details.email && `Email: ${details.email}`,
    details.phone && `Phone: ${details.phone}`,
  ].filter(Boolean);
  const whatsappMessage = [
    "Booking request for Gabby Louiee",
    `Name: ${details.name}`,
    ...contactLines,
    `Message: ${details.message}`,
  ].join("\n");
  const whatsappUrl = `https://wa.me/254789712372?text=${encodeURIComponent(whatsappMessage)}`;
  const submitButton = bookingForm.querySelector('[type="submit"]');

  whatsappFallback.href = whatsappUrl;
  whatsappFallback.hidden = true;
  shareBookingCard.hidden = true;
  generatedBookingCard = null;
  bookingStatus.hidden = true;
  const whatsappWindow = window.open(whatsappUrl, "_blank");
  if (whatsappWindow) whatsappWindow.opener = null;
  submitButton.disabled = true;

  try {
    const bookingImage = await createBookingCard(details);
    const filename = `gabby-louiee-booking-${new Date().toISOString().slice(0, 10)}.png`;
    generatedBookingCard = new File([bookingImage], filename, { type: "image/png" });
    downloadBookingCard(generatedBookingCard);

    const canShareBookingCard =
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [generatedBookingCard] });
    shareBookingCard.hidden = !canShareBookingCard;
    bookingStatus.textContent = canShareBookingCard
      ? "Your booking card has downloaded. WhatsApp is open with your message; you can also share the photo below."
      : whatsappWindow
        ? "Your booking card has downloaded. Attach the PNG in WhatsApp before sending."
        : "Your booking card has downloaded. Open WhatsApp below and attach the PNG before sending.";
    bookingStatus.hidden = false;
    whatsappFallback.hidden = Boolean(whatsappWindow);
  } catch (error) {
    console.error("Could not create the booking card image.", error);
    bookingStatus.textContent = "The booking card could not be created. You can still send your details in WhatsApp.";
    bookingStatus.hidden = false;
    whatsappFallback.hidden = Boolean(whatsappWindow);
  } finally {
    submitButton.disabled = false;
  }
});

shareBookingCard.addEventListener("click", async () => {
  if (!generatedBookingCard) return;

  shareBookingCard.disabled = true;
  try {
    await navigator.share({
      files: [generatedBookingCard],
      title: "Gabby Louiee booking request",
      text: "Booking request for Gabby Louiee.",
    });
    bookingStatus.textContent = "Booking card shared.";
  } catch (error) {
    if (error.name === "AbortError") {
      bookingStatus.textContent = "Sharing cancelled. The downloaded PNG is ready to attach in WhatsApp.";
    } else {
      console.error("Could not share the booking card.", error);
      bookingStatus.textContent = "Photo sharing is unavailable. Attach the downloaded PNG in WhatsApp.";
    }
  } finally {
    bookingStatus.hidden = false;
    shareBookingCard.disabled = false;
  }
});
