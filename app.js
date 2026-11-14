const STORAGE_KEY = 'task-manager-data';

let tasks = [];
let errorTimeout = null;

const errorMessage = document.getElementById('errorMessage');

function showError() {
  if (errorMessage) errorMessage.classList.add('visible');
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    hideError();
    errorTimeout = null;
  }, 3000);
}

function hideError() {
  if (errorMessage) errorMessage.classList.remove('visible');
  if (errorTimeout) {
    clearTimeout(errorTimeout);
    errorTimeout = null;
  }
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        tasks = parsed;
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки задач из localStorage:', e);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Ошибка сохранения задач в localStorage:', e);
  }
}

function createTaskElement(task, isNew = false) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''} ${isNew ? 'task-item-new' : ''}`;
  li.setAttribute('data-id', task.id);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-button';
  deleteBtn.setAttribute('aria-label', 'Удалить задачу');
  deleteBtn.title = 'Удалить';
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

function updateTaskCount() {
  const countEl = document.getElementById('taskCount');
  if (countEl) {
    countEl.textContent = tasks.length > 0 ? tasks.length.toString() : '';
    countEl.style.display = tasks.length > 0 ? 'inline-block' : 'none';
  }
}

function renderTasks() {
  const listEl = document.getElementById('taskList');
  const emptyEl = document.getElementById('emptyState');

  listEl.innerHTML = '';

  if (tasks.length === 0) {
    emptyEl.classList.add('visible');
  } else {
    emptyEl.classList.remove('visible');
    tasks.forEach(task => {
      listEl.appendChild(createTaskElement(task));
    });
  }

  updateTaskCount();
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    showError();
    return false;
  }

  hideError();

  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text: trimmed,
    completed: false,
  };

  tasks.unshift(task);
  saveTasks();

  const listEl = document.getElementById('taskList');
  const emptyEl = document.getElementById('emptyState');

  emptyEl.classList.remove('visible');

  const li = createTaskElement(task, true);
  listEl.insertBefore(li, listEl.firstChild);

  updateTaskCount();

  const scrollArea = document.querySelector('.task-scroll-area');
  if (scrollArea) {
    scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return true;
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();

  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) {
    li.classList.toggle('completed', task.completed);

    const checkbox = li.querySelector('.task-checkbox');
    if (checkbox) {
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную');
    }
  }
}

function deleteTask(id) {
  const li = document.querySelector(`li[data-id="${id}"]`);

  if (li) {
    li.classList.add('task-item-deleting');

    setTimeout(() => {
      if (li.parentNode) {
        li.remove();
      }

      tasks = tasks.filter(t => t.id !== id);
      saveTasks();

      if (tasks.length === 0) {
        document.getElementById('emptyState').classList.add('visible');
      }

      updateTaskCount();
    }, 250);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

function init() {
  const addForm = document.getElementById('addForm');
  const addInput = document.getElementById('addInput');

  loadTasks();
  renderTasks();

  addInput.addEventListener('input', hideError);

  addInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = addInput.value;
      if (addTask(value)) {
        addInput.value = '';
      }
      addInput.focus();
    }
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = addInput.value;
    if (addTask(value)) {
      addInput.value = '';
    }
    addInput.focus();
  });
}

init();
