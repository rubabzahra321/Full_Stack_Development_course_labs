// Frontend logic: jQuery AJAX calls the Express API and updates the page without reloads.
$(function () {
  let portfolio = { profile: {}, skills: [], education: [], experience: [], projects: [] };
  let activeSection = 'profile';
  let editingId = null;

  $('#currentYear').text(new Date().getFullYear());

  // Load saved portfolio data from MySQL through the backend.
  function loadPortfolio() {
    $.ajax({ url: '/api/portfolio', method: 'GET', dataType: 'json' })
      .done(function (data) {
        portfolio = data;
        renderPortfolio();
        if (!$('#managerBackdrop').prop('hidden')) renderManager();
      })
      .fail(function (xhr) { showToast(xhr.responseJSON?.message || 'Could not load portfolio. Is the server running?'); });
  }

  // Safely put text into the page instead of treating user input as HTML.
  function safeText(value) { return $('<div>').text(value == null ? '' : String(value)).html(); }
  function renderPortfolio() {
    const p = portfolio.profile || {};
    $('#heroName').text(p.full_name || 'Your Name');
    $('#heroHeadline').text(p.headline || 'Your professional headline');
    $('#heroAbout, #aboutText').text(p.about || 'Add a short introduction in Manage Portfolio.');
    $('#heroLocation').html('<i class="bi bi-geo-alt"></i> ' + safeText(p.location || 'Add your location'));
    $('#githubLink').attr('href', p.github || '#').toggle(!!p.github);
    $('#linkedinLink').attr('href', p.linkedin || '#').toggle(!!p.linkedin);
    $('#emailButton').attr('href', p.email ? 'mailto:' + p.email : '#');
    $('#contactEmail').text(p.email || 'Add your email in Manage Portfolio to let people contact you.');
    if (p.image_url) {
      $('#profileImage').attr('src', p.image_url).prop('hidden', false);
      $('#portraitPlaceholder').prop('hidden', true);
    } else {
      $('#profileImage').prop('hidden', true).attr('src', '');
      $('#portraitPlaceholder').prop('hidden', false);
    }

    // Display skill chips.
    const skillsHtml = portfolio.skills.map(skill => `<div class="skill-pill"><i class="bi bi-check2-circle"></i><span>${safeText(skill.name)}<span class="skill-category">${safeText(skill.category || 'Technical')}</span></span></div>`).join('');
    $('#skillsList').html(skillsHtml || '<div class="empty-state">No skills yet. Add them using Manage Portfolio.</div>');

    // Display education entries.
    const educationHtml = portfolio.education.map(item => `<article class="timeline-card"><div class="timeline-icon"><i class="bi bi-mortarboard"></i></div><div><h3>${safeText(item.degree)}</h3><p>${safeText(item.institution)}</p><p>${safeText(item.details)}</p></div><span class="period">${safeText(item.period)}</span></article>`).join('');
    $('#educationList').html(educationHtml || '<div class="empty-state">Education details will appear here.</div>');

    // Display experience cards.
    const experienceHtml = portfolio.experience.map(item => `<article class="experience-card"><span class="period">${safeText(item.period)}</span><h3>${safeText(item.role)}</h3><p>${safeText(item.organization)}</p><p>${safeText(item.details)}</p></article>`).join('');
    $('#experienceList').html(experienceHtml || '<div class="empty-state">Experience details will appear here.</div>');

    // Display project cards and technology tags.
    const projectsHtml = portfolio.projects.map((project, index) => {
      const tags = (project.technologies || '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => `<span class="tag">${safeText(tag)}</span>`).join('');
      const projectLink = project.project_url ? `<a class="project-link" href="${safeText(project.project_url)}" target="_blank" rel="noreferrer">View project <i class="bi bi-arrow-up-right"></i></a>` : '';
      return `<article class="project-card"><div class="project-top"><span class="project-number">0${index + 1}</span><i class="bi bi-braces project-symbol"></i></div><div class="project-body"><h3>${safeText(project.title)}</h3><p>${safeText(project.description)}</p><div class="tag-list">${tags}</div>${projectLink}</div></article>`;
    }).join('');
    $('#projectsList').html(projectsHtml || '<div class="empty-state">Add your projects using Manage Portfolio.</div>');
  }

  function showToast(message) {
    $('#toast').text(message).addClass('show');
    setTimeout(() => $('#toast').removeClass('show'), 2800);
  }
  function openManager() {
    $('#managerBackdrop').prop('hidden', false);
    $('body').addClass('modal-open');
    renderManager();
  }
  function closeManager() {
    $('#managerBackdrop').prop('hidden', true);
    $('body').removeClass('modal-open');
  }
  $('#openManager, .manage-shortcut').on('click', openManager);
  $('#closeManager').on('click', closeManager);
  $('#managerBackdrop').on('click', function (event) { if (event.target === this) closeManager(); });
  $('#menuToggle').on('click', () => $('#mainNav').toggleClass('open'));
  $('#mainNav a').on('click', () => $('#mainNav').removeClass('open'));
  $('#managerTabs').on('click', '.tab-button', function () {
    activeSection = $(this).data('section');
    editingId = null;
    renderManager();
  });

  const sectionFields = {
    skills: [
      { name: 'name', label: 'Skill name', required: true },
      { name: 'category', label: 'Category', placeholder: 'Frontend, AI, Database…' }
    ],
    education: [
      { name: 'institution', label: 'Institution', required: true },
      { name: 'degree', label: 'Degree / qualification', required: true },
      { name: 'period', label: 'Period', placeholder: '2024 – Present' },
      { name: 'details', label: 'Details', type: 'textarea', full: true }
    ],
    experience: [
      { name: 'role', label: 'Role / position', required: true },
      { name: 'organization', label: 'Organization', required: true },
      { name: 'period', label: 'Period', placeholder: '2026 – Present' },
      { name: 'details', label: 'Responsibilities / details', type: 'textarea', full: true }
    ],
    projects: [
      { name: 'title', label: 'Project title', required: true },
      { name: 'technologies', label: 'Technologies', placeholder: 'Python, Streamlit, Gemini' },
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'project_url', label: 'Project URL (optional)', full: true, placeholder: 'https://…' }
    ]
  };

  function fieldMarkup(field, value = '') {
    const required = field.required ? 'required' : '';
    const full = field.full ? 'full' : '';
    const placeholder = field.placeholder ? `placeholder="${safeText(field.placeholder)}"` : '';
    const input = field.type === 'textarea'
      ? `<textarea name="${field.name}" ${required} ${placeholder}>${safeText(value)}</textarea>`
      : `<input name="${field.name}" value="${safeText(value)}" ${required} ${placeholder}>`;
    return `<div class="form-field ${full}"><label>${field.label}${field.required ? ' *' : ''}</label>${input}</div>`;
  }

  function renderManager() {
    $('#managerTabs .tab-button').removeClass('active').filter(`[data-section="${activeSection}"]`).addClass('active');
    $('#managerMessage').prop('hidden', true).removeClass('error').text('');
    if (activeSection === 'profile') renderProfileForm();
    else renderSectionForm();
    renderManagerItems();
  }

  function renderProfileForm() {
    const p = portfolio.profile || {};
    $('#managerFormArea').html(`<form id="profileForm" class="form-grid">
      ${fieldMarkup({name:'full_name',label:'Full name',required:true},p.full_name)}
      ${fieldMarkup({name:'headline',label:'Professional headline',required:true},p.headline)}
      ${fieldMarkup({name:'email',label:'Email'},p.email)}
      ${fieldMarkup({name:'location',label:'Location'},p.location)}
      ${fieldMarkup({name:'github',label:'GitHub URL'},p.github)}
      ${fieldMarkup({name:'linkedin',label:'LinkedIn URL'},p.linkedin)}
      ${fieldMarkup({name:'about',label:'About / introduction',type:'textarea',full:true},p.about)}
      <div class="form-field full"><label>Profile image</label><input type="file" id="profileImageFile" accept="image/*"><span class="file-help">Choose an image up to 3 MB. JPG, PNG or WebP is recommended.</span></div>
      <div class="form-actions full"><button class="button" type="submit"><i class="bi bi-check2"></i> Save profile</button><button class="button-secondary" type="button" id="uploadImageButton">Upload image</button></div>
    </form>`);

    $('#profileForm').on('submit', function (event) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(this).entries());
      $.ajax({ url: '/api/profile', method: 'PUT', contentType: 'application/json', data: JSON.stringify(values) })
        .done(response => { showToast(response.message); loadPortfolio(); })
        .fail(xhr => showToast(xhr.responseJSON?.message || 'Could not save profile.'));
    });
    $('#uploadImageButton').on('click', function () {
      const file = $('#profileImageFile')[0].files[0];
      if (!file) return showToast('Please choose an image first.');
      const formData = new FormData();
      formData.append('profileImage', file);
      $.ajax({ url: '/api/profile/image', method: 'POST', data: formData, processData: false, contentType: false })
        .done(response => { showToast(response.message); loadPortfolio(); })
        .fail(xhr => showToast(xhr.responseJSON?.message || 'Image upload failed.'));
    });
  }

  function renderSectionForm(item = null) {
    const fields = sectionFields[activeSection];
    const title = item ? 'Update item' : `Add ${activeSection.slice(0, -1)}`;
    const fieldsHtml = fields.map(field => fieldMarkup(field, item ? item[field.name] : '')).join('');
    $('#managerFormArea').html(`<form id="sectionForm"><h3 class="form-heading">${title}</h3><div class="form-grid">${fieldsHtml}<div class="form-actions full"><button class="button" type="submit">${item ? 'Save changes' : 'Add item'}</button>${item ? '<button class="button-secondary" type="button" id="cancelEdit">Cancel edit</button>' : ''}</div></div></form>`);
    $('#sectionForm').on('submit', function (event) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(this).entries());
      const isEdit = Boolean(editingId);
      $.ajax({ url: `/api/${activeSection}${isEdit ? '/' + editingId : ''}`, method: isEdit ? 'PUT' : 'POST', contentType: 'application/json', data: JSON.stringify(values) })
        .done(response => { showToast(response.message); editingId = null; loadPortfolio(); })
        .fail(xhr => showToast(xhr.responseJSON?.message || 'Could not save item.'));
    });
    $('#cancelEdit').on('click', () => { editingId = null; renderManager(); });
  }

  function renderManagerItems() {
    if (activeSection === 'profile') {
      $('#managerItems').html('<div class="empty-state">Your profile is a single record. Save changes above to update it. Skills, education, experience and projects can each have multiple records.</div>');
      return;
    }
    const items = portfolio[activeSection] || [];
    const titleField = { skills: 'name', education: 'degree', experience: 'role', projects: 'title' }[activeSection];
    const detailField = { skills: 'category', education: 'institution', experience: 'organization', projects: 'technologies' }[activeSection];
    const html = items.map(item => `<div class="manager-item"><div><strong>${safeText(item[titleField])}</strong><small>${safeText(item[detailField] || '')}</small></div><div class="item-actions"><button type="button" data-edit-id="${item.id}"><i class="bi bi-pencil"></i> Edit</button><button class="delete-button" type="button" data-delete-id="${item.id}"><i class="bi bi-trash3"></i> Delete</button></div></div>`).join('');
    $('#managerItems').html(html || '<div class="empty-state">No items yet. Use the form above to add your first item.</div>');
    $('#managerItems').off('click', '[data-edit-id]').on('click', '[data-edit-id]', function () {
      editingId = Number($(this).attr('data-edit-id'));
      const item = items.find(entry => entry.id === editingId);
      if (item) renderSectionForm(item);
      $('#managerFormArea')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#managerItems').off('click', '[data-delete-id]').on('click', '[data-delete-id]', function () {
      const id = Number($(this).attr('data-delete-id'));
      const item = items.find(entry => entry.id === id);
      if (!confirm(`Delete "${item ? item[titleField] : 'this item'}"? This cannot be undone.`)) return;
      $.ajax({ url: `/api/${activeSection}/${id}`, method: 'DELETE' })
        .done(response => { showToast(response.message); loadPortfolio(); })
        .fail(xhr => showToast(xhr.responseJSON?.message || 'Could not delete item.'));
    });
  }

  // Initial page load.
  loadPortfolio();
});
