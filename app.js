#!/usr/bin/env node

var program  = require('commander'),
    IO       = require('socket.io'),
    IOClient = require('socket.io-client');

var game = require('./game');

program
  .version('0.3.0')
  .option('-l, --local',               'Play locally with a friend')
  .option('-s, --single',              'Play against the computer')
  .option('-m, --multiplayer',         'Create a multiplayer server')
  .option('-c, --connect [host:port]', 'Connect to a multiplayer server')
  .parse(process.argv);

if (program.multiplayer) {
  // Create a socket.io server, wait for connection from someone before starting
  // game. Port is random between 55000 and 56000
  var host   = '127.0.0.1',
      // port   = Math.floor(Math.random() * (56000 - 55000)) + 55000,
      port   = 55001,
      socket = new IO(port);

  console.log('Waiting for player 2 on ' + host + ':' + port);

  socket.on('connection', function (socket) {
    console.log('Player 2 has connected! Starting game...');
    game.start(3, socket, 1);
  });

} else if (program.connect) {
  // Connect to a server

  // Validate inputs
  if (program.connect == true) {
    // Fail if no host and port
    console.log('Error: You must provide a host and port, [host:port]');
    process.exit(0);

  } else if (program.connect.indexOf(':') == -1) {
    // Fail if missing port
    console.log('Error: You must provide a host and port, [host:port]');
    process.exit(0);
  }

  var socket = IOClient.connect('http://' + program.connect);
  console.log('Connecting...');

  // Display message on connect
  socket.on('connect', function () {
    console.log('Connected! Starting game...');
    game.start(3, socket, 2);
  });

} else if (program.single) {
  // Start a game vs the AI
  game.start(1);

} else {
  // Regular PvP play
  // Note that the -l argument is not really parsed because the default is -l
  // If no args are passed, -l is assumed
  game.start(2);
}
