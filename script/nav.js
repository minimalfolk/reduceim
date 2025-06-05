document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const uploadBox = document.getElementById('uploadBox');
  const imageInput = document.getElementById('imageInput');
  const thumbnailContainer = document.getElementById('thumbnailContainer');
  const originalPreview = document.getElementById('originalPreview');
  const compressedPreview = document.getElementById('compressedPreview');
  const compressBtn = document.getElementById('compressBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const resizeMode = document.getElementById('resizeMode');
  const resizeOptions = document.querySelectorAll('.resize-option');
  const resizePercent = document.getElementById('resizePercent');
  const percentValue = document.getElementById('percentValue');
  const targetWidth = document.getElementById('targetWidth');
  const targetHeight = document.getElementById('targetHeight');
  const lockAspect = document.getElementById('lockAspect');
  const targetSize = document.getElementById('targetSize');
  const formatSelect = document.getElementById('formatSelect');
  const toggleAdvanced = document.getElementById('toggleAdvanced');
  const advancedSettings = document.getElementById('advancedSettings');
  const qualityPresets = document.getElementsByName('qualityPreset');
  const optimizationLevel = document.getElementById('optimizationLevel');
  const processingStatus = document.getElementById('processingStatus');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const timeRemaining = document.getElementById('timeRemaining');
  const resultsSection = document.getElementById('resultsSection');

  // State
  let uploadedFiles = [];
  let cancelProcessing = false;
  let originalAspectRatio = null;
  let processedFiles = [];

  // Initialize
  setupEventListeners();

  function setupEventListeners() {
    // Upload interactions
    uploadBox.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);

    // Resize mode switching
    resizeMode.addEventListener('change', updateResizeModeUI);

    // Percentage resize
    resizePercent.addEventListener('input', function() {
      percentValue.textContent = `${this.value}%`;
    });

    // Dimension controls
    targetWidth.addEventListener('input', handleDimensionChange);
    targetHeight.addEventListener('input', handleDimensionChange);

    // Processing controls
    compressBtn.addEventListener('click', startProcessing);
    cancelBtn.addEventListener('click', cancelProcess);
    downloadAllBtn.addEventListener('click', downloadAllProcessed);

    // Advanced options
    toggleAdvanced.addEventListener('change', function() {
      advancedSettings.style.display = this.checked ? 'block' : 'none';
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    uploadBox.classList.add('dragover');
  }

  function handleDragLeave() {
    uploadBox.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files.length) {
      processFiles(e.target.files);
    }
  }

  function updateResizeModeUI() {
    const mode = resizeMode.value;
    resizeOptions.forEach(option => {
      option.style.display = option.id === `${mode}Option` ? 'block' : 'none';
    });
  }

  function handleDimensionChange(e) {
    if (!lockAspect.checked || !originalAspectRatio) return;
    
    const changedField = e.target.id;
    if (changedField === 'targetWidth') {
      targetHeight.value = Math.round(targetWidth.value / originalAspectRatio);
    } else {
      targetWidth.value = Math.round(targetHeight.value * originalAspectRatio);
    }
  }

  async function processFiles(files) {
    // Reset state
    uploadedFiles = [];
    thumbnailContainer.innerHTML = '';
    originalPreview.innerHTML = '';
    resultsSection.style.display = 'none';
    compressBtn.disabled = false;
    
    // Filter valid image files
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.match('image.*')) {
        console.warn(`Skipped non-image file: ${file.name}`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        console.warn(`Skipped large file: ${file.name} (${formatFileSize(file.size)})`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files (max 50MB each)');
      return;
    }

    uploadedFiles = validFiles;
    uploadBox.style.display = 'none';
    
    // Process each file to create thumbnails and get dimensions
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      await createThumbnail(file);
      
      // For the first file, set initial dimensions
      if (i === 0) {
        const img = await loadImage(file);
        originalAspectRatio = img.width / img.height;
        targetWidth.value = img.width;
        targetHeight.value = img.height;
      }
    }

    compressBtn.disabled = false;
  }

  async function createThumbnail(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'uploader-thumbnail';
        
        thumbnail.innerHTML = `
          <img src="${e.target.result}" alt="${file.name}">
          <div class="file-info">
            <div class="file-name">${truncateFileName(file.name)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
          </div>
          <button class="remove-thumbnail" title="Remove image">&times;</button>
        `;
        
        thumbnail.querySelector('.remove-thumbnail').addEventListener('click', () => {
          thumbnail.remove();
          uploadedFiles = uploadedFiles.filter(f => f !== file);
          if (uploadedFiles.length === 0) {
            uploadBox.style.display = 'block';
            compressBtn.disabled = true;
          }
        });
        
        thumbnailContainer.appendChild(thumbnail);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  async function startProcessing() {
    if (!uploadedFiles.length) return;

    // Setup UI for processing
    cancelProcessing = false;
    cancelBtn.style.display = 'inline-block';
    compressBtn.disabled = true;
    processingStatus.hidden = false;
    resultsSection.style.display = 'none';
    compressedPreview.innerHTML = '';
    processedFiles = [];

    // Get processing parameters
    const mode = resizeMode.value;
    const format = formatSelect.value;
    const quality = document.querySelector('input[name="qualityPreset"]:checked').value;
    const optimization = optimizationLevel.value;

    try {
      // Process each file with progress tracking
      for (let i = 0; i < uploadedFiles.length; i++) {
        if (cancelProcessing) break;
        
        updateProgress(i, uploadedFiles.length);
        const file = uploadedFiles[i];
        
        // Get processing parameters based on mode
        let params = {};
        if (mode === 'percentage') {
          params.scale = parseInt(resizePercent.value) / 100;
        } else if (mode === 'dimensions') {
          params.width = targetWidth.value ? parseInt(targetWidth.value) : null;
          params.height = targetHeight.value ? parseInt(targetHeight.value) : null;
        } else {
          params.targetSize = parseInt(targetSize.value) * 1024; // Convert to bytes
        }
        
        const result = await processImage(file, params, format, quality, optimization);
        if (result) {
          processedFiles.push(result);
          createResultPreview(result, i);
        }
      }
      
      if (!cancelProcessing) {
        resultsSection.style.display = 'block';
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      processingStatus.hidden = true;
      cancelBtn.style.display = 'none';
      compressBtn.disabled = false;
    }
  }

  async function processImage(file, params, format, quality, optimization) {
    return new Promise(async (resolve, reject) => {
      try {
        const img = await loadImage(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions based on parameters
        let width, height;
        if (params.scale) {
          width = Math.round(img.width * params.scale);
          height = Math.round(img.height * params.scale);
        } else if (params.width || params.height) {
          if (params.width && params.height) {
            width = params.width;
            height = params.height;
          } else if (params.width) {
            width = params.width;
            height = Math.round(width / (img.width / img.height));
          } else {
            height = params.height;
            width = Math.round(height * (img.width / img.height));
          }
        } else {
          // Filesize mode - implement similar to previous compression algorithm
          width = img.width;
          height = img.height;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with high quality
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with specified format and quality
        const qualityValue = getQualityValue(quality);
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, `image/${format}`, qualityValue);
        });
        
        if (!blob) throw new Error('Image processing failed');
        
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          fileName: file.name,
          format,
          dimensions: { width, height },
          size: blob.size
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function getQualityValue(preset) {
    switch(preset) {
      case 'high': return 0.8;
      case 'medium': return 0.6;
      default: return 0.4;
    }
  }

  function createResultPreview(result, index) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    previewItem.innerHTML = `
      <div class="image-container">
        <img src="${result.url}" alt="Processed ${index + 1}">
      </div>
      <div class="details">
        <p><strong>Name:</strong> ${truncateFileName(result.fileName)}</p>
        <p><strong>Size:</strong> ${formatFileSize(result.size)}</p>
        <p><strong>Format:</strong> ${result.format.toUpperCase()}</p>
        <p><strong>Dimensions:</strong> ${result.dimensions.width} × ${result.dimensions.height}px</p>
        <div class="preview-actions">
          <button class="download-btn">
            <i class="fas fa-download"></i> Download
          </button>
          <button class="copy-btn">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
      </div>
    `;
    
    previewItem.querySelector('.download-btn').addEventListener('click', () => {
      downloadFile(result.url, result.fileName, result.format);
    });
    
    previewItem.querySelector('.copy-btn').addEventListener('click', async () => {
      try {
        const blob = await fetch(result.url).then(r => r.blob());
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        alert('Image copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy image');
      }
    });
    
    compressedPreview.appendChild(previewItem);
  }

  function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    
    // Simple time remaining estimation (could be improved)
    if (current > 0) {
      const elapsed = Date.now() - startTime;
      const estimatedTotal = elapsed * total / current;
      const remaining = Math.round((estimatedTotal - elapsed) / 1000);
      timeRemaining.textContent = `~${remaining}s remaining`;
    }
  }

  function cancelProcess() {
    cancelProcessing = true;
    processingStatus.hidden = true;
    cancelBtn.style.display = 'none';
    compressBtn.disabled = false;
  }

  function downloadAllProcessed() {
    processedFiles.forEach(file => {
      downloadFile(file.url, file.fileName, file.format);
    });
  }

  // Utility functions
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  function downloadFile(url, originalName, format) {
    const a = document.createElement('a');
    a.href = url;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_resized.${format}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function truncateFileName(name, maxLength = 20) {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const baseName = name.substring(0, maxLength - extension.length - 4);
    return `${baseName}...${extension}`;
  }
});
