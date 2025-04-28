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
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const imageContainer = document.getElementById('imageContainer'); // To hold multiple image previews
const reduceSize = document.getElementById('reduceSize');
const processing = document.getElementById('processing');
const downloadButton = document.getElementById('downloadButton');
const customSizeInput = document.getElementById('sizeInput'); // Custom size input
const customSizeText = document.getElementById('customSizeText'); // Custom size display text

let originalFiles = []; // Store multiple files
let compressedBlobs = []; // Store compressed blobs for each image

// Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// File Upload Handling
uploadBox.addEventListener('click', () => fileInput.click());
uploadBox.addEventListener('dragover', (e) => e.preventDefault());
uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  handleFiles(files);
});

function handleFiles(files) {
  if (files.length > 0) {
    imageContainer.innerHTML = ''; // Clear existing previews
    originalFiles = []; // Reset the file list
    compressedBlobs = []; // Reset the compressed blobs list

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) {
        alert('Please upload only image files.');
        return;
      }

      const file = files[i];
      originalFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper');

        // Image preview
        const preview = document.createElement('img');
        preview.src = e.target.result;
        preview.style.display = 'block';
        imageWrapper.appendChild(preview);

        // Image size text
        const imageSize = document.createElement('p');
        imageSize.textContent = `Image Size: ${(file.size / 1024).toFixed(2)} KB`;
        imageWrapper.appendChild(imageSize);

        // Processing text
        const processingText = document.createElement('p');
        processingText.textContent = 'Processing...';
        processingText.style.display = 'none';
        imageWrapper.appendChild(processingText);

        // Compressed image preview (initially hidden)
        const compressedImg = document.createElement('img');
        compressedImg.style.display = 'none';
        imageWrapper.appendChild(compressedImg);

        // Add the image wrapper to the container
        imageContainer.appendChild(imageWrapper);
      };
      reader.readAsDataURL(file);
    }
  }
}

// Compress an image
function compressImage(file, index) {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        const compressedSize = (blob.size / 1024).toFixed(2);
        const originalSize = (file.size / 1024).toFixed(2);
        const sizeReduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

        // Show processed image
        const processedImg = imageContainer.children[index].querySelector('img:nth-of-type(2)');
        processedImg.src = URL.createObjectURL(blob);
        processedImg.style.display = 'block';

        // Show compression stats
        const stats = imageContainer.children[index].querySelector('p:nth-of-type(2)');
        stats.textContent = `Size reduced by ${sizeReduction}% (${originalSize} KB → ${compressedSize} KB)`;

        // Hide processing text
        const processingText = imageContainer.children[index].querySelector('p:nth-of-type(3)');
        processingText.style.display = 'none';

        compressedBlobs[index] = blob;
      },
      'image/jpeg',
      0.8 // Quality (80%)
    );
  };
}

// Compress all images
function compressAllImages() {
  for (let i = 0; i < originalFiles.length; i++) {
    const processingText = imageContainer.children[i].querySelector('p:nth-of-type(3)');
    processingText.style.display = 'block'; // Show processing text
    compressImage(originalFiles[i], i);
  }
}

// Reduce image by custom size
function reduceBySize() {
  const targetSize = parseFloat(customSizeInput.value);
  if (!targetSize || originalFiles.length === 0) return;

  processing.style.display = 'block';

  for (let i = 0; i < originalFiles.length; i++) {
    const file = originalFiles[i];
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let quality = 0.8;
      let blob;

      const compress = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (b) => {
            blob = b;
            const compressedSize = (blob.size / 1024).toFixed(2);

            if (compressedSize > targetSize && quality > 0.1) {
              quality -= 0.1;
              compress();
            } else {
              compressedBlobs[i] = blob;

              const compressedImg = imageContainer.children[i].querySelector('img:nth-of-type(2)');
              compressedImg.src = URL.createObjectURL(blob);
              compressedImg.style.display = 'block';

              const originalSize = (file.size / 1024).toFixed(2);
              const sizeReduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

              const stats = imageContainer.children[i].querySelector('p:nth-of-type(2)');
              stats.textContent = `Size reduced by ${sizeReduction}% (${originalSize} KB → ${compressedSize} KB)`;

              const processingText = imageContainer.children[i].querySelector('p:nth-of-type(3)');
              processingText.style.display = 'none'; // Hide processing text
            }
          },
          'image/jpeg',
          quality
        );
      };

      compress();
    };
  }
}

// Event listener for custom size input change
customSizeInput.addEventListener('input', () => {
  const customSizeValue = customSizeInput.value;
  customSizeText.textContent = `Custom size set to: ${customSizeValue} KB`;
});

// Download Compressed Images
downloadButton.addEventListener('click', () => {
  compressedBlobs.forEach((blob, index) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compressed-${originalFiles[index].name}`;
    link.click();
  });
});

// Share on Social Media
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnInstagram() {
  alert('Instagram sharing is not supported directly. Download the image and share it manually.');
}
