// =============================================================================
// Mohit Tiwari — Video Editor Portfolio Scripts
// Handles:
// 1. Google Drive & YouTube Thumbnail Auto-Fetching & Display
// 2. Hero Section Looping Video Player (Direct Stream & Embed Fallback)
// 3. Audio & Playback Controls (Mute/Unmute, Play/Pause, Fullscreen Modal)
// 4. Synchronized Editing Timeline Playhead & Live Timecode
// 5. Responsive Video Modal Player for 9:16 Reels and 16:9 Showreels
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Footer Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 2. Toast Notification System
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    if (message) toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // 3. Helper: Extract Google Drive File ID from various link formats
  function extractDriveFileId(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    // Format A: /file/d/FILE_ID/
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) return fileMatch[1];
    // Format B: ?id=FILE_ID or &id=FILE_ID
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) return idMatch[1];
    return null;
  }

  // 4. Helper: Extract YouTube ID (Shorts or Regular)
  function extractYouTubeId(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) return ytMatch[1];
    return null;
  }

  // 5. Helper: Convert any Google Drive, YouTube, or Vimeo link to an embeddable preview URL
  function convertToEmbedUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const url = rawUrl.trim();
    if (!url) return '';

    const driveId = extractDriveFileId(url);
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }

    const ytId = extractYouTubeId(url);
    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return url;
  }

  // 6. Helper: Extract standard viewable link for Google Drive button
  function getDirectDriveUrl(rawUrl) {
    if (!rawUrl) return '#';
    const driveId = extractDriveFileId(rawUrl);
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/view`;
    }
    return rawUrl;
  }

  // 7. Helper: Get Video Thumbnail URL automatically
  function getVideoThumbnailUrl(videoUrl, explicitThumb) {
    if (explicitThumb && explicitThumb.trim()) {
      return explicitThumb.trim();
    }
    if (!videoUrl) return null;

    const driveId = extractDriveFileId(videoUrl);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}=w1000`;
    }

    const ytId = extractYouTubeId(videoUrl);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }

    return null;
  }

  // ===========================================================================
  // 8. Automatic Video Thumbnail Loader for Project Cards
  // ===========================================================================
  function initProjectThumbnails() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach((card) => {
      const visual = card.querySelector('.project-visual');
      if (!visual) return;

      const videoUrl = card.getAttribute('data-video');
      const explicitThumb = card.getAttribute('data-thumbnail');
      const title = card.getAttribute('data-title') || card.querySelector('h3')?.textContent || 'Project preview';

      // If thumbnail img is already present in markup, mark container as active
      if (visual.querySelector('.project-thumbnail')) {
        visual.classList.add('has-thumbnail');
        return;
      }

      const thumbUrl = getVideoThumbnailUrl(videoUrl, explicitThumb);
      if (!thumbUrl) return;

      const img = document.createElement('img');
      img.src = thumbUrl;
      img.alt = `${title} Thumbnail`;
      img.className = 'project-thumbnail';
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.loading = 'lazy';

      const scrim = document.createElement('div');
      scrim.className = 'thumbnail-scrim';
      scrim.setAttribute('aria-hidden', 'true');

      visual.prepend(scrim);
      visual.prepend(img);
      visual.classList.add('has-thumbnail');

      img.onerror = () => {
        const driveId = extractDriveFileId(videoUrl);
        if (driveId && !img.dataset.failedOnce) {
          img.dataset.failedOnce = 'true';
          img.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
        }
      };
    });
  }

  // ===========================================================================
  // 9. Hero Section Video Player (Looping showreel with Mute/Play/Modal controls)
  // ===========================================================================
  function initHeroVideo() {
    const heroFrame = document.getElementById('heroScreenFrame') || document.querySelector('.screen-frame');
    if (!heroFrame) return;

    const videoContainer = document.getElementById('heroVideoContainer');
    const fallbackGraphic = document.getElementById('heroFallbackGraphic');
    const muteBtn = document.getElementById('heroMuteBtn');
    const playBtn = document.getElementById('heroPlayBtn');
    const expandBtn = document.getElementById('heroExpandBtn');
    const heroTimer = document.getElementById('heroTimer');
    const heroPlayhead = document.getElementById('heroPlayhead');

    const videoUrl = heroFrame.getAttribute('data-video');
    const title = heroFrame.getAttribute('data-title') || 'Featured Showreel Edit';
    const badge = heroFrame.getAttribute('data-badge') || 'SHOWREEL / PREVIEW';
    const aspect = heroFrame.getAttribute('data-aspect') || '16:9';

    if (!videoUrl || !videoUrl.trim()) {
      heroFrame.classList.remove('has-video');
      return;
    }

    heroFrame.classList.add('has-video');

    const driveId = extractDriveFileId(videoUrl);
    const ytId = extractYouTubeId(videoUrl);
    const thumbUrl = getVideoThumbnailUrl(videoUrl, heroFrame.getAttribute('data-thumbnail'));

    let activeVideoEl = null;

    // Helper: format seconds to SMPTE timecode 00:00:SS:FF (assuming 24fps)
    function formatTimecode(seconds) {
      if (isNaN(seconds) || seconds < 0) return '00:00:00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const frames = Math.floor((seconds - Math.floor(seconds)) * 24);
      const pad = (n) => String(n).padStart(2, '0');
      return `00:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
    }

    // A. For Google Drive or direct video files (.mp4 / .webm)
    if (driveId || videoUrl.match(/\.(mp4|webm|mov)(\?|$)/i)) {
      let video = videoContainer ? videoContainer.querySelector('video') : null;

      if (!video) {
        video = document.createElement('video');
        video.className = 'hero-video-media';
        video.id = 'heroVideoMedia';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('preload', 'auto');
        if (thumbUrl) video.poster = thumbUrl;

        if (driveId) {
          const source1 = document.createElement('source');
          source1.src = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
          source1.type = 'video/mp4';

          const source2 = document.createElement('source');
          source2.src = `https://drive.google.com/uc?export=download&id=${driveId}`;
          source2.type = 'video/mp4';

          video.appendChild(source1);
          video.appendChild(source2);
        } else {
          const source = document.createElement('source');
          source.src = videoUrl;
          video.appendChild(source);
        }

        if (videoContainer) {
          videoContainer.innerHTML = '';
          videoContainer.appendChild(video);
        }
      }

      activeVideoEl = video;

      // Ensure autoplay starts
      video.play().catch(() => {
        // Autoplay policy handled: video remains ready
      });

      // Synchronize timeline playhead and timecode
      video.addEventListener('timeupdate', () => {
        if (heroTimer) {
          heroTimer.textContent = formatTimecode(video.currentTime);
        }
        if (heroPlayhead && video.duration) {
          const percent = (video.currentTime / video.duration) * 100;
          heroPlayhead.style.left = `${percent}%`;
        }
      });

      // Playback state updates
      video.addEventListener('play', () => {
        if (playBtn) {
          playBtn.classList.add('is-playing');
          playBtn.setAttribute('title', 'Pause loop');
        }
      });

      video.addEventListener('pause', () => {
        if (playBtn) {
          playBtn.classList.remove('is-playing');
          playBtn.setAttribute('title', 'Play loop');
        }
      });

      video.addEventListener('volumechange', () => {
        if (muteBtn) {
          const tip = muteBtn.querySelector('.ctrl-tip');
          if (video.muted) {
            muteBtn.classList.add('is-muted');
            if (tip) tip.textContent = 'UNMUTE';
          } else {
            muteBtn.classList.remove('is-muted');
            if (tip) tip.textContent = 'MUTE';
          }
        }
      });

      // Fallback to iframe if direct stream fails
      video.addEventListener('error', () => {
        if (driveId && videoContainer) {
          videoContainer.innerHTML = `
            <iframe 
              src="https://drive.google.com/file/d/${driveId}/preview" 
              class="hero-video-frame" 
              allow="autoplay; encrypted-media; fullscreen" 
              allowfullscreen>
            </iframe>
          `;
        }
      });
    } else if (ytId) {
      // B. For YouTube links: embed looping YouTube iframe
      if (videoContainer) {
        videoContainer.innerHTML = `
          <iframe 
            src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&modestbranding=1" 
            class="hero-video-frame" 
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
            allowfullscreen>
          </iframe>
        `;
      }
    } else {
      // C. Generic embed link
      const embedUrl = convertToEmbedUrl(videoUrl);
      if (videoContainer && embedUrl) {
        videoContainer.innerHTML = `
          <iframe 
            src="${embedUrl}" 
            class="hero-video-frame" 
            allow="autoplay; encrypted-media; fullscreen" 
            allowfullscreen>
          </iframe>
        `;
      }
    }

    // Wire up hero controls
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeVideoEl) {
          activeVideoEl.muted = !activeVideoEl.muted;
        }
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeVideoEl) {
          if (activeVideoEl.paused) {
            activeVideoEl.play();
          } else {
            activeVideoEl.pause();
          }
        }
      });
    }

    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openVideoModal({ videoUrl, title, badge, aspect });
      });
    }

    // Clicking anywhere on the screen-frame (outside buttons) opens the full modal preview
    heroFrame.addEventListener('click', (e) => {
      if (e.target.closest('.hero-ctrl-btn')) return;
      openVideoModal({ videoUrl, title, badge, aspect });
    });
  }

  // ===========================================================================
  // 10. Video Modal Player Elements & Functions
  // ===========================================================================
  const modal = document.getElementById('videoModal');
  const backdrop = document.getElementById('videoModalBackdrop');
  const closeBtn = document.getElementById('videoModalClose');
  const titleEl = document.getElementById('videoModalTitle');
  const badgeEl = document.getElementById('videoModalBadge');
  const driveLinkEl = document.getElementById('videoModalDriveLink');
  const playerContainer = document.getElementById('videoPlayerContainer');
  const iframe = document.getElementById('videoPlayerIframe');
  const loadingEl = document.getElementById('videoPlayerLoading');

  // Open Video Modal
  function openVideoModal({ videoUrl, title, badge, aspect }) {
    if (!videoUrl || !videoUrl.trim()) {
      showToast('Add your Google Drive link to this card in index.html (data-video="...")');
      return;
    }

    const embedUrl = convertToEmbedUrl(videoUrl);
    if (!embedUrl) {
      showToast('Invalid video URL format. Please check your link in index.html.');
      return;
    }

    // Set meta
    if (titleEl) titleEl.textContent = title || 'Video Preview';
    if (badgeEl) badgeEl.textContent = badge || '01 / EDIT';
    if (driveLinkEl) {
      const directUrl = getDirectDriveUrl(videoUrl);
      driveLinkEl.href = directUrl;
      driveLinkEl.style.display = videoUrl.includes('drive.google.com') ? 'inline-block' : 'none';
    }

    // Configure aspect ratio class (9:16 vertical reel or 16:9 widescreen)
    if (playerContainer) {
      playerContainer.classList.remove('aspect-9-16', 'aspect-16-9');
      if (aspect === '16:9') {
        playerContainer.classList.add('aspect-16-9');
      } else {
        playerContainer.classList.add('aspect-9-16');
      }
    }

    // Show loading spinner while player initializes
    if (loadingEl) loadingEl.classList.remove('is-hidden');

    // Load iframe
    if (iframe) {
      iframe.onload = () => {
        if (loadingEl) loadingEl.classList.add('is-hidden');
      };
      iframe.src = embedUrl;
    }

    // Activate modal
    if (modal) {
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  // Close Video Modal
  function closeVideoModal() {
    if (!modal) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore background scrolling

    // Stop video playback and audio immediately
    if (iframe) {
      iframe.src = '';
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
  if (backdrop) backdrop.addEventListener('click', closeVideoModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-active')) {
      closeVideoModal();
    }
  });

  // ===========================================================================
  // 11. Connect Project Cards (Click to Play in Modal)
  // ===========================================================================
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card) => {
    const visual = card.querySelector('.project-visual');
    const playBtn = card.querySelector('.play-button');

    const handlePlay = (e) => {
      e.stopPropagation();

      const videoUrl = card.getAttribute('data-video');
      const title = card.getAttribute('data-title') || card.querySelector('h3')?.textContent;
      const badge = card.getAttribute('data-badge') || card.querySelector('.visual-label')?.textContent;
      const aspect = card.getAttribute('data-aspect') || '9:16';
      const playerMode = card.getAttribute('data-player');

      if (playerMode === 'inline' && visual && videoUrl) {
        const embedUrl = convertToEmbedUrl(videoUrl);
        visual.innerHTML = `
          <iframe 
            src="${embedUrl}" 
            class="inline-video-frame" 
            allow="autoplay; encrypted-media; fullscreen" 
            allowfullscreen>
          </iframe>
        `;
        return;
      }

      openVideoModal({ videoUrl, title, badge, aspect });
    };

    if (playBtn) playBtn.addEventListener('click', handlePlay);
    if (visual) visual.addEventListener('click', handlePlay);
  });

  // ===========================================================================
  // 12. Run Initializers
  // ===========================================================================
  initProjectThumbnails();
  initHeroVideo();
});
