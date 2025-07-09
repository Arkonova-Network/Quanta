const VERSION = '0.0.4';
console.info(`Orna badge/frame loader version: ${VERSION}`);

const socket = io({ maxHttpBufferSize: 10 * 1024 * 1024, transports: ['websocket'] });

const userBadgeContainer = document.getElementById('badges-container-user');
const externalBadgeContainer = document.getElementById('external-badges');
const externalFrameContainer = document.getElementById('external-frames');

let socketInitialized = false;

function createLoadingBlock(className, dataAttrName, dataAttrValue, userId = null) {
  const div = document.createElement('div');
  div.className = className + ' loading-skeleton';
  div.dataset[dataAttrName] = dataAttrValue;
  if (userId) div.dataset.userId = userId;
  div.innerHTML = `
    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
      <span class="visually-hidden">Loading...</span>
    </div>`;
  return div;
}

function updateBlockWithImage(selector, imageUrl, title, className, dataAttrName = null, dataAttrValue = null) {
  const block = document.querySelector(selector);
  if (!block) {
    console.warn(`Block not found for selector: ${selector}`);
    return;
  }

  if (!imageUrl) {
    block.textContent = 'Image not available';
    console.warn(`Image URL missing for ${title}`);
    return;
  }

  block.innerHTML = `
    <img src="${imageUrl}" class="img-thumbnail ${className}" 
      style="width:auto;height:200px;cursor:pointer;user-select:none;" 
      ${dataAttrName ? `data-${dataAttrName}="${dataAttrValue}"` : ''} 
      title="${title}" loading="lazy">`;
}

export function initSocketHandlers() {
  if (socketInitialized) return;
  socketInitialized = true;

  // === USER BADGES ===
  socket.on('badge_list', (data) => {
    if (data.error) return console.error('Error in badge_list:', data.error);
    console.debug('Received badge_list:', data);

    userBadgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      userBadgeContainer.appendChild(createLoadingBlock('badge-block', 'badgeId', badge.id));
      socket.emit('get_badge_details', { id: badge.id });
    });
  });

  socket.on('badge_details', (data) => {
    if (data.error) return console.error('Error in badge_details:', data.error);
    updateBlockWithImage(
      `div.badge-block[data-badge-id='${data.id}']`,
      data.image_url,
      `Badge ${data.id}`,
      'badge-select',
      'badge-id',
      data.id
    );
  });

  // === EXTERNAL BADGES ===
  socket.on('badge_list_external', (data) => {
    if (data.error) return console.error('Error in badge_list_external:', data.error);
    console.debug('Received badge_list_external:', data);

    externalBadgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      externalBadgeContainer.appendChild(
        createLoadingBlock('badge-block', 'badgeId', badge.id, data.user_id)
      );
      socket.emit('get_badge_details_external', { id: badge.id, user_id: data.user_id });
    });
  });

  socket.on('badge_details_external', (data) => {
    if (data.error) return console.error('Error in badge_details_external:', data.error);
    updateBlockWithImage(
      `div.badge-block[data-badge-id='${data.id}'][data-user-id='${data.user_id}']`,
      data.image_url,
      `Badge ${data.id}`,
      'badge-select'
    );
  });

  // === EXTERNAL FRAMES ===
  socket.on('frame_list_external', (data) => {
    if (data.error) return console.error('Error in frame_list_external:', data.error);
    console.debug('Received frame_list_external:', data);

    externalFrameContainer.innerHTML = '';
    data.frames.forEach(frame => {
      const frameBlock = createLoadingBlock('frame-block', 'frameId', frame.id, data.user_id);
      frameBlock.textContent = 'Loading frame...';
      externalFrameContainer.appendChild(frameBlock);
      socket.emit('get_frame_details_external', { id: frame.id, user_id: data.user_id });
    });
  });

  socket.on('frame_details_external', (data) => {
    if (data.error) return console.error('Error in frame_details_external:', data.error);
    updateBlockWithImage(
      `div.frame-block[data-frame-id='${data.id}'][data-user-id='${data.user_id}']`,
      data.image_url,
      `Select frame ${data.name}`,
      'frame-select',
      'frame-id',
      data.id
    );
  });
}

// === LOADERS ===

export function loadUserBadges() {
  console.debug('Emitting: get_badge_list');
  socket.emit('get_badge_list');
}

export function loadOrna(userId) {
  console.debug('Loading external data for user:', userId);

  socket.emit('get_badge_list_external', { user_id: userId });
  socket.emit('get_frame_list_external', { user_id: userId });
}
initSocketHandlers()

let lastBadgeIds = [];
let lastExternalBadgeIds = {};
let lastExternalFrameIds = {};
function isChanged(prevIds, newIds) {
  return JSON.stringify(prevIds) !== JSON.stringify(newIds);
}
setInterval(() => {
  socket.emit('get_badge_list');
}, 5000); 
socket.on('badge_list', (data) => {
  if (data.error) return console.error('Error in badge_list:', data.error);

  const newBadgeIds = data.badges.map(b => b.id);
  if (!isChanged(lastBadgeIds, newBadgeIds)) return;
  lastBadgeIds = newBadgeIds;

  userBadgeContainer.innerHTML = '';
  newBadgeIds.forEach(id => {
    userBadgeContainer.appendChild(createLoadingBlock('badge-block', 'badgeId', id));
    socket.emit('get_badge_details', { id });
  });
});

socket.on('badge_list_external', (data) => {
  if (data.error) return console.error('Error in badge_list_external:', data.error);
  const newBadgeIds = data.badges.map(b => b.id);
  const uid = data.user_id;
  if (!isChanged(lastExternalBadgeIds[uid] || [], newBadgeIds)) return;
  lastExternalBadgeIds[uid] = newBadgeIds;

  externalBadgeContainer.innerHTML = '';
  newBadgeIds.forEach(id => {
    externalBadgeContainer.appendChild(createLoadingBlock('badge-block', 'badgeId', id, uid));
    socket.emit('get_badge_details_external', { id, user_id: uid });
  });
});

socket.on('frame_list_external', (data) => {
  if (data.error) return console.error('Error in frame_list_external:', data.error);
  const newFrameIds = data.frames.map(f => f.id);
  const uid = data.user_id;
  if (!isChanged(lastExternalFrameIds[uid] || [], newFrameIds)) return;
  lastExternalFrameIds[uid] = newFrameIds;

  externalFrameContainer.innerHTML = '';
  data.frames.forEach(frame => {
    const block = createLoadingBlock('frame-block', 'frameId', frame.id, uid);
    block.textContent = 'Loading frame...';
    externalFrameContainer.appendChild(block);
    socket.emit('get_frame_details_external', { id: frame.id, user_id: uid });
  });
});

