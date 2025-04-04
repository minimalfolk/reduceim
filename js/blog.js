// Enhanced Blog Post Loader
document.addEventListener('DOMContentLoaded', function() {
  const blogList = document.getElementById("blogList");
  
  // Show loading state
  blogList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading blog posts...</p>
    </div>
  `;

  fetch('blog-posts/blogs.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(blogs => {
      // Clear loading state
      blogList.innerHTML = '';
      
      if (!blogs || blogs.length === 0) {
        showNoPostsMessage(blogList);
        return;
      }

      // Sort by date (newest first)
      blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Create blog post elements
      blogs.forEach(blog => {
        const post = createBlogPostElement(blog);
        blogList.appendChild(post);
      });
      
      // Add animation for loading effect
      animateBlogPosts();
    })
    .catch(err => {
      console.error("Failed to load blog posts:", err);
      showErrorState(blogList);
    });
});

function createBlogPostElement(blog) {
  const post = document.createElement("article");
  post.className = "blog-item";
  
  // Format date nicely (e.g., "June 15, 2023")
  const formattedDate = new Date(blog.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create HTML structure
  post.innerHTML = `
    <a href="blog-posts/${blog.file}" class="blog-link">
      ${blog.image ? `<img src="blog-posts/${blog.image}" alt="${blog.title}" class="blog-image">` : ''}
      <div class="blog-content">
        <h2 class="blog-title">${blog.title}</h2>
        <p class="blog-date">${formattedDate}</p>
        ${blog.excerpt ? `<p class="blog-excerpt">${blog.excerpt}</p>` : ''}
        <span class="read-more">Read more →</span>
      </div>
    </a>
  `;
  
  return post;
}

function showNoPostsMessage(container) {
  container.innerHTML = `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <p>No blog posts available yet.</p>
      <p>Check back soon for updates!</p>
    </div>
  `;
}

function showErrorState(container) {
  container.innerHTML = `
    <div class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>Failed to load blog posts.</p>
      <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
    </div>
  `;
}

function animateBlogPosts() {
  const blogItems = document.querySelectorAll('.blog-item');
  blogItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `all 0.5s ease ${index * 0.1}s`;
    
    // Trigger reflow to enable animation
    void item.offsetWidth;
    
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
  });
}
