(function(){
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  const sitePreviewCache = new Map();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
const textFileExtensions = ['.txt', '.json', '.md', '.csv', '.log', '.xml'];
const knownFileExtensions = {
  '.exe': 'file-earmark-binary',
  '.msi': 'file-earmark-gear',
  '.zip': 'file-earmark-zip',
  '.rar': 'file-earmark-zip',
  '.7z': 'file-earmark-zip',
  '.txt': 'file-earmark-text',
  '.json': 'filetype-json',
  '.csv': 'filetype-csv',
  '.xml': 'filetype-xml',
  '.md': 'filetype-md',
  '.log': 'file-earmark-text',
  '.deb': 'file-earmark-arrow-down',
  '.appimage': 'file-earmark-play',
  '.flatpak': 'file-earmark-archive',
  '.tar': 'file-earmark-zip',
  '.gz': 'file-earmark-zip'
};
function downloadFile(url) {
  const normalizedUrl = normalizeUrlForRawAccess(url);
  return fetch(normalizedUrl)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = normalizedUrl.split('/').pop();
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(err => {
      console.error('Download failed:', err);
    });
}

function isImageUrl(url) {
  const normalizedUrl = normalizeUrlForRawAccess(url);
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];

  return imageExtensions.some(ext => normalizedUrl.toLowerCase().endsWith(ext)) || 
         normalizedUrl.startsWith('data:image') ||
         normalizedUrl.includes('/avatars/');
}

function isVideoUrl(url) {
  const normalizedUrl = normalizeUrlForRawAccess(url);
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/\d+/;
  const videoExtensions = ['.mp4', '.webm', '.ogg'];

  return ytRegex.test(normalizedUrl) || 
         vimeoRegex.test(normalizedUrl) || 
         videoExtensions.some(ext => normalizedUrl.toLowerCase().includes(ext));
}
function isFileUrl(url) {
  const normalizedUrl = normalizeUrlForRawAccess(url);
  return Object.keys(knownFileExtensions).some(ext => normalizedUrl.toLowerCase().endsWith(ext));
}
function createVideoPreviewElement(url) {
  let embedUrl = url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  else if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1].split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  }

  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.className = 'my-2';
  iframe.style.width = '100%'; // адаптивная ширина
  iframe.style.aspectRatio = '16 / 9'; // сохраняем пропорции
  iframe.style.maxWidth = '800px'; // ограничение для десктопа
  iframe.style.border = 'none';
  iframe.style.borderRadius = '1rem';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto'; // центрирование

  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
	
  return iframe;
}

