const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "tasks.json");

// Ensure tasks.json exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
}

// Read tasks from JSON file
const readTasks = () => {
  try {
    const data = fs.readFileSync(FILE_PATH, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao ler o arquivo de tarefas:", error.message);
    return [];
  }
};

// Write tasks to JSON file
const writeTasks = (tasks) => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error("Erro ao salvar as tarefas:", error.message);
  }
};

// Generate sequential ID
const generateId = () => {
  const tasks = readTasks();
  const maxId = tasks.reduce((max, task) => Math.max(max, parseInt(task.id)), 0);
  return String(maxId + 1);
};

// Format date for display
const formatDate = (isoDate) => {
  return new Date(isoDate).toLocaleString();
};

// Get CLI arguments
const [,, command, ...args] = process.argv;

switch (command) {
  case "add": {
    if (args.length === 0) {
      console.log("Uso: task-cli add \"Descrição da tarefa\"");
      break;
    }
    
    const tasks = readTasks();
    const newTask = {
      id: generateId(),
      description: args.join(" "),
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tasks.push(newTask);
    writeTasks(tasks);
    console.log(`Tarefa adicionada com sucesso (ID: ${newTask.id})`);
    break;
  }

  case "update": {
    if (args.length < 2) {
      console.log("Uso: task-cli update <id> \"Nova descrição\"");
      break;
    }

    const [id, ...descParts] = args;
    const tasks = readTasks();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      console.log(`Tarefa com ID ${id} não encontrada`);
      break;
    }

    task.description = descParts.join(" ");
    task.updatedAt = new Date().toISOString();
    writeTasks(tasks);
    console.log(`Tarefa ${id} atualizada com sucesso`);
    break;
  }

  case "delete": {
    if (args.length !== 1) {
      console.log("Uso: task-cli delete <id>");
      break;
    }

    const [id] = args;
    let tasks = readTasks();
    const originalLength = tasks.length;
    
    tasks = tasks.filter(t => t.id !== id);
    
    if (tasks.length === originalLength) {
      console.log(`Tarefa com ID ${id} não encontrada`);
      break;
    }

    writeTasks(tasks);
    console.log(`Tarefa ${id} deletada com sucesso`);
    break;
  }

  case "mark-in-progress":
  case "mark-done": {
    if (args.length !== 1) {
      console.log(`Uso: task-cli ${command} <id>`);
      break;
    }

    const [id] = args;
    const tasks = readTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      console.log(`Tarefa com ID ${id} não encontrada`);
      break;
    }

    task.status = command === "mark-in-progress" ? "in-progress" : "done";
    task.updatedAt = new Date().toISOString();
    writeTasks(tasks);
    console.log(`Tarefa ${id} marcada como ${task.status}`);
    break;
  }

  case "list": {
    const tasks = readTasks();
    
    if (tasks.length === 0) {
      console.log("Nenhuma tarefa encontrada");
      break;
    }

    if (args.length === 0) {
      console.log("\nTodas as Tarefas:");
      tasks.forEach(t => {
        console.log(`[${t.id}] ${t.description}`);
        console.log(`    Status: ${t.status}`);
        console.log(`    Criada em: ${formatDate(t.createdAt)}`);
        console.log(`    Atualizada em: ${formatDate(t.updatedAt)}`);
        console.log();
      });
    } else {
      const status = args[0];
      
      if (!["todo", "in-progress", "done"].includes(status)) {
        console.log("Status inválido. Use: todo, in-progress, done");
        break;
      }

      const filteredTasks = tasks.filter(t => t.status === status);

      if (filteredTasks.length === 0) {
        console.log(`Nenhuma tarefa com status "${status}" encontrada`);
        break;
      }

      console.log(`\nTarefas com status "${status}":`);
      filteredTasks.forEach(t => {
        console.log(`[${t.id}] ${t.description}`);
        console.log(`    Criada em: ${formatDate(t.createdAt)}`);
        console.log(`    Atualizada em: ${formatDate(t.updatedAt)}`);
        console.log();
      });
    }
    break;
  }

  default:
    console.log(`
Comandos disponíveis:
  add <descrição>          - Adiciona uma nova tarefa
  update <id> <descrição>  - Atualiza a descrição de uma tarefa
  delete <id>              - Remove uma tarefa
  mark-in-progress <id>    - Marca uma tarefa como em andamento
  mark-done <id>           - Marca uma tarefa como concluída
  list                     - Lista todas as tarefas
  list <status>           - Lista tarefas por status (todo, in-progress, done)
    `);
}