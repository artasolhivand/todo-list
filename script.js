/* ============================================
   State
   ============================================ */
let tasks = [];       // [{ id, text, completed }]
let currentFilter = 'all';

const STORAGE_KEY = 'daily-tasks';

/* ============================================
   Date label
   ============================================ */
document.getElementById('dateLabel').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

/* ============================================
   Persistence
   ============================================ */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Could not save tasks to localStorage', err);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) tasks = JSON.parse(saved);
  } catch (err) {
    console.warn('Could not load tasks from localStorage', err);
  }
}

/* ============================================
   Task actions
   ============================================ */
function addTask(text) {
  tasks.unshift({
    id: 'task-' + Date.now(),
    text: text.trim(),
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

/* ============================================
   Form submit
   ============================================ */
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = taskInput.value.trim();
  if (value === '') return;
  addTask(value);
  taskInput.value = '';
  taskInput.focus();
});

/* ============================================
   Filters
   ============================================ */
const filterRow = document.getElementById('filterRow');

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  render();
});

function getFilteredTasks() {
  if (currentFilter === 'active') return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t => t.completed);
  return tasks;
}

/* ============================================
   Rendering
   ============================================ */
const taskListEl = document.getElementById('taskList');
const emptyStateEl = document.getElementById('emptyState');
const listFooterEl = document.getElementById('listFooter');
const remainingCountEl = document.getElementById('remainingCount');
const statsLineEl = document.getElementById('statsLine');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const CHECK_ICON = `<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function render() {
  const filtered = getFilteredTasks();

  taskListEl.innerHTML = '';
  emptyStateEl.hidden = tasks.length > 0;

  if (tasks.length > 0 && filtered.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = currentFilter === 'completed'
      ? 'No completed tasks yet.'
      : 'No active tasks — nice work.';
  } else if (tasks.length === 0) {
    emptyStateEl.textContent = 'Nothing here. Add your first task above.';
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.innerHTML = `
      <button class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}" aria-label="Toggle task">
        ${CHECK_ICON}
      </button>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="task-delete" data-id="${task.id}" aria-label="Delete task">✕</button>
    `;
    taskListEl.appendChild(li);
  });

  taskListEl.querySelectorAll('.task-checkbox').forEach(btn =>
    btn.addEventListener('click', () => toggleTask(btn.dataset.id)));
  taskListEl.querySelectorAll('.task-delete').forEach(btn =>
    btn.addEventListener('click', () => deleteTask(btn.dataset.id)));

  // Footer + stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const remaining = total - completed;

  listFooterEl.hidden = total === 0;
  remainingCountEl.textContent = `${remaining} task${remaining === 1 ? '' : 's'} left`;
  clearCompletedBtn.hidden = completed === 0;

  statsLineEl.textContent = total === 0
    ? 'No tasks yet'
    : `${completed} of ${total} completed`;

  updateProgressRing(total, completed);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================
   Progress ring
   ============================================ */
const ringProgress = document.getElementById('ringProgress');
const ringLabel = document.getElementById('ringLabel');
const CIRCUMFERENCE = 213.6; // 2 * PI * r(34)

function updateProgressRing(total, completed) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  ringProgress.style.strokeDashoffset = offset;
  ringLabel.textContent = `${percent}%`;
  ringProgress.classList.toggle('complete', percent === 100 && total > 0);
}

/* ============================================
   Clear completed
   ============================================ */
clearCompletedBtn.addEventListener('click', clearCompleted);

/* ============================================
   Init
   ============================================ */
loadTasks();
render();
