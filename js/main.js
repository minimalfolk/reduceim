// ===== AI IMAGE PROCESSOR CORE =====
class ReducePicEngine {
  constructor() {
    this.files = [];
    this.settings = {
      quality: 90,
      format: 'auto',
      width: null,
      height: null,
      unit: 'px'
    };
    this.init();
  }

  init() {
    this.setupDragDrop();
    this.bindUIEvents();
    this.setupServiceWorker();
    this.initAnalytics();
    this.checkWebPSupport();
  }

  // ===== CORE FUNCTIONALITY =====
  async processImages() {
    if (this.files.length === 0) return this.showToast('Please upload images first', 'error');
    
    this.showLoader(`Processing ${this.files.length} images...`);
    
    try {
      const results = [];
      const parallelLimit = 4; // Process 4 images simultaneously
      
      for (let i = 0; i < this.files.length; i += parallelLimit) {
        const batch = this.files.slice(i, i + parallelLimit);
        const batchResults = await Promise.all(
          batch.map(file => this.compressImage(file))
        );
        results.push(...batchResults);
        this.updateProgress(i / this.files.length * 100);
      }
      
      this.displayResults(results);
      this.logProcessingEvent(results);
      this.showToast(`Successfully processed ${results.length} images`, 'success');
    } catch (error) {
      console.error('Processing error:', error);
      this.showToast('Processing failed. Please try again.', 'error');
    } finally {
      this.hideLoader();
    }
  }

  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const img = await this.loadImage(event.target.result);
          const canvas = this.resizeImage(img);
          const blob = await this.exportCanvas(canvas);
          const optimizedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now()
          });
          
          resolve({
            original: file,
            optimized: optimizedFile,
            originalSize: file.size,
            optimizedSize: optimizedFile.size,
            reduction: ((file.size - optimizedFile.size) / file.size * 100).toFixed(1)
          });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  resizeImage(img) {
    const canvas = document.createElement('canvas');
    let { width, height } = this.calculateDimensions(img);
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas;
  }

  calculateDimensions(img) {
    if (!this.settings.width && !this.settings.height) {
      return { width: img.width, height: img.height };
    }
    
    let width = this.settings.width || img.width;
    let height = this.settings.height || img.height;
    
    // Maintain aspect ratio if only one dimension is set
    if (!this.settings.width || !this.settings.height) {
      const ratio = img.width / img.height;
      if (!this.settings.width) width = height * ratio;
      if (!this.settings.height) height = width / ratio;
    }
    
    // Convert units if needed
    if (this.settings.unit === '%') {
      width = img.width * (width / 100);
      height = img.height * (height / 100);
    }
    
    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }

  async exportCanvas(canvas) {
    let mimeType = 'image/jpeg';
    
    if (this.settings.format === 'auto') {
      mimeType = this.shouldUseWebP() ? 'image/webp' : 'image/jpeg';
    } else {
      mimeType = `image/${this.settings.format}`;
    }
    
    const quality = this.settings.quality / 100;
    
    return new Promise(resolve => {
      canvas.toBlob(resolve, mimeType, quality);
    });
  }

  // ===== AI/ML ENHANCEMENTS =====
  shouldUseWebP() {
    // Advanced feature detection with fallback
    return Modernizr.webp || 
           (this.settings.format === 'auto' && 
            this.detectOptimalFormat());
  }

  detectOptimalFormat() {
    // Placeholder for actual ML model integration
    // In production, this would use a trained model
    // to determine best format based on image content
    const randomFactor = Math.random();
    return randomFactor > 0.3; // 70% chance of using WebP
  }

  // ===== PERFORMANCE OPTIMIZATIONS =====
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered:', registration);
          })
          .catch(err => {
            console.log('SW registration failed:', err);
          });
      });
    }
  }

  processInWorker(files) {
    // Web Worker implementation for heavy processing
    if (window.Worker) {
      const worker = new Worker('/js/image-worker.js');
      
      worker.postMessage({ 
        files, 
        settings: this.settings 
      });
      
      worker.onmessage = (e) => {
        this.displayResults(e.data.results);
        worker.terminate();
      };
      
      worker.onerror = (err) => {
        console.error('Worker error:', err);
        this.showToast('Processing error in worker', 'error');
        worker.terminate();
      };
    } else {
      // Fallback to main thread
      this.processImages();
    }
  }

  // ===== UI CONTROLS =====
  bindUIEvents() {
    // Quality slider
    document.querySelector('.quality-slider').addEventListener('input', (e) => {
      this.settings.quality = e.target.value;
      document.querySelector('.quality-value').textContent = `${e.target.value}%`;
    });
    
    // Format selection
    document.querySelector('.format-select').addEventListener('change', (e) => {
      this.settings.format = e.target.value;
    });
    
    // Dimension inputs
    document.querySelectorAll('.dimension-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.settings[e.target.id] = e.target.value ? parseInt(e.target.value) : null;
      });
    });
    
    // Unit selection
    document.querySelector('#resizeUnit').addEventListener('change', (e) => {
      this.settings.unit = e.target.value;
    });
    
    // Process button
    document.querySelector('.pro-process-btn').addEventListener('click', () => {
      this.processImages();
    });
  }

  setupDragDrop() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.unhighlight, false);
    });
    
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFiles(files);
    });
    
    dropZone.addEventListener('click', () => {
      document.getElementById('proUpload').click();
    });
    
    document.getElementById('proUpload').addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });
  }

  handleFiles(files) {
    this.files = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (this.files.length === 0) {
      this.showToast('No valid image files found', 'warning');
      return;
    }
    
    this.updateFileCount();
    this.previewFirstImage(this.files[0]);
  }

  // ===== UI UPDATES =====
  displayResults(results) {
    const resultGrid = document.getElementById('resultGrid');
    resultGrid.innerHTML = '';
    
    results.forEach(result => {
      const card = this.createResultCard(result);
      resultGrid.appendChild(card);
    });
    
    document.getElementById('result').style.display = 'block';
    this.updateSummaryStats(results);
  }

  createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    card.innerHTML = `
      <div class="image-comparison">
        <div class="original">
          <img src="${URL.createObjectURL(result.original)}" alt="Original">
          <div class="size">${this.formatBytes(result.originalSize)}</div>
        </div>
        <div class="optimized">
          <img src="${URL.createObjectURL(result.optimized)}" alt="Optimized">
          <div class="size">${this.formatBytes(result.optimizedSize)}</div>
        </div>
      </div>
      <div class="stats">
        <div class="reduction">${result.reduction}% smaller</div>
        <button class="download-btn" data-id="${result.optimized.name}">
          <i class="fas fa-download"></i> Download
        </button>
      </div>
    `;
    
    card.querySelector('.download-btn').addEventListener('click', () => {
      this.downloadFile(result.optimized);
    });
    
    return card;
  }

  // ===== UTILITIES =====
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals) + ' ' + sizes[i];
  }

  downloadFile(file) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    
    this.logDownloadEvent(file.name);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  showLoader(message) {
    // Implementation would show loading overlay
    console.log('Loading:', message);
  }

  hideLoader() {
    // Implementation would hide loading overlay
    console.log('Loading complete');
  }

  // ===== ANALYTICS =====
  initAnalytics() {
    // Initialize analytics SDK
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-XXXXX-Y');
  }

  logProcessingEvent(results) {
    // Send processing stats to analytics
    const totalReduction = results.reduce((sum, r) => sum + parseFloat(r.reduction), 0);
    const avgReduction = totalReduction / results.length;
    
    gtag('event', 'image_processing', {
      'event_category': 'engagement',
      'event_label': 'batch_process',
      'value': results.length,
      'avg_reduction': avgReduction
    });
  }

  logDownloadEvent(filename) {
    gtag('event', 'download', {
      'event_category': 'engagement',
      'event_label': filename
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const imageProcessor = new ReducePicEngine();
  
  // Expose to window for debugging
  window.imageProcessor = imageProcessor;
});
