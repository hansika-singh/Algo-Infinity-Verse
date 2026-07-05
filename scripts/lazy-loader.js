/* Lazy‑loader utilities */
export function loadAsset(url, type = "script") {
  return new Promise((resolve, reject) => {
    if (type === "style") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    } else {
      const script = document.createElement("script");
      script.type = "module";
      script.src = url;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
}

export function withSpinner(promise) {
  const spinner = document.createElement("div");
  spinner.className = "lazy-spinner";
  spinner.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2">
        <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
        <path d="M36 18c0-9.94-8.06-18-18-18">
          <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
        </path>
      </g></g>
    </svg>`;
  spinner.style.position = "fixed";
  spinner.style.top = "50%";
  spinner.style.left = "50%";
  spinner.style.transform = "translate(-50%,-50%)";
  spinner.style.zIndex = "9999";
  document.body.appendChild(spinner);
  return promise.finally(() => spinner.remove());
}
