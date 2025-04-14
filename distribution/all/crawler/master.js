const { Server } = require('socket.io');
const http = require('http');

const visited = new Set();
const inProgress = new Set();

// List of URLs waiting to be assigned to a worker. It starts with a seed URL.
const urlQueue = ['https://en.wikipedia.org/wiki/Schache']; 

// Number of pages that we want to be crawled
const MAX_PAGES = 300;

const server = http.createServer(); // create HTTP server that socket.io can attach to

// Initialize socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

io.on('connection', (socket) => {
  console.log(`Worker connected: ${socket.id}`);

  socket.on('ready-for-url', () => {
    while (urlQueue.length > 0 && visited.size < MAX_PAGES) {
      const nextURL = urlQueue.shift();
      if (!visited.has(nextURL) && !inProgress.has(nextURL)) {
        inProgress.add(nextURL);
        socket.emit('url', nextURL); // send worker next URL to be crawled
        return;
      }
    }
    socket.emit('no-more-work');
  });

  // Event run when worker finishes crawling a single URL
  socket.on('result', ({ url, html, links }) => {
    visited.add(url);
    inProgress.delete(url);

    for (const link of links) {
      if (!visited.has(link) && !inProgress.has(link)) {
        urlQueue.push(link);
      }
    }

    console.log(`Visited ${visited.size} / ${MAX_PAGES}`);
    if (visited.size >= MAX_PAGES) {
      console.log('Reached max pages, telling workers to stop...');
      io.emit('no-more-work');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Worker disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Master server listening on port ${PORT}`);
});
