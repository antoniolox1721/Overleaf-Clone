# Collaborative LaTeX Editor

A real-time collaborative LaTeX editor that allows multiple users on the same network to work together on LaTeX documents with live compilation and PDF preview.

## Features

- **Real-time collaboration**: Multiple users can edit the same document simultaneously
- **Live LaTeX compilation**: Integrated LaTeX compilation with PDF preview
- **User awareness**: See who's editing the document and their cursor positions
- **Shareable projects**: Easily share project IDs with collaborators
- **Downloadable PDFs**: Generate and download final PDFs
- **Network-accessible**: Can be accessed by any device on the same network

## Prerequisites

Before setting up the collaborative LaTeX editor, you need to have the following installed:

1. **Node.js** (v14 or later) - For running the server
2. **npm** (Node Package Manager) - For installing dependencies
3. **LaTeX distribution** - One of the following:
   - **TeX Live** (recommended for Linux/macOS) - Full LaTeX distribution
   - **MiKTeX** (recommended for Windows) - Full LaTeX distribution
4. **latexmk** - A build utility for LaTeX (usually included with TeX Live)

## Installation

1. **Clone or download this repository**

2. **Install Node.js dependencies**

   Navigate to the project directory and run:
   ```bash
   npm install
   ```

   This will install all required dependencies listed in the package.json:
   - express
   - socket.io
   - body-parser
   - fs-extra
   - uuid
   - express-session
   - cookie-parser
   - diff-match-patch

3. **Create necessary directories**

   The server needs two directories to function:
   ```bash
   mkdir projects
   mkdir temp
   mkdir public
   ```

4. **Move the frontend file**

   Move the `index.html` file to the `public` directory:
   ```bash
   cp index.html public/
   ```

## Running the Server

1. **Start the server**

   ```bash
   node server.js
   ```

   The server will start and listen on port 3000 by default. You'll see output like:
   ```
   Collaborative LaTeX Editor server running on http://localhost:3000
   Other users on your network can connect using your local IP address
   ```

2. **Access the editor**

   Open your web browser and navigate to:
   - On your local machine: `http://localhost:3000`
   - From other devices on your network: `http://<your-local-ip>:3000`

## Using the Editor

### Creating a New Project

1. Enter your name in the username field
2. Click "Create New Project"
3. Click "Start Editing"
4. You'll be given a unique Project ID that you can share with collaborators

### Joining an Existing Project

1. Enter your name in the username field
2. Click "Join Existing Project"
3. Enter the Project ID that was shared with you
4. Click "Start Editing"

### Editing and Compiling

- The editor supports standard LaTeX syntax with syntax highlighting
- Click the "Compile" button to compile your document and view the PDF preview
- Any errors in compilation will be displayed in a modal window
- You can download the compiled PDF using the "Download PDF" button

### Collaboration

- You can see all active users in the users panel at the top
- Each user's cursor position is visible in the editor
- Changes by other users appear in real-time
- Use the "Share" button to copy a direct link to the project

## Customization Options

### Changing the Port

Edit the `PORT` constant in `server.js` to change the port (default is 3000).

### Customizing LaTeX Template

The initial LaTeX template can be modified in the `initialContent` variable in the `/api/projects` route.

### Changing the Theme

The editor uses CodeMirror with the Dracula theme by default. You can change it by modifying the CSS file reference and theme option in `index.html`.

## Troubleshooting

### Compilation Issues

If you encounter LaTeX compilation errors:

1. Check that your LaTeX distribution is installed correctly
2. Ensure `latexmk` is available in your system PATH
3. Look at the error message in the compilation error modal for details
4. Verify any packages you're using are installed in your LaTeX distribution

### Connection Issues

If users can't connect to your server:

1. Make sure your firewall allows connections on the port you're using (default: 3000)
2. Verify that users are connecting to the correct IP address
3. Check that your router allows local network communication

## Advanced Configuration

### Using Behind a Reverse Proxy

If you want to run the collaborative LaTeX editor behind a reverse proxy like Nginx or Apache:

1. Configure your reverse proxy to forward requests to the editor's port
2. Set up WebSocket forwarding for real-time collaboration
3. Consider using HTTPS for secure connections

### Running as a Service

For production use, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name latex-editor
pm2 save
```

## How It Works

The collaborative LaTeX editor combines several technologies:

- **Node.js and Express**: Backend server
- **Socket.IO**: Real-time communication between users
- **CodeMirror**: Feature-rich text editor with syntax highlighting
- **diff-match-patch**: Google's algorithm for tracking document changes
- **latexmk**: LaTeX compilation utility

When users make changes, the editor calculates the difference (diff) between the previous and new document state, sends only this diff to the server, which then broadcasts it to all other connected users. This approach minimizes data transfer and allows for efficient real-time collaboration.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to submit pull requests to improve the collaborative LaTeX editor.
