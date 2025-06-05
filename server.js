// Importamos los módulos necesarios
const express = require('express');       // Framework para manejar rutas HTTP
const http = require('http');             // Módulo nativo de Node.js para crear un servidor HTTP
const WebSocket = require('ws');          // Librería para manejar conexiones WebSocket
const path = require('path');             // Utilidad para trabajar con rutas de archivos

// Inicializamos una aplicación Express
const app = express();

// Creamos un servidor HTTP basado en la app Express
const server = http.createServer(app);

// Creamos un servidor WebSocket, y lo conectamos al servidor HTTP
const wss = new WebSocket.Server({ server });

// Middleware de Express para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Ruta principal: sirve el archivo HTML (chat) cuando el usuario accede a la raíz del sitio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador de conexiones WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente conectado.');

  // Variable local para guardar el nombre de usuario de este cliente
  let username = null;

  // Enviamos un mensaje inicial al cliente recién conectado
  ws.send(JSON.stringify({
    type: 'info',
    message: 'Conexión establecida. Por favor, ingresa tu nombre.'
  }));

   ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      // Si es un mensaje de tipo 'reset', "reinicia" el usuario
      if (msg.type === 'reset') {
        username = null; // Elimina el usuario registrado
        ws.send(JSON.stringify({
          type: 'reset',
          message: 'El chat y tu sesión han sido reiniciados. Ingresa tu nombre nuevamente.'
        }));
        return;
      }

      // Si es un mensaje de tipo 'login', registramos el nombre de usuario
      if (msg.type === 'login') {
        username = msg.username; // Asignamos el nombre
        console.log(`Usuario registrado como: ${username}`);

        // Enviamos mensaje de bienvenida sólo a este usuario
        ws.send(JSON.stringify({
          type: 'system',
          message: `Hola, ${username}! Puedes empezar a chatear.`
        }));

        return; // Salimos para no procesar este mensaje como chat
      }

      // Si es un mensaje de chat y el usuario ya se registró
      if (msg.type === 'chat' && username) {
        const fullMessage = {
          type: 'chat',
          username,
          message: msg.message
        };

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(fullMessage));
          }
        });
      }

    } catch (e) {
      console.error('Error al procesar mensaje:', e);
    }
  });
  // Cuando el cliente se desconecta del WebSocket
  ws.on('close', () => {
    console.log(`Cliente desconectado (${username ?? 'desconocido'})`);
  });
});

// Iniciamos el servidor HTTP en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
// Exportamos el servidor para que pueda ser usado en pruebas o en otros módulos