function showVideoModal(url) {
  let embedUrl = '';

  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1].split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  } else {
    return;
  }

  const modalHtml = `
    <div class="modal fade" id="videoModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-dark text-white">
          <div class="modal-body p-0">
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
              <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"
                style="position:absolute;top:0;left:0;width:100%;height:100%;">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  new bootstrap.Modal(document.getElementById('videoModal')).show();
  document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('videoModal').remove();
  });
}

function getIconByExtension(ext) {
  const map = {
    '.exe': 'file-earmark-binary',
    '.msi': 'file-earmark-gear',
    '.deb': 'file-earmark-zip',
    '.rpm': 'file-earmark-zip',
    '.appimage': 'file-earmark-play',
    '.flatpak': 'file-earmark-archive',
    '.sh': 'terminal',
    '.txt': 'file-earmark-text',
    '.json': 'filetype-json',
    '.csv': 'filetype-csv',
    '.md': 'markdown',
    '.zip': 'file-earmark-zip',
    '.rar': 'file-earmark-zip',
    '.7z': 'file-earmark-zip',
    '.pdf': 'file-earmark-pdf',
    '.doc': 'filetype-doc',
    '.docx': 'filetype-docx',
    '.xls': 'filetype-xls',
    '.xlsx': 'filetype-xlsx'
  };
  return map[ext] || 'file-earmark';
}

function formatFileSize(bytes) {
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
}

function createFileElement(url) {
  const ext = Object.keys(knownFileExtensions).find(e => url.toLowerCase().endsWith(e)) || '.txt';
  const iconClass = knownFileExtensions[ext] || 'file-earmark';
  const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
  const domain = new URL(url).hostname;

  const container = document.createElement('div');
container.className = 'd-flex flex-wrap flex-md-nowrap align-items-start border rounded p-2 my-2';
container.style.gap = '10px';
container.style.backgroundColor = '#2a3a4b';
container.style.color = '#fff';
container.style.fontSize = 'clamp(0.85rem, 2vw, 1rem)';
container.style.flexDirection = 'row'; // fallback

  const icon = document.createElement('i');
  icon.className = `bi bi-${iconClass}`;
  icon.style.fontSize = '2rem';

  const info = document.createElement('div');
  info.innerHTML = `
    <strong>${fileName}</strong>
    <small>${domain}</small>
    <span class="text-muted" id="fileSize-${fileName.replace(/\W/g, '')}" style="display: contents;">Получение размера...</span>
  `;
	info.style.flex = '1 1 auto';
info.style.minWidth = '0'; // предотвращает переполнение
info.querySelector('small').style.fontSize = '0.8rem';
  const actions = document.createElement('div');
  actions.className = 'ms-auto d-flex align-items-center gap-2';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn-sm btn-outline-light d-flex align-items-center';
  downloadBtn.innerHTML = `<i class="bi bi-cloud-arrow-down me-1"></i> `;

  const previewBtn = document.createElement('button');
  previewBtn.className = 'btn btn-sm btn-secondary d-flex align-items-center';
  previewBtn.innerHTML = `<i class="bi bi-eye me-1"></i> `;

  downloadBtn.onclick = () => {
    const icon = downloadBtn.querySelector('i');
    icon.classList.remove('bi-cloud-arrow-down');
    icon.classList.add('spinner-border', 'spinner-border-sm');
    downloadFile(url).finally(() => {
      icon.classList.remove('spinner-border', 'spinner-border-sm');
      icon.classList.add('bi-cloud-arrow-down');
    });
  };

  previewBtn.onclick = () => showFilePreviewModal(url, fileName);

  actions.appendChild(previewBtn);
  actions.appendChild(downloadBtn);

  container.appendChild(icon);
  container.appendChild(info);
  container.appendChild(actions);

  // Получить размер файла (через HEAD-запрос)
  fetch(url, { method: 'HEAD' }).then(res => {
    const size = res.headers.get('content-length');
    if (size) {
      const sizeElem = document.getElementById(`fileSize-${fileName.replace(/\W/g, '')}`);
      if (sizeElem) sizeElem.textContent = formatFileSize(size);
    }
  });
  container.setAttribute('type', 'site');
  return container;
}

function showFilePreviewModal(url, fileName) {
  const modalHtml = `
    <div class="modal fade" id="filePreviewModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content text-bg-dark">
          <div class="modal-header">
            <h5 class="modal-title">${fileName}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <pre style="max-height: 500px; overflow-y: auto;" id="fileContent">Загрузка...</pre>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  new bootstrap.Modal(document.getElementById('filePreviewModal')).show();

  fetch(url)
    .then(res => res.text())
    .then(text => {
      document.getElementById('fileContent').textContent = text;
    })
    .catch(() => {
      document.getElementById('fileContent').textContent = 'Ошибка при загрузке содержимого файла.';
    });

  document.getElementById('filePreviewModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('filePreviewModal').remove();
  });
}


