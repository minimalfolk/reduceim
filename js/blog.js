fetch('blog-posts/blogs.json')
  .then(res => res.json())
  .then(blogs => {
    // Sort by date (latest first)
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const blogList = document.getElementById("blogList");

    blogs.forEach(blog => {
      const post = document.createElement("div");
      post.className = "blog-item";
      post.innerHTML = `
        <a href="blog-posts/${blog.file}">
          <h2>${blog.title}</h2>
          <p class="date">${new Date(blog.date).toDateString()}</p>
        </a>
      `;
      blogList.appendChild(post);
    });
  })
  .catch(err => {
    console.error("Failed to load blog posts:", err);
    document.getElementById("blogList").innerHTML = "<p>Unable to load blog posts.</p>";
  });
