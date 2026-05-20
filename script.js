const toggleButton = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (toggleButton && nav) {
  const closeMenu = () => {
    toggleButton.classList.remove('is-open');
    toggleButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  toggleButton.addEventListener('click', () => {
    const isOpen = toggleButton.classList.toggle('is-open');
    toggleButton.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('is-open', isOpen);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) {
      closeMenu();
    }
  });
}

const currentYear = new Date().getFullYear();
document.querySelectorAll('[data-current-year]').forEach((node) => {
  node.textContent = String(currentYear);
});
document.querySelectorAll('[data-next-millennium]').forEach((node) => {
  node.textContent = String(currentYear + 1000);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

document.querySelectorAll('.reveal').forEach((element) => {
  observer.observe(element);
});

const typingNotes = document.querySelectorAll('[data-typing-note]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const typeText = (element) => {
  if (element.dataset.typingReady === 'true') {
    return;
  }

  const fullText = (element.dataset.typingText ?? element.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  element.dataset.typingText = fullText;
  element.dataset.typingReady = 'true';
  element.setAttribute('aria-label', fullText);

  if (prefersReducedMotion) {
    element.textContent = fullText;
    element.classList.add('is-typed');
    return;
  }

  element.style.minHeight = `${element.offsetHeight}px`;
  element.textContent = '';
  element.classList.add('is-typing');

  let index = 0;

  const tick = () => {
    index += 1;
    element.textContent = fullText.slice(0, index);

    if (index < fullText.length) {
      const currentChar = fullText[index - 1];
      const delay = currentChar === '.' ? 34 : currentChar === ',' ? 42 : currentChar === ' ' ? 14 : 22;
      window.setTimeout(tick, delay);
      return;
    }

    element.classList.remove('is-typing');
    element.classList.add('is-typed');
    element.style.removeProperty('min-height');
  };

  window.setTimeout(tick, 180);
};

const typingObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    typeText(entry.target);
    typingObserver.unobserve(entry.target);
  });
}, {
  threshold: 0.45,
  rootMargin: '0px 0px -8% 0px',
});

typingNotes.forEach((element) => typingObserver.observe(element));

const familyTree = document.querySelector('[data-family-tree]');

if (familyTree) {
  const connectorCanvas = familyTree.querySelector('.tree-connector-canvas');
  const connectorMap = new Map();

  familyTree.querySelectorAll('.tree-connector:not(.tree-connector-glow)').forEach((path) => {
    const key = path.dataset.treeConnector;
    const glow = familyTree.querySelector(`.tree-connector-glow[data-tree-connector="${key}"]`);
    const union = familyTree.querySelector(`[data-tree-union="${key}"]`);
    const child = familyTree.querySelector(`[data-tree-child="${key}"]`);

    if (!key || !glow || !union || !child) {
      return;
    }

    connectorMap.set(key, {
      path,
      glow,
      union,
      child,
      length: 0,
    });
  });

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const setConnectorProgress = (connector, progress) => {
    const normalized = clamp(progress, 0, 1);
    const dashOffset = connector.length * (1 - normalized);
    const opacity = 0.12 + normalized * 0.88;

    connector.path.style.strokeDashoffset = `${dashOffset}`;
    connector.glow.style.strokeDashoffset = `${dashOffset}`;
    connector.path.style.opacity = `${opacity}`;
    connector.glow.style.opacity = `${Math.max(0.08, normalized * 0.42)}`;
  };

  const buildConnectorCurve = (startX, startY, endX, endY) => {
    const verticalDistance = Math.max(endY - startY, 90);
    const bendStrength = clamp(Math.abs(endX - startX) * 0.32, 28, 110);
    const controlY1 = startY + verticalDistance * 0.26;
    const controlY2 = startY + verticalDistance * 0.78;
    const direction = endX >= startX ? 1 : -1;
    const controlX1 = startX + bendStrength * direction;
    const controlX2 = endX - bendStrength * direction;

    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  const layoutTreeConnectors = () => {
    if (!connectorCanvas || connectorMap.size === 0) {
      return;
    }

    const treeRect = familyTree.getBoundingClientRect();
    const width = familyTree.clientWidth;
    const height = familyTree.scrollHeight;

    connectorCanvas.setAttribute('viewBox', `0 0 ${width} ${height}`);

    connectorMap.forEach((connector) => {
      const unionRect = connector.union.getBoundingClientRect();
      const childRect = connector.child.getBoundingClientRect();

      const startX = unionRect.left - treeRect.left + unionRect.width / 2;
      const startY = unionRect.top - treeRect.top + unionRect.height / 2 + 18;
      const endX = childRect.left - treeRect.left + childRect.width / 2;
      const endY = childRect.top - treeRect.top + 8;
      const pathDefinition = buildConnectorCurve(startX, startY, endX, endY);

      connector.path.setAttribute('d', pathDefinition);
      connector.glow.setAttribute('d', pathDefinition);

      connector.length = connector.path.getTotalLength();
      connector.path.style.strokeDasharray = `${connector.length}`;
      connector.glow.style.strokeDasharray = `${connector.length}`;

      if (prefersReducedMotion) {
        setConnectorProgress(connector, 1);
      }
    });
  };

  let scrollFrame = null;

  const updateTreeConnectors = () => {
    scrollFrame = null;

    if (prefersReducedMotion) {
      connectorMap.forEach((connector) => setConnectorProgress(connector, 1));
      return;
    }

    connectorMap.forEach((connector) => {
      const unionRect = connector.union.getBoundingClientRect();
      const childRect = connector.child.getBoundingClientRect();
      const triggerLine = window.innerHeight * 0.76;
      const travelDistance = Math.max(childRect.top - unionRect.top, 120) + window.innerHeight * 0.18;
      const progress = (triggerLine - unionRect.top) / travelDistance;

      setConnectorProgress(connector, progress);
    });
  };

  const requestTreeConnectorUpdate = () => {
    if (scrollFrame !== null) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(updateTreeConnectors);
  };

  const refreshTreeConnectors = () => {
    layoutTreeConnectors();
    requestTreeConnectorUpdate();
  };

  refreshTreeConnectors();

  window.addEventListener('load', refreshTreeConnectors);
  window.addEventListener('resize', refreshTreeConnectors);
  window.addEventListener('scroll', requestTreeConnectorUpdate, { passive: true });
}
