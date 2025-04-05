document.addEventListener("DOMContentLoaded", function () {
    // ✅ Fix: Hamburger Menu (Works on All Pages)
    function setupHamburgerMenu() {
        const hamburgerMenu = document.querySelector(".hamburger-menu");
        const navLinks = document.querySelector(".nav-links");

        if (!hamburgerMenu || !navLinks) return;

        hamburgerMenu.addEventListener("click", function (event) {
            event.stopPropagation();
            navLinks.classList.toggle("active");
            hamburgerMenu.classList.toggle("open");
        });

        document.addEventListener("click", function (event) {
            if (!navLinks.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });

        navLinks.addEventListener("click", function (event) {
            if (event.target.tagName === "A") {
                navLinks.classList.remove("active");
                hamburgerMenu.classList.remove("open");
            }
        });
    }

    setupHamburgerMenu();

    // ✅ Image Compression Script (Optimized)
    const imageInput = document.getElementById("imageInput");
    const uploadBox = document.getElementById("uploadBox");
    const originalPreview = document.getElementById("originalPreview");
    const originalImage = document.getElementById("originalImage");
    const originalDetails = document.getElementById("originalDetails");
    const compressRange = document.getElementById("compressRange");
    const compressValue = document.getElementById("compressValue");
    const compressBtn = document.getElementById("compressBtn");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const compressedPreview = document.getElementById("compressedPreview");
    const compressedImage = document.getElementById("compressedImage");
    const compressedDetails = document.getElementById("compressedDetails");
    const downloadBtn = document.getElementById("downloadBtn");
    const formatSelect = document.getElementById("formatSelect");
    const estimatedSizeText = document.getElementById("estimatedSize");

    let originalFile, originalSize, compressedBlob;

    uploadBox.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleFileUpload);
    uploadBox.addEventListener("dragover", (event) => event.preventDefault());
    uploadBox.addEventListener("drop", handleDrop);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) processImage(file);
    }

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) processImage(file);
    }

    function processImage(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert("Please upload an image smaller than 50MB.");
            return;
        }

        originalFile = file;
        originalSize = file.size;
        const reader = new FileReader();

        reader.onload = function (e) {
            originalPreview.hidden = false;
            originalImage.src = e.target.result;

            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                originalDetails.innerHTML = `Dimensions: ${img.width} x ${img.height}<br>Size: ${formatSize(originalSize)}`;
                compressBtn.disabled = false;
                updateEstimatedSize();
            };
        };

        reader.readAsDataURL(file);
    }

    compressRange.addEventListener("input", function () {
        compressValue.textContent = `${compressRange.value}%`;
        updateEstimatedSize();
    });

    compressBtn.addEventListener("click", function () {
        if (!originalFile) {
            alert("Please upload an image first.");
            return;
        }

        compressImage(originalFile);
    });

    function compressImage(file) {
        loadingIndicator.hidden = false;
        compressedPreview.hidden = true;

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const compressPercentage = parseInt(compressRange.value);
                let targetSize = Math.round((compressPercentage / 100) * originalSize);
                targetSize = Math.min(targetSize, originalSize); // ✅ Prevent exceeding original size

                let scaleFactor = Math.sqrt(compressPercentage / 100);
                const newWidth = Math.max(1, Math.round(img.width * scaleFactor));
                const newHeight = Math.max(1, Math.round(img.height * scaleFactor));

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const selectedFormat = formatSelect.value;
                let compressionQuality = compressPercentage / 100;

                if (selectedFormat === "image/png") {
                    compressionQuality = 1; // PNG doesn’t use quality-based compression
                }

                canvas.toBlob(
                    (blob) => {
                        loadingIndicator.hidden = true;
                        compressedPreview.hidden = false;

                        compressedBlob = blob;
                        compressedImage.src = URL.createObjectURL(blob);

                        let newSize = blob.size;

                        // ✅ Ensure final size does not exceed original
                        if (newSize > originalSize) {
                            newSize = originalSize;
                            console.warn("⚠ Compressed image exceeded original size. Resetting to original.");
                        }

                        let savedSize = originalSize - newSize;

                        // ✅ Display Details in Requested Format
                        compressedDetails.innerHTML = `
                            <strong>New Size:</strong> <strong>${formatSize(newSize)}</strong><br>
                            <strong>Saved Size:</strong> ${formatSize(savedSize)}<br>
                            <strong>New Dimensions:</strong> ${newWidth} x ${newHeight}
                        `;

                        downloadBtn.disabled = false;
                    },
                    selectedFormat,
                    compressionQuality
                );
            };
        };
    }

    function formatSize(size) {
        if (size >= 1024 * 1024) {
            return (size / (1024 * 1024)).toFixed(2) + " MB"; // Convert to MB
        } else {
            return (size / 1024).toFixed(2) + " KB"; // Convert to KB
        }
    }

    function updateEstimatedSize() {
        if (!originalFile) return;

        const compressPercentage = compressRange.value;
        let estimatedSize = Math.round((compressPercentage / 100) * originalSize);
        estimatedSizeText.textContent = `Estimated Size: ${formatSize(estimatedSize)}`;
    }

    downloadBtn.addEventListener("click", function () {
        if (!compressedBlob) {
            alert("No compressed image available.");
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(compressedBlob);
        downloadLink.download = `compressed-image.${formatSelect.value.split("/")[1]}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
});
