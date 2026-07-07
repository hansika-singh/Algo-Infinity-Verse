class VirtualList {
  constructor(options) {
    this.container = typeof options.container === 'string' ? document.querySelector(options.container) : options.container;
    this.items = options.items || [];
    this.renderItem = options.renderItem;
    this.itemHeight = options.itemHeight || 100; 
    this.gap = options.gap || 0;
    this.overscan = options.overscan || 5; 
    this.scrollContainer = options.scrollContainer || window; 
    this.columns = options.columns || 1; 
    this.isGrid = options.isGrid || false;
    this.emptyMessage = options.emptyMessage || '<div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-secondary);"><p>No items found.</p></div>';

    this.lastStartIndex = -1;
    this.lastEndIndex = -1;
    this.forceRender = true;

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);

    this.scrollContainer.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    this.init();
  }

  init() {
    if (!this.container) return;
    this.calculateColumns();
    this.render();
  }

  updateItems(newItems) {
    this.items = newItems;
    this.forceRender = true;
    this.render();
  }

  destroy() {
    this.scrollContainer.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.paddingTop = '';
      this.container.style.paddingBottom = '';
    }
  }

  calculateColumns() {
    if (!this.isGrid) {
      this.columns = 1;
      return;
    }
    const style = window.getComputedStyle(this.container);
    const columns = style.gridTemplateColumns;
    if (columns && columns !== 'none') {
      this.columns = columns.split(' ').length;
    } else {
      const containerWidth = this.container.clientWidth || window.innerWidth;
      this.columns = Math.max(1, Math.floor(containerWidth / 350));
    }
  }

  onResize() {
    this.calculateColumns();
    this.forceRender = true;
    this.render();
  }

  onScroll() {
    requestAnimationFrame(() => this.render());
  }

  render() {
    if (!this.container) return;

    if (!this.items || this.items.length === 0) {
      this.container.innerHTML = this.emptyMessage;
      this.container.style.paddingTop = '0px';
      this.container.style.paddingBottom = '0px';
      return;
    }

    const totalRows = Math.ceil(this.items.length / this.columns);

    let scrollTop = 0;
    let viewportHeight = 0;

    if (this.scrollContainer === window) {
      const rect = this.container.getBoundingClientRect();
      scrollTop = -rect.top;
      viewportHeight = window.innerHeight;
    } else {
      scrollTop = this.scrollContainer.scrollTop;
      viewportHeight = this.scrollContainer.clientHeight;
    }

    scrollTop = Math.max(0, scrollTop);

    const rowHeight = this.itemHeight + this.gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - this.overscan);
    const visibleRows = Math.ceil(viewportHeight / rowHeight) + (2 * this.overscan);
    const endRow = Math.min(totalRows, startRow + visibleRows);

    const startIndex = startRow * this.columns;
    const endIndex = Math.min(this.items.length, endRow * this.columns);

    if (this.lastStartIndex === startIndex && this.lastEndIndex === endIndex && !this.forceRender) {
      return;
    }

    const paddingTop = startRow * rowHeight;
    const paddingBottom = Math.max(0, (totalRows - endRow) * rowHeight);

    this.container.style.paddingTop = `${paddingTop}px`;
    this.container.style.paddingBottom = `${paddingBottom}px`;

    const visibleItems = this.items.slice(startIndex, endIndex);
    const html = visibleItems.map((item, idx) => this.renderItem(item, startIndex + idx)).join('');
    
    this.container.innerHTML = html;
    
    this.lastStartIndex = startIndex;
    this.lastEndIndex = endIndex;
    this.forceRender = false;
  }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualList;
} else {
  window.VirtualList = VirtualList;
}
