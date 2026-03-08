// Securinets CTF Channel Handler
// Handles AJAX channel loading, form submissions, and reply functionality

(function() {
  'use strict';

  const channels = {
    home: { name: 'General', icon: 'fa-home', url: '/home' },
    crypto: { name: 'Cryptography', icon: 'fa-lock', url: '/crypto' },
    web_exp: { name: 'Web Exploitation', icon: 'fa-globe', url: '/web_exp' },
    reverse: { name: 'Reverse Engineering', icon: 'fa-code', url: '/reverse' },
    forensics: { name: 'Forensics', icon: 'fa-search', url: '/forensics' }
  };

  let currentChannel = 'home';
  let isSubmitting = false;

  document.addEventListener('DOMContentLoaded', function() {
    initializeChannelHandlers();
    attachEventListeners();
  });

  function initializeChannelHandlers() {
    document.querySelectorAll('.channel').forEach(channel => {
      channel.addEventListener('click', function(e) {
        e.preventDefault();
        const channelId = this.dataset.channel;
        if (channelId === currentChannel) return;

        setActiveChannel(channelId);
        loadChannelContent(channelId);
      });
    });

    window.addEventListener('popstate', function(event) {
      const channelId = event.state ? event.state.channelId : 'home';
      setActiveChannel(channelId);
      loadChannelContent(channelId);
    });

    // Detect current channel from URL
    const path = window.location.pathname;
    for (const [key, value] of Object.entries(channels)) {
      if (path.includes(value.url)) {
        currentChannel = key;
        setActiveChannel(key);
        break;
      }
    }
  }

  function setActiveChannel(channelId) {
    document.querySelectorAll('.channel').forEach(ch => ch.classList.remove('active'));
    const activeChannel = document.querySelector(`.channel[data-channel="${channelId}"]`);
    if (activeChannel) activeChannel.classList.add('active');
    currentChannel = channelId;
  }

  async function loadChannelContent(channelId) {
    if (channelId === 'home') {
      window.location.href = '/home';
      return;
    }

    const contentContainer = document.getElementById('channel-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <p>Loading ${channels[channelId].name}...</p>
      </div>
    `;

    try {
      const response = await fetch(channels[channelId].url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const html = await response.text();
        contentContainer.innerHTML = html;

        // Update URL and title
        history.pushState({ channelId }, channels[channelId].name, channels[channelId].url);
        document.title = `${channels[channelId].name} - Securinets CTF`;

        // Update the fixed create-post form
        const fixedCreatePostForm = document.querySelector('.fixed-create-post .create-post-form');
        if (fixedCreatePostForm) {
          fixedCreatePostForm.action = channels[channelId].url;

          // Add or update hidden input for post_place
          let postPlaceInput = fixedCreatePostForm.querySelector('.create-post-place');
          if (!postPlaceInput) {
            postPlaceInput = document.createElement('input');
            postPlaceInput.type = 'hidden';
            postPlaceInput.name = 'post_place';
            postPlaceInput.classList.add('create-post-place');
            fixedCreatePostForm.appendChild(postPlaceInput);
          }
          postPlaceInput.value = channelId;

          // Update textarea placeholder
          const textarea = fixedCreatePostForm.querySelector('.create-post-textarea');
          if (textarea) textarea.placeholder = `Message #${channels[channelId].name.toLowerCase()}...`;
        }

        attachEventListeners();
      } else {
        contentContainer.innerHTML = `
          <div class="error-message">
            <h3>Error Loading Channel</h3>
            <p>Could not load ${channels[channelId].name}. Please try again.</p>
            <button onclick="window.location.href='/home'">Return to Home</button>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error:', error);
      contentContainer.innerHTML = `
        <div class="error-message">
          <h3>Connection Error</h3>
          <p>Failed to connect to the server.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  function attachEventListeners() {
    attachReplyFunctionality();
    attachFormHandlers();
  }

  function attachReplyFunctionality() {
    // Toggle replies
    document.querySelectorAll(".toggle-replies").forEach(link => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);

      newLink.addEventListener("click", function(e) {
        e.preventDefault();
        const postId = this.dataset.postId;
        const repliesDiv = document.getElementById("replies-" + postId);
        if (repliesDiv.style.display === "none" || !repliesDiv.style.display) {
          repliesDiv.style.display = "block";
          this.textContent = "Hide Replies";
        } else {
          repliesDiv.style.display = "none";
          this.textContent = "Show Replies";
        }
      });
    });

    // Show reply form
    document.querySelectorAll(".reply-btn").forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener("click", function() {
        const postId = this.dataset.postId;
        const replyForm = document.getElementById("reply-form-" + postId);
        if (!replyForm) return;

        document.querySelectorAll(".reply-form-container").forEach(form => {
          if (form.id !== "reply-form-" + postId) form.style.display = "none";
        });

        replyForm.style.display = "block";
        replyForm.querySelector(".reply-textarea").focus();
      });
    });

    // Cancel reply
    document.querySelectorAll(".cancel-reply-btn").forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener("click", function() {
        const postId = this.dataset.postId;
        const replyForm = document.getElementById("reply-form-" + postId);
        if (replyForm) {
          replyForm.style.display = "none";
          replyForm.querySelector(".reply-textarea").value = "";
        }
      });
    });

    // Auto-resize textareas
    document.querySelectorAll(".reply-textarea").forEach(textarea => {
      textarea.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
      });
    });

    const createPostTextarea = document.querySelector('.create-post-textarea');
    if (createPostTextarea) {
      createPostTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
      });
    }
  }

  function attachFormHandlers() {
    // Handle fixed create-post form
    const fixedCreatePostForm = document.querySelector('.fixed-create-post .create-post-form');
    if (fixedCreatePostForm) {
      const newForm = fixedCreatePostForm.cloneNode(true);
      fixedCreatePostForm.parentNode.replaceChild(newForm, fixedCreatePostForm);

      newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isSubmitting) return;

        const submitBtn = this.querySelector('.create-post-submit-btn');
        if (submitBtn.disabled) return;

        isSubmitting = true;
        const formData = new FormData(this);
        const originalHTML = submitBtn.innerHTML;

        submitBtn.innerHTML = '<div class="mini-spinner"></div> <span>Posting...</span>';
        submitBtn.disabled = true;

        try {
          const response = await fetch(this.action, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            this.querySelector('.create-post-textarea').value = '';
            this.querySelector('.create-post-textarea').style.height = 'auto';
            loadChannelContent(currentChannel);
          } else {
            alert('Failed to post. Please try again.');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            isSubmitting = false;
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error posting. Please try again.');
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          isSubmitting = false;
        }
      });
    }

    // Handle reply forms
    document.querySelectorAll('.reply-form').forEach(form => {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isSubmitting) return;

        const submitBtn = this.querySelector('.submit-reply-btn');
        if (submitBtn.disabled) return;

        isSubmitting = true;
        const formData = new FormData(this);
        const originalHTML = submitBtn.innerHTML;

        submitBtn.innerHTML = '<div class="mini-spinner"></div> Replying...';
        submitBtn.disabled = true;

        try {
          const response = await fetch(this.action, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            this.closest('.reply-form-container').style.display = 'none';
            this.querySelector('.reply-textarea').value = '';
            loadChannelContent(currentChannel);
          } else {
            alert('Failed to reply. Please try again.');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            isSubmitting = false;
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error replying. Please try again.');
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          isSubmitting = false;
        }
      });
    });
  }
})();
