/**
 * lazy-load.js
 * 
 * Implements Intersection Observer for advanced lazy loading of images and visual assets.
 * This is useful for elements requiring fade-in animations, background images, 
 * or when native loading="lazy" is not sufficient.
 */

document.addEventListener("DOMContentLoaded", function() {
    // Select all elements with the 'lazy-image' class
    const lazyImages = [].slice.call(document.querySelectorAll("img.lazy-image, .lazy-bg"));

    if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    
                    if (lazyImage.tagName.toLowerCase() === 'img') {
                        // For img tags, swap data-src to src
                        if (lazyImage.dataset.src) {
                            lazyImage.src = lazyImage.dataset.src;
                        }
                        if (lazyImage.dataset.srcset) {
                            lazyImage.srcset = lazyImage.dataset.srcset;
                        }
                        
                        // Add class to trigger fade-in or other CSS transitions
                        lazyImage.onload = () => {
                            lazyImage.classList.add("lazy-loaded");
                            lazyImage.classList.remove("lazy-image");
                        };
                    } else {
                        // For background images or other elements
                        if (lazyImage.dataset.bg) {
                            lazyImage.style.backgroundImage = `url(${lazyImage.dataset.bg})`;
                        }
                        lazyImage.classList.add("lazy-loaded");
                        lazyImage.classList.remove("lazy-bg");
                    }
                    
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach(function(lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        lazyImages.forEach(function(lazyImage) {
            if (lazyImage.tagName.toLowerCase() === 'img') {
                if (lazyImage.dataset.src) {
                    lazyImage.src = lazyImage.dataset.src;
                }
                if (lazyImage.dataset.srcset) {
                    lazyImage.srcset = lazyImage.dataset.srcset;
                }
                lazyImage.classList.add("lazy-loaded");
                lazyImage.classList.remove("lazy-image");
            } else {
                if (lazyImage.dataset.bg) {
                    lazyImage.style.backgroundImage = `url(${lazyImage.dataset.bg})`;
                }
                lazyImage.classList.add("lazy-loaded");
                lazyImage.classList.remove("lazy-bg");
            }
        });
    }
});
