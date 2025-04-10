/**
 * Antonio's Overleaf Clone - Server
 * 
 * A real-time collaborative LaTeX editor with live compilation
 * and PDF preview functionality.
 */

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

// Configuration
const PORT = process.env.PORT || 3000;
const PROJECTS_DIR = path.join(__dirname, 'projects');
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure directories exist
fs.ensureDirSync(PROJECTS_DIR);
fs.ensureDirSync(TEMP_DIR);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Create a new LaTeX project
 * 
 * Generates a unique ID, creates a directory, and initializes
 * with a template LaTeX document.
 */
app.post('/api/projects', (req, res) => {
  try {
    const projectId = uuidv4();
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    fs.ensureDirSync(projectDir);
    
    const initialContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{hyperref}

\\title{\\textcolor{teal}{\\Huge Antonio's \\LaTeX{} Document}}
\\author{Collaborative Team}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
  This is a collaborative \\LaTeX{} document created with Antonio's Overleaf Clone.
  Edit this document to get started with your project!
\\end{abstract}

\\section{Introduction}
Welcome to your new \\LaTeX{} document! This template includes some basic formatting
and structure to help you get started.

\\section{Features}
\\begin{itemize}
  \\item Real-time collaboration with multiple users
  \\item Live PDF preview
  \\item Built-in LaTeX compiler
  \\item Easy document sharing
\\end{itemize}

\\section{Mathematical Example}
The quadratic formula is given by:
\\begin{equation}
  x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\end{equation}

\\section{How to Use}
\\begin{enumerate}
  \\item Edit the document in the editor panel
  \\item Click the "Compile" button to update the PDF preview
  \\item Share your project ID with collaborators
  \\item Download the PDF when you're ready
\\end{enumerate}

\\section{Conclusion}
We hope you enjoy using Antonio's Overleaf Clone for your \\LaTeX{} documents.
Happy typing!

\\end{document}`;
    
    fs.writeFileSync(path.join(projectDir, 'main.tex'), initialContent);
    
    // Log project creation
    console.log(`Created new project: ${projectId}`);
    
    res.json({
      success: true,
      projectId,
      content: initialContent
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get a specific project's content
 * 
 * Retrieves the LaTeX source code for the requested project
 */
app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const projectDir = path.join(PROJECTS_DIR, projectId);
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Project not found: ${projectId}`);
    return res.status(404).json({ error: 'Project not found' });
  }
  
  try {
    const content = fs.readFileSync(path.join(projectDir, 'main.tex'), 'utf8');
    
    res.json({
      success: true,
      projectId,
      content
    });
  } catch (error) {
    console.error(`Error getting project ${projectId}:`, error);
    res.status(500).json({ error: 'Failed to read project' });
  }
});

/**
 * Compile LaTeX and get the PDF
 * 
 * Runs the LaTeX compiler on the project and returns the generated PDF
 */
app.get('/api/projects/:id/pdf', (req, res) => {
  const projectId = req.params.id;
  const projectDir = path.join(PROJECTS_DIR, projectId);
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Project not found for PDF: ${projectId}`);
    return res.status(404).json({ error: 'Project not found' });
  }
  
  // Run the LaTeX compiler
  const cmd = `cd "${projectDir}" && latexmk -pdf -interaction=nonstopmode main.tex`;
  
  exec(cmd, (error, stdout, stderr) => {
    // Check if compilation failed and no PDF was produced
    if (error && !fs.existsSync(path.join(projectDir, 'main.pdf'))) {
      console.error(`LaTeX compilation error for ${projectId}:`, stderr);
      return res.status(500).json({ 
        error: 'Compilation failed', 
        details: stderr 
      });
    }
    
    // Send the PDF file
    const pdfPath = path.join(projectDir, 'main.pdf');
    res.sendFile(pdfPath);
  });
});

// Socket.IO handlers for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Track active users by project
  const activeProjects = {};
  
  // Join a project room
  socket.on('join', ({ projectId, username }) => {
    console.log(`User ${username} (${socket.id}) joined project ${projectId}`);
    
    // Join the Socket.IO room for this project
    socket.join(projectId);
    
    // Store user info
    socket.projectId = projectId;
    socket.username = username;
    
    // Track active users in this project
    if (!activeProjects[projectId]) {
      activeProjects[projectId] = [];
    }
    activeProjects[projectId].push({ id: socket.id, username });
    
    // Notify other users in the project
    socket.to(projectId).emit('user-joined', {
      userId: socket.id,
      username
    });
  });
  
  // Handle document content changes
  socket.on('content-change', ({ projectId, content }) => {
    console.log(`Content change in project ${projectId} from ${socket.username}`);
    
    // Save the changes to disk
    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (fs.existsSync(projectDir)) {
      fs.writeFileSync(path.join(projectDir, 'main.tex'), content);
    }
    
    // Broadcast the changes to other users in the project
    socket.to(projectId).emit('content-change', { content });
  });
  
  // Handle compile requests
  socket.on('compile', ({ projectId }) => {
    console.log(`Compile request for project ${projectId} from ${socket.username}`);
    
    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      socket.emit('compilation-result', { 
        success: false, 
        error: 'Project not found' 
      });
      return;
    }
    
    // Run the LaTeX compiler
    const cmd = `cd "${projectDir}" && latexmk -pdf -interaction=nonstopmode main.tex`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error && !fs.existsSync(path.join(projectDir, 'main.pdf'))) {
        console.error(`LaTeX compilation error for ${projectId}:`, stderr);
        socket.emit('compilation-result', { 
          success: false, 
          error: stderr 
        });
        return;
      }
      
      // Notify the user who requested compilation
      socket.emit('compilation-result', { success: true });
      
      // Notify all users in the project that compilation is complete
      io.to(projectId).emit('compilation-complete');
    });
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username} (${socket.id})`);
    
    // Remove user from active projects tracking
    if (socket.projectId && activeProjects[socket.projectId]) {
      const index = activeProjects[socket.projectId].findIndex(u => u.id === socket.id);
      if (index !== -1) {
        activeProjects[socket.projectId].splice(index, 1);
      }
      
      // Notify other users in the project
      socket.to(socket.projectId).emit('user-left', {
        userId: socket.id,
        username: socket.username
      });
    }
  });
});

// Start the server
http.listen(PORT, '0.0.0.0', () => {
  console.log(`\n-------------------------------------------------------------------------`);
  console.log(`| Antonio's Overleaf Clone server running on http://localhost:${PORT}     |`);
  console.log(`| Other users on your network can connect using your local IP address |`);
  console.log(`-------------------------------------------------------------------------\n`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
  console.log(`Temp directory: ${TEMP_DIR}\n`);
});