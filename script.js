// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const outputFormat = document.getElementById('outputFormat');
const compressBtn = document.getElementById('compressBtn');
const originalPreview = document.getElementById('originalPreview');
const originalStats = document.getElementById('originalStats');
const compressedPreview = document.getElementById('compressedPreview');
const compressedStats = document.getElementById('compressedStats');
const savingsPercent = document.getElementById('savingsPercent');
const downloadBtn = document.getElementById('downloadBtn');
const fileError = document.getElementById('fileError');
const controls = document.getElementById('controls');
const results = document.getElementById('results');

// State
let originalFile = null;
let compressedBlob = null;
let originalImageData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if browser supports required APIs
  if (!window.FileReader || !window.Worker) {
    showError('Your browser does not support all required features. Please use a modern browser like Chrome, Firefox, or Edge.');
    return;
  }

  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Upload zone interactions
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', handleDragOver);
  uploadZone.addEventListener('drop', handleDrop);
  uploadZone.addEventListener('dragleave', handleDragLeave);

  // File input
  fileInput.addEventListener('change', handleFileSelect);

  // Quality slider
  qualityRange.addEventListener('input', updateQualityValue);

  // Compress button
  compressBtn.addEventListener('click', compressImage);

  // Download button
  downloadBtn.addEventListener('click', downloadCompressedImage);
}

// Drag and Drop Handlers
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadZone.style.borderColor = 'var(--primary)';
  uploadZone.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  resetUploadZoneStyle();
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  resetUploadZoneStyle();

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function resetUploadZoneStyle() {
  uploadZone.style.borderColor = 'var(--border)';
  uploadZone.style.backgroundColor = '';
}

// File Handling
function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
}

function handleFile(file) {
  // Validate file
  if (!file.type.match('image.*')) {
    showError('Please select an image file (JPG, PNG, GIF, BMP)');
    return;
  }

  if (file.size > 25 * 1024 * 1024) { // 25MB limit
    showError('File size exceeds 25MB limit. Please choose a smaller image.');
    return;
  }

  // Reset previous state
  resetState();
  originalFile = file;

  // Read and display original image
  const reader = new FileReader();
  reader.onload = (e) => {
    originalPreview.src = e.target.result;
    originalPreview.hidden = false;
    
    // Calculate and display original stats
    calculateImageStats(file, e.target.result).then(stats => {
      originalStats.textContent = `${stats.dimensions} • ${stats.formattedSize}`;
      originalImageData = stats;
    });

    // Show controls
    controls.hidden = false;
    compressBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

// Image Compression
async function compressImage() {
  if (!originalFile) return;

  // Show loading state
  compressBtn.disabled = true;
  compressBtn.setAttribute('aria-busy', 'true');
  compressBtn.querySelector('.btn-text').textContent = 'Compressing...';

  try {
    // Use Compressor.js library (loaded from CDN)
    const quality = parseInt(qualityRange.value) / 100;
    const format = outputFormat.value;
    
    compressedBlob = await new Promise((resolve, reject) => {
      new Compressor(originalFile, {
        quality,
        mimeType: `image/${format}`,
        success(result) {
          resolve(result);
        },
        error(err) {
          reject(err);
        },
        convertSize: format === 'webp' ? Infinity : 0 // Convert all to WebP if selected
      });
    });

    // Display compressed image
    const compressedUrl = URL.createObjectURL(compressedBlob);
    compressedPreview.src = compressedUrl;
    compressedPreview.hidden = false;

    // Calculate and display compressed stats
    const stats = await calculateImageStats(compressedBlob, compressedUrl);
    compressedStats.textContent = `${stats.dimensions} • ${stats.formattedSize}`;

    // Calculate savings
    const savings = ((originalFile.size - compressedBlob.size) / originalFile.size * 100).toFixed(0);
    savingsPercent.textContent = `${savings}%`;

    // Show results
    results.hidden = false;
    downloadBtn.disabled = false;

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    showError('Failed to compress image. Please try again.');
    console.error('Compression error:', error);
  } finally {
    // Reset button state
    compressBtn.disabled = false;
    compressBtn.removeAttribute('aria-busy');
    compressBtn.querySelector('.btn-text').textContent = 'Compress Now';
  }
}

// Helper Functions
function updateQualityValue() {
  qualityValue.textContent = qualityRange.value;
}

async function calculateImageStats(file, dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dimensions = `${img.width} × ${img.height}px`;
      const formattedSize = formatFileSize(file.size);
      resolve({ dimensions, formattedSize, width: img.width, height: img.height });
    };
    img.src = dataUrl;
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resetState() {
  originalPreview.hidden = true;
  compressedPreview.hidden = true;
  controls.hidden = true;
  results.hidden = true;
  fileError.hidden = true;
  compressBtn.disabled = true;
  downloadBtn.disabled = true;
  originalFile = null;
  compressedBlob = null;
}

function showError(message) {
  fileError.textContent = message;
  fileError.hidden = false;
  setTimeout(() => {
    fileError.hidden = true;
  }, 5000);
}

// Download
function downloadCompressedImage() {
  if (!compressedBlob) return;

  const a = document.createElement('a');
  const extension = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value;
  const filename = `compressed-${Date.now()}.${extension}`;
  
  a.href = URL.createObjectURL(compressedBlob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
  }, 100);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    mainNav.classList.toggle('active');
  });
}
