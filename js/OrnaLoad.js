const socket = io({ maxHttpBufferSize: 10 * 1024 * 1024 });

const userBadgeContainer = document.getElementById('badges-container-user');
const externalBadgeContainer = document.getElementById('external-badges');
const externalFrameContainer = document.getElementById('external-frames');

let externalUserId = null, frameUserId = null;

function createLoadingBlock(className, dataAttrName, dataAttrValue, userId = null) {
  const div = document.createElement('div');
  div.className = className;
  div.dataset[dataAttrName] = dataAttrValue;
  if (userId) div.dataset.userId = userId;
  div.textContent = 'Loading...';
  return div;
}

function updateBlockWithImage(selector, imageUrl, title, className, dataAttrName = null, dataAttrValue = null) {
  const block = document.querySelector(selector);
  if (!block) return console.warn(`Block not found for selector: ${selector}`);
  block.innerHTML = `<img src="${imageUrl}" class="img-thumbnail ${className}" style="width:auto;height:200px;cursor:pointer;user-select:none;" ${dataAttrName ? `data-${dataAttrName}="${dataAttrValue}"` : ''} title="${title}" loading="lazy">`;
  console.debug(`Rendered image for selector: ${selector}, title: ${title}`);
}

export async function loadUserBadges() {
  socket.emit('get_badge_list');
  console.debug('Emitted: get_badge_list');

  socket.on('badge_list', (data) => {
    if (data.error) return console.error('Error in badge_list:', data.error);
    console.debug('Received badge_list:', data);
    userBadgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      userBadgeContainer.appendChild(createLoadingBlock('badge-block', 'badgeId', badge.id));
      socket.emit('get_badge_details', { id: badge.id });
      console.debug('Emitted: get_badge_details', badge.id);
    });
  });

  socket.on('badge_details', (data) => {
    if (data.error) return console.error('Error in badge_details:', data.error);
    console.debug('Received badge_details:', data);
    updateBlockWithImage(`div.badge-block[data-badge-id='${data.id}']`, data.image_url, `Select badge ${data.id}`, 'badge-select');
  });
}

export async function loadOrna(userId) {
  externalUserId = frameUserId = userId;
  console.debug('Loading external user data for:', userId);

  if (externalUserId) {
    socket.emit('get_badge_list_external', { user_id: externalUserId });
    console.debug('Emitted: get_badge_list_external', externalUserId);
  }

  socket.on('badge_list_external', (data) => {
    if (data.error) return console.error('Error in badge_list_external:', data.error);
    console.debug('Received badge_list_external:', data);
    externalBadgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      externalBadgeContainer.appendChild(createLoadingBlock('badge-block', 'badgeId', badge.id, data.user_id));
      socket.emit('get_badge_details_external', { id: badge.id, user_id: data.user_id });
      console.debug('Emitted: get_badge_details_external', badge.id, data.user_id);
    });
  });

  socket.on('badge_details_external', (data) => {
    if (data.error) return console.error('Error in badge_details_external:', data.error);
    console.debug('Received badge_details_external:', data);
    updateBlockWithImage(`div.badge-block[data-badge-id='${data.id}'][data-user-id='${data.user_id}']`, data.image_url, `Badge ${data.id}`, 'badge-select');
  });

  if (frameUserId) {
    socket.emit('get_frame_list_external', { user_id: frameUserId });
    console.debug('Emitted: get_frame_list_external', frameUserId);
  }

  socket.on('frame_list_external', (data) => {
    if (data.error) return console.error('Error in frame_list_external:', data.error);
    console.debug('Received frame_list_external:', data);
    externalFrameContainer.innerHTML = '';
    data.frames.forEach(frame => {
      const frameBlock = createLoadingBlock('frame-block', 'frameId', frame.id, data.user_id);
      frameBlock.textContent = 'Loading frame...';
      externalFrameContainer.appendChild(frameBlock);
      socket.emit('get_frame_details_external', { id: frame.id, user_id: data.user_id });
      console.debug('Emitted: get_frame_details_external', frame.id, data.user_id);
    });
  });

  socket.on('frame_details_external', (data) => {
    if (data.error) return console.error('Error in frame_details_external:', data.error);
    console.debug('Received frame_details_external:', data);
    updateBlockWithImage(`div.frame-block[data-frame-id='${data.id}'][data-user-id='${data.user_id}']`, data.image_url, `Select frame ${data.name}`, 'frame-select', 'frame-id', data.id);
  });
}
