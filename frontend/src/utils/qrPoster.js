import QRCodeLib from "qrcode";

/**
 * Generates a Data URL for a given text using qrcode library
 */
export const generateQrDataUrl = async (text, options = {}) => {
  try {
    return await QRCodeLib.toDataURL(text, {
      width: options.width || 400,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || "#0f172a",
        light: options.lightColor || "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  } catch (err) {
    console.error("Failed to generate QR data URL:", err);
    return null;
  }
};

/**
 * Generates and downloads a high-resolution, beautifully branded A4-style poster PNG.
 */
export const downloadQrPoster = async ({
  type = "ADMISSION", // "ADMISSION" | "ATTENDANCE"
  libraryName = "Library",
  libraryCode = "",
  libraryAddress = "",
  libraryPhone = "",
  qrUrl = "",
  fileName = "qr-poster.png",
}) => {
  try {
    const isAdmission = type === "ADMISSION";
    const primaryColor = isAdmission ? "#2563eb" : "#059669";
    const secondaryColor = isAdmission ? "#1d4ed8" : "#047857";
    const badgeText = isAdmission ? "STUDENT ONLINE ADMISSION" : "DAILY ATTENDANCE SCANNER";
    const instructionText = isAdmission
      ? "Scan to fill your student admission registration form"
      : "Scan to instantly check in or check out of the library";

    // High resolution canvas (1200 x 1600)
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");

    // 1. Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, 1200, 1600);

    // 2. Top Header Gradient
    const headerGrad = ctx.createLinearGradient(0, 0, 1200, 340);
    headerGrad.addColorStop(0, primaryColor);
    headerGrad.addColorStop(1, secondaryColor);
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, 1200, 340);

    // Header badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(400, 40, 400, 48, 24);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Segoe UI', Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText(badgeText, 600, 72);

    // Library Name
    ctx.font = "900 52px 'Segoe UI', Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(libraryName || "Library Management", 600, 160);

    // Library Code & Subtitle
    ctx.font = "500 24px 'Segoe UI', Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const codeStr = libraryCode ? `Branch Code: ${libraryCode}` : "";
    ctx.fillText(codeStr, 600, 205);

    ctx.font = "600 26px 'Segoe UI', Inter, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(instructionText, 600, 260);

    // 3. Central White Card for QR
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(200, 390, 800, 880, 36);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inner QR container border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(260, 450, 680, 680, 24);
    ctx.stroke();

    // Render QR Code onto canvas
    const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, {
      width: 620,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });

    const qrImg = new Image();
    await new Promise((resolve, reject) => {
      qrImg.onload = resolve;
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });

    ctx.drawImage(qrImg, 290, 480, 620, 620);

    // Instructions below QR code inside card
    ctx.font = "800 28px 'Segoe UI', Inter, sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.textAlign = "center";
    ctx.fillText("SCAN WITH ANY PHONE CAMERA", 600, 1190);

    ctx.font = "500 20px 'Segoe UI', Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Open Camera app, Google Lens, or any QR scanner", 600, 1230);

    // 4. Steps Section
    const stepsY = 1320;
    const steps = isAdmission
      ? [
          { num: "1", title: "Scan Code", desc: "Scan with your phone" },
          { num: "2", title: "Fill Form", desc: "Enter your details" },
          { num: "3", title: "Visit Desk", desc: "Collect seat & ID card" },
        ]
      : [
          { num: "1", title: "Scan Code", desc: "Scan at library entrance" },
          { num: "2", title: "Enter Code", desc: "Your Student Code / Mobile" },
          { num: "3", title: "Marked!", desc: "Instant Check-In / Out" },
        ];

    steps.forEach((step, idx) => {
      const stepX = 300 + idx * 300;
      // Circle
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(stepX, stepsY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'Segoe UI', sans-serif";
      ctx.fillText(step.num, stepX, stepsY + 7);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Segoe UI', sans-serif";
      ctx.fillText(step.title, stepX, stepsY + 50);

      ctx.fillStyle = "#64748b";
      ctx.font = "16px 'Segoe UI', sans-serif";
      ctx.fillText(step.desc, stepX, stepsY + 75);
    });

    // 5. Footer Bar
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 1470, 1200, 130);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 18px 'Segoe UI', Inter, sans-serif";
    const addressStr = libraryAddress ? `${libraryAddress}` : "";
    const contactStr = libraryPhone ? ` • Phone: ${libraryPhone}` : "";
    ctx.fillText(`${addressStr}${contactStr}`, 600, 1520);

    ctx.fillStyle = "#64748b";
    ctx.font = "15px 'Segoe UI', Inter, sans-serif";
    ctx.fillText("Library Management System • Secure Automated QR Service", 600, 1555);

    // Download PNG
    const downloadUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error("Error generating QR poster:", error);
    alert("Could not generate poster. Downloading basic QR code instead.");
    return false;
  }
};
