
document.getElementById('increaseSizeBtn').addEventListener('click', async () => {
    const files = document.getElementById('image-upload').files;
    const desiredSizeKB = parseInt(document.getElementById('sizeInput').value);
    const selectedFormat = document.getElementById('format').value;  // Get the selected format
    const downloadLinksContainer = document.getElementById('downloadLinks');
    const downloadAllLink = document.getElementById('downloadAllLink');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const clearAllBtn = document.getElementById('clearAllBtn');

    const processedBlobs = []; // Store processed images for ZIP

    downloadLinksContainer.innerHTML = '';  // Clear previous results

    if (files.length === 0 || isNaN(desiredSizeKB) || desiredSizeKB < 1) {
        alert('Please upload images and specify a valid size (minimum 1KB).');
        return;
    }

    let processedCount = 0;
    progressContainer.style.display = 'block'; // Show the progress container

    // Loop through each file and process it
    const promises = Array.from(files).map(async (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = async () => {
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                let outputBlob;
                let currentSizeBytes;
                let quality = 1.0;
                let scaleFactor = 0.9;  // Start scaling by 10%

                // Iteratively adjust quality and scale down the image until size is reached
                while (true) {
                    // Compress the image and check the size
                    outputBlob = await new Promise((resolve) => {
                        canvas.toBlob(blob => resolve(blob), `image/${selectedFormat}`, quality);
                    });

                    currentSizeBytes = outputBlob.size;

                    // If the size is below the target, stop the loop
                    if (currentSizeBytes <= desiredSizeKB * 1024) {
                        break;
                    }

                    // Reduce the pixel dimensions to bring the size down
                    canvas.width = canvas.width * scaleFactor;
                    canvas.height = canvas.height * scaleFactor;
                    ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Adjust the quality slightly, if necessary
                    if (quality > 0.5) {
                        quality -= 0.05;
                    } else {
                        quality -= 0.02;  // Slower adjustment for low quality
                    }

                    // If size isn't dropping fast enough, reduce pixels more aggressively
                    if (canvas.width < 100 || canvas.height < 100) {
                        scaleFactor = 0.8;  // Further shrink the image if needed
                    }

                    // Edge case: Stop if the image is too small to shrink further
                    if (canvas.width < 50 || canvas.height < 50) {
                        break;
                    }
                }

                let finalBlob = outputBlob;
                const desiredSizeBytes = desiredSizeKB * 1024;

                // If still smaller than desired size, add dummy data
                if (finalBlob.size < desiredSizeBytes) {
                    const extraBytesNeeded = desiredSizeBytes - finalBlob.size;
                    const extraData = new Uint8Array(extraBytesNeeded).fill(0);
                    finalBlob = new Blob([finalBlob, extraData], { type: `image/${selectedFormat}` });
                }

                const downloadURL = URL.createObjectURL(finalBlob);

                // Create a preview section with download button and size in KB
                const imageSizeKB = (finalBlob.size / 1024).toFixed(0); // Convert size to KB
                const imagePreview = document.createElement('div');
                imagePreview.classList.add('image-preview2');
                imagePreview.innerHTML = `
                    <img src="${downloadURL}" alt="Preview Image">
                    <div class="file-info">
                        <div><strong>Size: ${imageSizeKB}KB</strong></div> 
                        <a href="${downloadURL}" download="converted-image-${file.name.split('.').slice(0, -1).join('.')}.${selectedFormat}"><strong>Download</strong></a>
</a>

                    </div>
                `;
                downloadLinksContainer.appendChild(imagePreview);

                // Store processed blobs for zipping later
                processedBlobs.push({ fileName: `converted-image-${file.name.split('.').slice(0, -1).join('.')}.${selectedFormat}`, blob: finalBlob });

                processedCount++;
                progressBar.style.width = `${(processedCount / files.length) * 100}%`;

                if (processedCount === files.length) {
                    progressContainer.style.display = 'none';
                    clearAllBtn.style.display = 'block';  // Show Clear All button after processing

                    // Hide the "Download All" button if only one image is processed
                    if (files.length > 1) {
                        downloadAllLink.style.display = 'block';  // Show Download All button if multiple images processed
                    }

                    document.getElementById('downloadLinks').scrollIntoView({ behavior: 'smooth' });
                }
                resolve();
            };

            img.onerror = () => {
                alert(`Error loading image: ${file.name}. Please try a different file.`);
                reject();
            };
        });
    });

    await Promise.all(promises);

    downloadLinksContainer.style.display = 'flex';  // Display the container for previews

    // ZIP and download processed images
    document.getElementById('downloadAllLink').addEventListener('click', async () => {
        const zip = new JSZip();
        if (processedBlobs.length > 1) {
            processedBlobs.forEach(({ fileName, blob }) => {
                zip.file(fileName, blob);
            });

            zip.generateAsync({ type: 'blob' }).then((content) => {
                const zipURL = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = zipURL;
                a.download = 'converted-images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);  // Clean up
            });
        }
    });
});

// Clear all images and reset the page by refreshing
document.getElementById('clearAllBtn').addEventListener('click', () => {
    location.reload();  // Refresh the whole page to clear everything
});



