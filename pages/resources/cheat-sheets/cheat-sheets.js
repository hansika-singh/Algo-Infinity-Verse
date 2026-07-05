import { initLoader } from "/modules/loader.js";
import { initTheme } from "/modules/theme.js";
import { initNavbar } from "/modules/navbar.js";
import { initPrint } from "/modules/print.js";
import { initScrollTop } from "/modules/scrollTop.js";
import { initPagination } from "/modules/pagination.js";

document.addEventListener("DOMContentLoaded", () => {

  initLoader();
  initTheme();
  initNavbar();
  initPrint();
  initScrollTop();

  // Initialize pagination
  const cheatSheets = document.querySelectorAll('.cheat-sheet-card');
  const paginationContainer = document.getElementById('cheatSheetsPagination');
  initPagination({
    items: cheatSheets,
    itemsPerPage: 10,
    paginationContainer: paginationContainer
  });
});