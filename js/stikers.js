document.addEventListener('DOMContentLoaded', () => {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;

  const applyTransparentStyle = (element) => {
    const closestContainer = element.closest('#chatBody > *');
    if (closestContainer && !closestContainer.dataset.skiterStyled) {
      closestContainer.style.backgroundColor = 'transparent';
      closestContainer.dataset.skiterStyled = 'true';
    }
  };

  const scanAndStyle = () => {
    const elements = chatBody.querySelectorAll('[type-msg="skiter"]');
    elements.forEach(applyTransparentStyle);
  };

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches('[type-msg="skiter"]')) {
              applyTransparentStyle(node);
            } else {
              const nested = node.querySelectorAll?.('[type-msg="skiter"]');
              nested?.forEach(applyTransparentStyle);
            }
          }
        });
      }
    }
  });

  observer.observe(chatBody, {
    childList: true,
    subtree: true,
  });
  scanAndStyle();
});