function createImageElement(url) {
const img = document.createElement('img');
img.src = url;
img.className = 'img-fluid rounded my-2';
img.style.cursor = 'pointer';

const isSkiter = url.startsWith('https://arkonova.ru/static/stik/');

if (isSkiter) {
img.setAttribute('type-msg', 'skiter');
} else {
img.addEventListener('click', () => showImageModal(url));
}

img.onload = () => {
const ratio = img.naturalWidth / img.naturalHeight;
if (ratio > 1.2) {
img.style.maxWidth = '400px';
img.style.height = 'auto';
} else if (ratio < 0.8) {
img.style.maxHeight = '400px';
img.style.width = 'auto';
} else {
img.style.maxWidth = '300px';
img.style.maxHeight = '300px';
}
};
img.setAttribute('type', 'site');
return img;
}

  function scanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      let match;
      const fragments = [];
      let lastIndex = 0;

      while ((match = urlRegex.exec(text)) !== null) {
        const url_orig = match[0];
        const url = normalizeUrlForRawAccess(url_orig);
        const idx = match.index;
        fragments.push(document.createTextNode(text.slice(lastIndex, idx)));

if (isImageUrl(url)) {
  fragments.push(createImageElement(url));
} else if (isVideoUrl(url)) {
  fragments.push(createVideoPreviewElement(url));
} else if (isFileUrl(url)) {
  fragments.push(createFileElement(url));
} else {
  fragments.push(createSitePreviewBlock(url));
}

        lastIndex = idx + url.length;
      }

      if (fragments.length) {
        fragments.push(document.createTextNode(text.slice(lastIndex)));
        const wrapper = document.createElement('span');
        fragments.forEach(f => wrapper.appendChild(f));
        node.parentNode.replaceChild(wrapper, node);
      }
    }
  }


//site
function createSitePreviewBlock(url) {
  if (sitePreviewCache.has(url)) {
    return sitePreviewCache.get(url);
  }

  const container = document.createElement('div');
  sitePreviewCache.set(url, container);
  container.className = 'alert alert-secondary d-flex flex-wrap flex-md-nowrap align-items-center gap-2 p-2 my-2';
  container.style.fontSize = 'clamp(0.9rem, 2vw, 1rem)';
  container.style.backgroundColor = '#2a3a4b';
  container.style.color = '#ffffff';
  container.style.borderColor = '#444';

  container.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div> <span>Загрузка...</span>`;

  async function getSiteMetaData(inputUrl) {
    let siteUrl = inputUrl;

const proxyList = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?', // работает с URL без кодировки
];

async function fetchHTML(targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 секунд

  for (const proxy of proxyList) {
    try {
      const encodedUrl = proxy.includes('?url=') ? encodeURIComponent(targetUrl) : targetUrl;
      const response = await fetch(proxy + encodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // некоторые сайты требуют
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`Прокси ${proxy} вернул статус ${response.status}`);
        continue;
      }

      const html = await response.text();
      if (html.length < 50) {
        console.warn(`Получен подозрительно короткий HTML с ${proxy}`);
        continue;
      }

      return html;

    } catch (err) {
      console.warn(`Ошибка при попытке через ${proxy}:`, err.message);
      continue;
    }
  }

  return null;
}

    function extractMetadata(html, baseURL) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.innerText || 'Без названия';
      const desc = doc.querySelector('meta[name="description"]')?.content ||
                   doc.querySelector('meta[property="og:description"]')?.content || '';
      const icon = doc.querySelector('link[rel~="icon"]')?.href ||
                   doc.querySelector('meta[property="og:image"]')?.content ||
                   '/favicon.ico';

      const logoUrl = new URL(icon, baseURL).href;
      return { title, description: desc, logo: logoUrl };
    }

    let html = await fetchHTML(siteUrl);
    if (!html) {
      try {
        const domain = new URL(siteUrl).origin;
        html = await fetchHTML(siteUrl);
        siteUrl = domain;
      } catch (e) {
        return { error: 'Невозможно получить доступ' };
      }
    }

    if (!html) return { error: 'Не удалось получить данные ни с URL, ни с домена' };

    return extractMetadata(html, new URL(siteUrl).origin);
  }

  getSiteMetaData(url)
    .then(meta => {
      if (meta.error) throw new Error(meta.error);

      container.innerHTML = '';
      const icon = document.createElement('img');
      icon.src = meta.logo || 'https://via.placeholder.com/32';
      icon.className = 'rounded me-2';
      icon.width = 32;
      icon.height = 32;
      icon.style.backgroundColor = '#ffffff';
      icon.style.padding = '4px';
      icon.style.flexShrink = '0';
      icon.style.borderRadius = '8px';
      icon.style.maxWidth = '32px';
      icon.style.maxHeight = '32px';
      icon.style.objectFit = 'contain';

      const shortDesc = meta.description.length > 200
        ? meta.description.slice(0, 197).trim() + '...'
        : meta.description;

      const text = document.createElement('div');
      text.innerHTML = `<strong>${meta.title}</strong><br><small>${shortDesc}</small>`;
      text.style.flex = '1 1 auto';
      text.style.minWidth = '0';
      text.querySelector('strong').style.display = 'block';
      text.querySelector('strong').style.fontSize = 'clamp(1rem, 2.5vw, 1.1rem)';
      text.querySelector('small').style.display = 'block';
      text.querySelector('small').style.fontSize = 'clamp(0.8rem, 2vw, 0.95rem)';

      container.appendChild(icon);
      container.appendChild(text);
      container.style.cursor = 'pointer';
      container.addEventListener('click', e => {
        e.preventDefault();
        showSiteDialog(url);
      });
    })
    .catch(() => {
      container.className = 'alert alert-warning';
      container.innerHTML = '';
      let domainText = '';
      try {
        const domain = new URL(url).origin;
        const parsedDomain = new URL(url).hostname;
        domainText = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${parsedDomain}</a>`;
      } catch {
        domainText = url;
      }
      container.innerHTML = `Ошибка загрузки предварительного просмотра: ${domainText}`;
    });
	container.setAttribute('type', 'site');
  return container;
}

