// Hamburger toggle with improved accessibility
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  const hamburger = document.querySelector('.hamburger');
  
  navLinks.classList.toggle("active");
  hamburger.setAttribute('aria-expanded', navLinks.classList.contains("active"));
  
  // Close menu when clicking on a link (for mobile)
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove("active");
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Enhanced Image Compression Logic with file validation
function compressImage() {
  const input = document.getElementById("imageInput");
  const result = document.getElementById("result");
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  if (!input.files.length) {
    showResult(result, "Please select an image first.", "error");
    return;
  }

  const file = input.files[0];
  
  // File type validation
  if (!file.type.match('image.*')) {
    showResult(result, "Please upload a valid image file (JPEG, PNG, etc.).", "error");
    return;
  }
  
  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    showResult(result, "File is too large (max 5MB).", "error");
    return;
  }

  showResult(result, "Compressing your image...", "processing");
  
  // Create a preview of the uploaded image
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // Display image preview
    const preview = document.createElement('img');
    preview.src = e.target.result;
    preview.style.maxWidth = '100%';
    preview.style.maxHeight = '200px';
    preview.style.margin = '10px 0';
    
    // Simulate compression (in a real app, you would use actual compression logic)
    setTimeout(() => {
      result.innerHTML = '';
      
      // Create download button for demo purposes
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'Download Compressed Image';
      downloadBtn.style.marginTop = '10px';
      downloadBtn.onclick = function() {
        alert('In a real implementation, this would download the compressed image');
      };
      
      // Show compressed size info
      const compressedSize = Math.round(file.size * 0.6); // Simulate 40% reduction
      const sizeInfo = document.createElement('p');
      sizeInfo.innerHTML = `
        <strong>Compression successful!</strong><br>
        Original: ${formatFileSize(file.size)}<br>
        Compressed: ${formatFileSize(compressedSize)} (${Math.round((1 - (compressedSize/file.size)) * 100)}% smaller)
      `;
      
      result.appendChild(preview);
      result.appendChild(sizeInfo);
      result.appendChild(downloadBtn);
      
    }, 1500);
  };
  
  reader.readAsDataURL(file);
}

// Helper function to show status messages
function showResult(element, message, type) {
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
}

// Helper function to format file sizes
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}
