// ==UserScript==
// @name         Instagram Downloader
// @namespace    http://tampermonkey.net/
// @version      2024-08-15
// @description  Add download buttons to Instagram posts and reels to download images or videos manually from specific containers.
// @author       You
// @match        https://www.instagram.com/p/*
// @match        https://www.instagram.com/reel/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Function to download an image as a Blob
  function downloadImage(url, filename) {
      fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
      })
          .catch((error) => console.error("Error downloading image:", error));
  }

  // Function to download a video as a Blob
  function downloadVideo(url, filename) {
      fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
      })
          .catch((error) => console.error("Error downloading video:", error));
  }

  // Function to create and insert the download button for posts
  function createPostDownloadButton() {
      const button = document.createElement("button");
      button.innerHTML = `
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V15.5858L8.70711 13.2929C8.31658 12.9024 7.68342 12.9024 7.29289 13.2929C6.90237 13.6834 6.90237 14.3166 7.29289 14.7071L11.2929 18.7071C11.6834 19.0976 12.3166 19.0976 12.7071 18.7071L16.7071 14.7071C17.0976 14.3166 17.0976 13.6834 16.7071 13.2929C16.3166 12.9024 15.6834 12.9024 15.2929 13.2929L13 15.5858V3C13 2.44772 12.5523 2 12 2ZM5 20C4.44772 20 4 20.4477 4 21C4 21.5523 4.44772 22 5 22H19C19.5523 22 20 21.5523 20 21C20 20.4477 19.5523 20 19 20H5Z"/>
            </svg>`;
      button.style.cssText = `
            float: left;
            padding-right: 15px;
            background: none;
            border: none;
            cursor: pointer;
        `;

      // Add click event to download all images
      button.addEventListener("click", () => {
          const imageUrls = getPostImageSrcUrls();
          const currentUrl = window.location.href;
          const match = currentUrl.match(/\/p\/([a-zA-Z0-9_-]+)\//);
          let name = match[1] || "image";
          console.log(imageUrls);
          imageUrls.forEach((url, index) => {
              downloadImage(url, `${name}_${index + 1}.jpg`);
          });
      });

      const targetDiv = document.querySelector(".x11i5rnm.x1gryazu");
      if (targetDiv) {
          targetDiv.insertBefore(button, targetDiv.firstChild);
      }
  }

  // Function to create and insert the download button for reels
  function createReelDownloadButton() {
      const button = document.createElement("button");
      button.innerHTML = `
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V15.5858L8.70711 13.2929C8.31658 12.9024 7.68342 12.9024 7.29289 13.2929C6.90237 13.6834 6.90237 14.3166 7.29289 14.7071L11.2929 18.7071C11.6834 19.0976 12.3166 19.0976 12.7071 18.7071L16.7071 14.7071C17.0976 14.3166 17.0976 13.6834 16.7071 13.2929C16.3166 12.9024 15.6834 12.9024 15.2929 13.2929L13 15.5858V3C13 2.44772 12.5523 2 12 2ZM5 20C4.44772 20 4 20.4477 4 21C4 21.5523 4.44772 22 5 22H19C19.5523 22 20 21.5523 20 21C20 20.4477 19.5523 20 19 20H5Z"/>
            </svg>`;
      button.style.cssText = `
            float: left;
            padding-right: 15px;
            background: none;
            border: none;
            cursor: pointer;
        `;

      // Add click event to download the video
      button.addEventListener("click", () => {
          const videoUrl = getReelVideoSrcUrl();
          const currentUrl = window.location.href;
          const match = currentUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/);
          let name = match[1] || "video";
          console.log(videoUrl);
          if (videoUrl) {
              downloadVideo(videoUrl, `${name}.mp4`);
          }
      });

      const targetDiv = document.querySelector(".x11i5rnm.x1gryazu");
      if (targetDiv) {
          targetDiv.insertBefore(button, targetDiv.firstChild);
      }
  }

  // Function to extract image URLs from JSON data in posts
  const extractPostImageUrls = (scriptContent) => {
      try {
          const jsonData = JSON.parse(scriptContent.match(/({.*})/)[1]);
          const mediaItems = jsonData.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__media__shortcode__web_info.items[0];
          const singleMulti = mediaItems?.carousel_media ? mediaItems.carousel_media : mediaItems;

          let imageUrls = [];

          if (Array.isArray(singleMulti)) {
              // If singleMulti is an array, map through it
              imageUrls = singleMulti.map(mediaItem => {
                  if (mediaItem.image_versions2 && mediaItem.image_versions2.candidates && mediaItem.image_versions2.candidates.length > 0) {
                      return mediaItem.image_versions2.candidates[0].url;
                  }
                  return null;
              }).filter(url => url !== null);
          } else {
              // If singleMulti is a single object, directly get the URL
              if (singleMulti.image_versions2 && singleMulti.image_versions2.candidates && singleMulti.image_versions2.candidates.length > 0) {
                  imageUrls = [singleMulti.image_versions2.candidates[0].url];
              }
          }

          return imageUrls;
      } catch (error) {
          console.error('Error extracting image URLs:', error);
          return [];
      }
  };


  // Function to extract video URL from JSON data in reels
  const extractReelVideoUrl = (scriptContent) => {
      try {
          const jsonData = JSON.parse(scriptContent.match(/({.*})/)[1]);
          const videoUrl = jsonData.require[0][3][0].__bbox.require[0][3][1].__bbox.result.data.xdt_api__v1__media__shortcode__web_info.items[0].video_versions[0].url;
          return videoUrl;
      } catch (error) {
          console.error('Error extracting video URL:', error);
          return null;
      }
  };

  function getPostImageSrcUrls() {
      const scriptTag = [...document.querySelectorAll('script[type="application/json"]')]
      .find(tag => tag.textContent.includes('xdt_api__v1__media__shortcode__web_info'));
      if (scriptTag) {
          const scriptContent = scriptTag.textContent;
          const imageUrls = extractPostImageUrls(scriptContent);
          return imageUrls;
      } else {
          console.log('Script tag with the required JSON data not found.');
          return [];
      }
  }

  function getReelVideoSrcUrl() {
      const scriptTag = [...document.querySelectorAll('script[type="application/json"]')]
      .find(tag => tag.textContent.includes('xdt_api__v1__media__shortcode__web_info'));
      if (scriptTag) {
          const scriptContent = scriptTag.textContent;
          const videoUrl = extractReelVideoUrl(scriptContent);
          return videoUrl;
      } else {
          console.log('Script tag with the required JSON data not found.');
          return null;
      }
  }

  window.addEventListener("load", () => {
      if (window.location.href.includes('/p/')) {
          setTimeout(createPostDownloadButton, 1000);
      } else if (window.location.href.includes('/reel/')) {
          setTimeout(createReelDownloadButton, 1000);
      }
  });
})();
