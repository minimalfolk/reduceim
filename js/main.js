// Hamburger toggle
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.classList.toggle("show");
}

// Demo Compression Logic
function compressImage() {
  const input = document.getElementById("imageInput");
  const result = document.getElementById("result");

  if (!input.files.length) {
    result.innerText = "Please upload an image first.";
    return;
  }

  result.innerText = "Compressing... (Demo Only)";
  
  // Simulated delay
  setTimeout(() => {
    result.innerText = "Image compressed successfully!";
  }, 1500);
}
