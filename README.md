# Mohit Tiwari — Video Editor Portfolio

A responsive, single-page portfolio website made with HTML, CSS, and JavaScript. It is designed for sharing with recruiters and social-media marketing agencies.

## Before you share it

1. Open `index.html`.
2. Replace `YOUR_EMAIL@example.com` with your real email address in the `mailto:` link.
3. Replace the generic LinkedIn link with your LinkedIn profile URL.
4. **Add your videos (Google Drive, YouTube, Vimeo, or MP4)**:
   - Upload your video to Google Drive.
   - Right-click video → **Share** → under "General access", set to **"Anyone with the link" (Viewer)**.
   - Copy the share link (e.g., `https://drive.google.com/file/d/1ABCxyz.../view?usp=sharing`).
   - Open `index.html` and paste it into `data-video="..."` on the project cards:
     ```html
     <article class="project-card" data-video="https://drive.google.com/file/d/YOUR_ID/view?usp=sharing" data-aspect="9:16">
     ```
   - When a visitor clicks the card or the play button (▶), the video will automatically play directly on your website!
   - You can also set `data-aspect="9:16"` for vertical reels or `data-aspect="16:9"` for landscape videos.
5. Update the About section to match your real experience and tools. Keep only skills you can confidently use.

## Preview locally

Open `index.html` in a browser. For a local development server, open the folder in VS Code and use the Live Server extension.

## Publish free with GitHub Pages

1. Create a GitHub repository, for example `video-editor-portfolio`.
2. Upload `index.html`, `style.css`, `script.js`, and this README to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under build/deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. GitHub will provide a public website URL after deployment finishes.

You can also deploy this folder with Vercel by importing the repository; no build command is needed for this static site.
