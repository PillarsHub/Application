// React adds controls after Tabler's DOMContentLoaded initialization has run.
// Delegate overlays so controls on lazy routes and inside modals also work.
export function initializeTabler() {
  window.tabler.Tooltip.getOrCreateInstance(document.body, {
    selector: '[data-bs-toggle="tooltip"], [data-tblr-toggle="tooltip"]',
    placement: 'auto',
    delay: { show: 50, hide: 50 },
  });
  // Tabler allows one component instance per element, so use a separate root.
  window.tabler.Popover.getOrCreateInstance(document.getElementById('root'), {
    selector: '[data-bs-toggle="popover"], [data-tblr-toggle="popover"]',
  });
}
