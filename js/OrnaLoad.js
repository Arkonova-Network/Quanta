(function () {
  // === Variables ===
  const socket = io({ maxHttpBufferSize: 10 * 1024 * 1024 });

  const badgeContainer = document.getElementById('badges-container');
  const externalBadgeContainer = document.getElementById('external-badges');
  const externalUserId = externalBadgeContainer?.getAttribute('name');

  const frameContainer = document.getElementById('external-frames');
  const frameUserId = frameContainer?.getAttribute('useridflame');

  // === Helper Functions ===
  function createLoadingBlock(className, idAttr, idValue, userId = null) {
    const div = document.createElement('div');
    div.className = className;
    div.dataset[idAttr] = idValue;
    if (userId) div.dataset.userId = userId;
    div.textContent = 'Loading...';
    return div;
  }

  function updateBlockWithImage(selector, imageUrl, title, className, dataIdAttr, dataId) {
    const block = document.querySelector(selector);
    if (!block) return;
    block.innerHTML = `
      <img src="${imageUrl}" 
           class="img-thumbnail ${className}" 
           style="width: auto; height: 200px; cursor: pointer; user-select: none;" 
           ${dataIdAttr ? `data-${dataIdAttr}="${dataId}"` : ''}
           title="${title}" 
           loading="lazy">
    `;
  }

  // === Events for Current User's Badges ===
  socket.emit('get_badge_list');

  socket.on('badge_list', function (data) {
    if (data.error) return console.error(data.error);

    badgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      const div = createLoadingBlock('badge-block', 'badgeId', badge.id);
      badgeContainer.appendChild(div);
      socket.emit('get_badge_details', { id: badge.id });
    });
  });

  socket.on('badge_details', function (data) {
    if (data.error) return console.error(data.error);

    updateBlockWithImage(
      `div.badge-block[data-badge-id='${data.id}']`,
      data.image_url,
      `Select badge ${data.id}`,
      'badge-select',
      null,
      null
    );
  });

  // === External Badges for Another User ===
  if (externalUserId) {
    socket.emit('get_badge_list_external', { user_id: externalUserId });
  }

  socket.on('badge_list_external', function (data) {
    if (data.error) return console.error(data.error);

    externalBadgeContainer.innerHTML = '';
    data.badges.forEach(badge => {
      const div = createLoadingBlock('badge-block', 'badgeId', badge.id, data.user_id);
      externalBadgeContainer.appendChild(div);
      socket.emit('get_badge_details_external', {
        id: badge.id,
        user_id: data.user_id
      });
    });
  });

  socket.on('badge_details_external', function (data) {
    if (data.error) return console.error(data.error);

    updateBlockWithImage(
      `div.badge-block[data-badge-id='${data.id}'][data-user-id='${data.user_id}']`,
      data.image_url,
      `Badge ${data.id}`,
      'badge-select',
      null,
      null
    );
  });

  // === External Frames for Another User ===
  if (frameUserId) {
    socket.emit('get_frame_list_external', { user_id: frameUserId });
  }

  socket.on('frame_list_external', function (data) {
    if (data.error) return console.error(data.error);

    frameContainer.innerHTML = '';
    data.frames.forEach(frame => {
      const div = createLoadingBlock('frame-block', 'frameId', frame.id, data.user_id);
      div.textContent = 'Loading frame...';
      frameContainer.appendChild(div);
      socket.emit('get_frame_details_external', {
        id: frame.id,
        user_id: data.user_id
      });
    });
  });

  socket.on('frame_details_external', function (data) {
    if (data.error) return console.error(data.error);

    updateBlockWithImage(
      `div.frame-block[data-frame-id='${data.id}'][data-user-id='${data.user_id}']`,
      data.image_url,
      `Select frame ${data.name}`,
      'frame-select',
      'frame-id',
      data.id
    );
  });

})();