// 







function showImageModal(url) {
  const modalHtml = `
    <div class="modal fade" id="imgModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-body text-center">
            <img src="${url}" class="img-fluid" />
          </div>
          <div class="position-absolute top-0 end-0 p-2">
            <a href="${url}" download class="btn btn-sm" style="background: none; border: none;">
              <!-- Иконка с тенью и контуром для контраста -->
              <i class="bi bi-cloud-arrow-down-fill" style="font-size: 2rem; font-weight: bold; color: #ffffff; 
                  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7); padding: 5px;"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  new bootstrap.Modal(document.getElementById('imgModal')).show();
  document.getElementById('imgModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('imgModal').remove();
  });
}



function normalizeUrlForRawAccess(url) {
  try {
    const parsed = new URL(url);

    // GitHub
    if (parsed.hostname === 'github.com') {
      if (parsed.pathname.startsWith('/')) {
        // Проверка на наличие /blob/ в пути
        return url
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/', '/');
      }
    }

    // GitLab
    if (parsed.hostname === 'gitlab.com') {
      if (parsed.pathname.includes('/-/blob/')) {
        return url.replace('/-/blob/', '/-/raw/');
      }
    }

    // Bitbucket
    if (parsed.hostname === 'bitbucket.org') {
      if (parsed.pathname.includes('/src/')) {
        return url.replace('/src/', '/raw/');
      }
    }

    // Azure Repos
    if (parsed.hostname === 'dev.azure.com') {
      if (parsed.pathname.includes('/_git/')) {
        return url.replace('/_git/', '/_apis/git/repositories/');
      }
    }

    // SourceForge
    if (parsed.hostname === 'sourceforge.net') {
      if (parsed.pathname.includes('/svn/')) {
        return url.replace('/svn/', '/download/');
      }
    }
    return url; // если не требует преобразования
  } catch (err) {
    console.error('Invalid URL:', url, err);
    return url;
  }
}



function showSiteDialog(url) {
  const modalHtml = `
    <div class="modal fade" id="siteModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center">
            <p>Переход на внешний ресурс. Пожалуйста, убедитесь в его безопасности перед переходом.</p>
            <div id="sitePreview" class="my-3">
              <div class="spinner-border spinner-border-sm" role="status"></div> Загрузка предпросмотра...
            </div>
          </div>
          <div class="modal-footer">
            <a href="${url}" target="_blank" class="btn btn-danger">
              <i class="bi bi-box-arrow-up-right"></i> Перейти
            </a>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  new bootstrap.Modal(document.getElementById('siteModal')).show();

  async function getSiteMetaData(inputUrl) {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    let siteUrl = inputUrl;

    async function fetchHTML(targetUrl) {
      try {
        const response = await fetch(corsProxy + encodeURIComponent(targetUrl));
        if (!response.ok) throw new Error('Request failed');
        return await response.text();
      } catch (err) {
        return null;
      }
    }

    function extractMetadata(html, baseURL) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.innerText || 'Без названия';
      const desc = doc.querySelector('meta[name="description"]')?.content ||
                   doc.querySelector('meta[property="og:description"]')?.content || '';
      const icon = doc.querySelector('link[rel~="icon"]')?.href ||
                   doc.querySelector('meta[property="og:image"]')?.content ||
                   '/favicon.ico';

      const logoUrl = new URL(icon, baseURL).href;  // Логотип по домену
      let imageUrl = doc.querySelector('meta[property="og:image"]')?.content || '';

      // Если мета-тег для изображения не найден, ищем первое изображение на странице
      if (!imageUrl) {
        const firstImage = doc.querySelector('img');
        if (firstImage) {
          imageUrl = firstImage.src;
        }
      }

      return { title, description: desc, logo: logoUrl, image: imageUrl };
    }

    let html = await fetchHTML(siteUrl);
    if (!html) {
      try {
        const domain = new URL(siteUrl).origin;  // Получаем домен для логотипа
        html = await fetchHTML(siteUrl);
        siteUrl = domain;  // Используем домен для логотипа
      } catch (e) {
        return { error: 'Невозможно получить доступ' };
      }
    }

    if (!html) return { error: 'Не удалось получить данные ни с URL, ни с домена' };

    return extractMetadata(html, new URL(siteUrl).origin);  // Логотип по главному домену
  }

  getSiteMetaData(url)
    .then(meta => {
      const previewContainer = document.getElementById('sitePreview');
      previewContainer.innerHTML = ''; // Очищаем текст "Загрузка..."
      
      // Добавляем изображение предпросмотра (основное изображение сайта)
      const img = document.createElement('img');
      img.src = meta.image || 'https://placehold.co/300'; // Используем fallback изображение
      img.className = 'img-fluid rounded';
      previewContainer.appendChild(img);

      // Добавляем описание и название
      const title = document.createElement('h5');
      title.textContent = meta.title;
      previewContainer.appendChild(title);

      const description = document.createElement('p');
      description.textContent = meta.description || 'Описание не найдено.';
      previewContainer.appendChild(description);

      // Добавляем ссылку на сайт внизу
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = url;
      link.style.fontWeight = 'bold';  // Жирный текст
      link.style.fontSize = '1.2rem';  // Увеличиваем размер шрифта
      link.style.color = '#e63946';  // Красный цвет для выделения
      link.style.textDecoration = 'underline';  // Подчеркиваем ссылку
      link.style.marginTop = '10px';  // Отступ сверху для ссылки
      previewContainer.appendChild(link);
    })
    .catch(() => {
      const previewContainer = document.getElementById('sitePreview');
      previewContainer.innerHTML = 'Ошибка при загрузке предпросмотра.';
    });

  document.getElementById('siteModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('siteModal').remove();
  });
}
  const walker = document.createTreeWalker(chatBody, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) scanNode(node);
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) scanNode(n);
        else if (n.nodeType === 1) {
          const subWalker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null, false);
          let nn;
          while (nn = subWalker.nextNode()) scanNode(nn);
        }
      });
    });
  });
  observer.observe(chatBody, { childList: true, subtree: true });
})();
