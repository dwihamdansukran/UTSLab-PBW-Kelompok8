// Selectors
const API = "https://api-todo-list-pbw.vercel.app";
const toDoInput = document.querySelector('.todo-input');
const toDoBtn = document.querySelector('.todo-btn');
const toDoList = document.querySelector('.todo-list');
const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

// Event Listeners
toDoBtn.addEventListener('click', addToDo);
toDoList.addEventListener('click', handleTodoAction);
document.addEventListener("DOMContentLoaded", initializeTodos);
standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

// Check if one theme has been set previously and apply it (or std theme if not found):
let savedTheme = localStorage.getItem('savedTheme');
savedTheme === null ?
    changeTheme('standard')
    : changeTheme(localStorage.getItem('savedTheme'));

// Get user token - Replace this with your actual token retrieval method
function getAuthToken() {
  // This should return the user's authentication token
  return localStorage.getItem('authToken');
}

// API Functions
async function fetchTodos() {
  try {
    const response = await fetch(`${API}/todo/getAllTodos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.status}`);
    }
    
    const data = await response.json();
    return data.todos || data; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error fetching todos:", error);
    // Fallback to local storage if API fails
    return JSON.parse(localStorage.getItem('todos') || '[]');
  }
}

async function createTodo(todoText) {
  try {
    const response = await fetch(`${API}/todo/createTodo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ text: todoText })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create todo: ${response.status}`);
    }
    
    const data = await response.json();
    return data.todo || data; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error creating todo:", error);
    // Fallback to local storage
    let todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const newTodo = { id: Date.now(), text: todoText, onCheckList: false };
    todos.push(newTodo);
    localStorage.setItem('todos', JSON.stringify(todos));
    return newTodo;
  }
}

async function updateTodo(todoId, todoText, onCheckList) {
  try {
    const response = await fetch(`${API}/todo/updateTodo/${todoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        text: todoText,
        onCheckList: onCheckList
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.status}`);
    }
    
    const data = await response.json();
    return data.todo || data;
  } catch (error) {
    console.error("Error updating todo:", error);
    return { id: todoId, text: todoText, onCheckList: onCheckList };
  }
}

async function deleteTodo(todoId) {
  try {
    const response = await fetch(`${API}/todo/deleteTodo/${todoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    // Fallback to local removal
    let todos = JSON.parse(localStorage.getItem('todos') || '[]');
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    if (todoIndex !== -1) {
      todos.splice(todoIndex, 1);
      localStorage.setItem('todos', JSON.stringify(todos));
    }
    return false;
  }
}

// Functions
async function addToDo(event) {
    // Prevents form from submitting / Prevents form from reloading
    event.preventDefault();

    // Validate input
    if (toDoInput.value === '') {
        alert("You must write something!");
        return;
    }
    
    try {
        // Create todo via API
        const newTodo = await createTodo(toDoInput.value);
        
        // Render the new todo
        renderTodoItem(newTodo);
        
        // Clear input field
        toDoInput.value = '';
    } catch (error) {
        console.error("Error adding todo:", error);
        alert("Failed to add todo. Please try again.");
    }
}   

async function handleTodoAction(event) {
    const item = event.target;
    const todoElement = item.closest('.todo');
    
    if (!todoElement) return;
    
    const todoId = todoElement.dataset.id;
    const todoText = todoElement.querySelector('.todo-item').innerText;
    
    // Delete todo
    if (item.classList.contains('delete-btn') || item.closest('.delete-btn')) {
        try {
            // Add falling animation
            todoElement.classList.add("fall");
            
            // Delete from API
            await deleteTodo(todoId);
            
            // Remove from DOM after animation
            todoElement.addEventListener('transitionend', function() {
                todoElement.remove();
            });
        } catch (error) {
            console.error("Error deleting todo:", error);
            alert("Failed to delete todo. Please try again.");
        }
    }
    
    // Toggle completed status
    if (item.classList.contains('check-btn') || item.closest('.check-btn')) {
        try {
            const isCompleted = !todoElement.classList.contains("completed");
            todoElement.classList.toggle("completed");
            
            // Update in API
            await updateTodo(todoId, todoText, isCompleted);
        } catch (error) {
            console.error("Error updating todo:", error);
            // Revert the UI change if the API call fails
            todoElement.classList.toggle("completed");
            alert("Failed to update todo status. Please try again.");
        }
    }
}

// Initialize todos from API
async function initializeTodos() {
    try {
        const todos = await fetchTodos();
        
        // Clear existing todos in UI
        toDoList.innerHTML = '';
        
        // Render each todo
        todos.forEach(todo => {
            renderTodoItem(todo);
        });
    } catch (error) {
        console.error("Error initializing todos:", error);
        alert("Failed to load todos. Please refresh the page.");
    }
}

// Render a single todo item
function renderTodoItem(todo) {
    // ToDo DIV
    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add("todo", `${savedTheme}-todo`);
    toDoDiv.dataset.id = todo.id || todo._id; // Store the ID for API operations
    
    if (todo.onCheckList) {
        toDoDiv.classList.add("completed");
    }
  
    // Create LI
    const newToDo = document.createElement('li');
    newToDo.innerText = todo.text || todo;
    newToDo.classList.add('todo-item');
    toDoDiv.appendChild(newToDo);
  
    // Check btn
    const checked = document.createElement('button');
    checked.innerHTML = '<i class="fas fa-check"></i>';
    checked.classList.add("check-btn", `${savedTheme}-button`);
    toDoDiv.appendChild(checked);
    
    // Delete btn
    const deleted = document.createElement('button');
    deleted.innerHTML = '<i class="fas fa-trash"></i>';
    deleted.classList.add("delete-btn", `${savedTheme}-button`);
    toDoDiv.appendChild(deleted);
  
    // Append to list
    toDoList.appendChild(toDoDiv);
}

// Change theme function (unchanged)
function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');

    document.body.className = color;
    // Change blinking cursor for darker theme:
    color === 'darker' ? 
        document.getElementById('title').classList.add('darker-title')
        : document.getElementById('title').classList.remove('darker-title');

    document.querySelector('input').className = `${color}-input`;
    // Change todo color without changing their status (completed or not):
    document.querySelectorAll('.todo').forEach(todo => {
        Array.from(todo.classList).some(item => item === 'completed') ? 
            todo.className = `todo ${color}-todo completed`
            : todo.className = `todo ${color}-todo`;
    });
    // Change buttons color according to their type (todo, check or delete):
    document.querySelectorAll('button').forEach(button => {
        Array.from(button.classList).some(item => {
            if (item === 'check-btn') {
              button.className = `check-btn ${color}-button`;  
            } else if (item === 'delete-btn') {
                button.className = `delete-btn ${color}-button`; 
            } else if (item === 'todo-btn') {
                button.className = `todo-btn ${color}-button`;
            }
        });
    });
}
