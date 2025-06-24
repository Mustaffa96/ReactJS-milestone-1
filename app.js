// State management using modern JS
const state = {
    todos: [],
    filter: 'all'
};

// DOM Elements
const elements = {
    form: document.getElementById('todo-form'),
    input: document.getElementById('todo-input'),
    list: document.getElementById('todo-list'),
    filters: document.querySelector('.filters'),
    tasksCount: document.getElementById('tasks-count'),
    clearCompleted: document.getElementById('clear-completed')
};

// API endpoints (using JSONPlaceholder as a mock API)
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

// Async function to fetch initial todos
const fetchTodos = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch todos');
        const todos = await response.json();
        // Take only first 5 todos and transform them to our format
        state.todos = todos.slice(0, 5).map(({ id, title, completed }) => ({
            id,
            text: title,
            completed
        }));
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
};

// Event Handlers
const handleSubmit = async (e) => {
    e.preventDefault();
    const text = elements.input.value.trim();
    if (!text) return;

    try {
        // Optimistic UI update
        const newTodo = {
            id: Date.now(),
            text,
            completed: false
        };
        
        state.todos = [...state.todos, newTodo];
        renderTodos();
        elements.input.value = '';

        // API call (simulated)
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: text,
                completed: false,
                userId: 1
            }),
            headers: {
                'Content-type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to create todo');
    } catch (error) {
        console.error('Error creating todo:', error);
        // Rollback on error
        state.todos = state.todos.filter(todo => todo.text !== text);
        renderTodos();
    }
};

const handleToggle = async (id) => {
    try {
        // Optimistic UI update
        state.todos = state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        renderTodos();

        // API call (simulated)
        const todo = state.todos.find(t => t.id === id);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ completed: todo.completed }),
            headers: {
                'Content-type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to update todo');
    } catch (error) {
        console.error('Error updating todo:', error);
        // Rollback on error
        state.todos = state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        renderTodos();
    }
};

const handleDelete = async (id) => {
    try {
        // Optimistic UI update
        const deletedTodo = state.todos.find(todo => todo.id === id);
        state.todos = state.todos.filter(todo => todo.id !== id);
        renderTodos();

        // API call (simulated)
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete todo');
    } catch (error) {
        console.error('Error deleting todo:', error);
        // Rollback on error
        state.todos = [...state.todos, deletedTodo];
        renderTodos();
    }
};

const handleFilterChange = (filter) => {
    state.filter = filter;
    renderTodos();
    
    // Update active filter button
    elements.filters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
};

const handleClearCompleted = () => {
    const completedTodos = state.todos.filter(todo => todo.completed);
    state.todos = state.todos.filter(todo => !todo.completed);
    renderTodos();

    // Delete completed todos from API (in parallel)
    Promise.all(
        completedTodos.map(todo =>
            fetch(`${API_URL}/${todo.id}`, { method: 'DELETE' })
        )
    ).catch(error => console.error('Error deleting completed todos:', error));
};

// Render functions using functional programming concepts
const getFilteredTodos = () => {
    switch (state.filter) {
        case 'active':
            return state.todos.filter(todo => !todo.completed);
        case 'completed':
            return state.todos.filter(todo => todo.completed);
        default:
            return state.todos;
    }
};

const createTodoElement = ({ id, text, completed }) => {
    const li = document.createElement('li');
    li.className = `todo-item ${completed ? 'completed' : ''}`;
    
    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''}>
        <span class="todo-text">${text}</span>
        <button class="delete-btn">Delete</button>
    `;

    // Event listeners
    li.querySelector('.todo-checkbox').addEventListener('change', () => handleToggle(id));
    li.querySelector('.delete-btn').addEventListener('click', () => handleDelete(id));

    return li;
};

const renderTodos = () => {
    // Functional approach to rendering
    const filteredTodos = getFilteredTodos();
    const todoElements = filteredTodos.map(createTodoElement);
    
    elements.list.innerHTML = '';
    elements.list.append(...todoElements);

    // Update tasks count
    const activeTodos = state.todos.filter(todo => !todo.completed).length;
    elements.tasksCount.textContent = `${activeTodos} task${activeTodos === 1 ? '' : 's'} left`;
};

// Event listeners
elements.form.addEventListener('submit', handleSubmit);
elements.filters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        handleFilterChange(e.target.dataset.filter);
    }
});
elements.clearCompleted.addEventListener('click', handleClearCompleted);

// Initialize app
fetchTodos();
