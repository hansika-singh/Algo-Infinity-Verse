/**
 * Reusable pagination module for Algo Infinity Verse
 */

export function initPagination({
  items, // NodeList or Array of DOM elements
  itemsPerPage = 10,
  paginationContainer, // DOM element for pagination controls
  onPageChange = null // Optional callback function
}) {
  if (!items || items.length === 0 || !paginationContainer) return;

  const totalPages = Math.ceil(items.length / itemsPerPage);
  let currentPage = 1;

  // Function to render the correct items for the current page
  function renderPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    items.forEach((item, index) => {
      if (index >= startIndex && index < endIndex) {
        item.style.display = '';
        // Add a slight animation effect when items appear
        item.style.animation = 'none';
        item.offsetHeight; /* trigger reflow */
        item.style.animation = null;
      } else {
        item.style.display = 'none';
      }
    });

    renderControls();
    
    if (onPageChange) {
      onPageChange(currentPage, totalPages);
    }
  }

  // Function to render pagination controls
  function renderControls() {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
      return; // Hide pagination if there's only 1 page
    }

    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'pagination-controls';

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        renderPage(currentPage - 1);
        scrollToTop();
      }
    });
    paginationWrapper.appendChild(prevBtn);

    // Page Numbers
    const pageNumbersWrapper = document.createElement('div');
    pageNumbersWrapper.className = 'pagination-numbers';
    
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pagination-btn page-number ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        if (currentPage !== i) {
          renderPage(i);
          scrollToTop();
        }
      });
      pageNumbersWrapper.appendChild(pageBtn);
    }
    paginationWrapper.appendChild(pageNumbersWrapper);

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next-btn';
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        renderPage(currentPage + 1);
        scrollToTop();
      }
    });
    paginationWrapper.appendChild(nextBtn);

    paginationContainer.appendChild(paginationWrapper);
  }

  // Optional function to scroll back up slightly when page changes
  function scrollToTop() {
    const parentContainer = paginationContainer.parentElement;
    if (parentContainer) {
      const yOffset = -80; // Adjust for sticky navbar
      const y = parentContainer.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

  // Initialize first page
  renderPage(1);
}
