'use strict';

/**
 * The game itself. Handles single player, 2 player local, and 2 player server
 */

var blessed = require('blessed');

var Board = require('./board'),
    AI    = require('./ai');

/**
 * Starts the game
 *
 * @param {int}    game_type  1 = single player vs cpu
 *                            2 = 2 player local
 *                            3 = 2 player server
 * @param {Socket} connection
 *   The connection between the two players. This object is ignored if game_type
 *   is 1 or 2. Otherwise, it sends and receives events between the players.
 * @param {int}    player     The number of the player. This number is ignored
 *   if game_type is 1 or 2. Otherwise, 1 == o and 2 == x
 */
module.exports.start = function (game_type, connection, player) {

  // Boolean representing if player is o (see @param player)
  var is_o;
  if (game_type == 3)
    is_o = (player == 1);
  else
    is_o = true;

  // Manages the backend of the board, e.g. who won/lost a mini board
  var game = new Board();

  var o_turn = (Math.random() > 0.5) ? true : false,
      cursor_color = (o_turn == is_o) ? 'white' : 'blue';


  // Send first turn
  if (game_type == 3) {
    if (is_o) connection.emit('o-first', o_turn);

  } else {
    cursor_color = 'white';
  }

  var free = false,
      playing = true,
      over,
      display_replay = false;

  // Initial position of the player's cursor
  var cursor_pos = {
    board: 0,
    row: 0,
    col: 0
  }

  // Keeps track of which mini boards have ended and their winners
  var finished_boards = [];

  // Keep track of what's been added to the screen for reset
  var additions = [];

  var screen = blessed.screen({
    autoPadding: true,
    smartCSR: true
  });

  screen.title = 'Ultimate TermTacToe';

  /*************************** Initial game objects ***************************/
  // Container for the game
  var container = blessed.box({
    top: 'center',
    left: 'center',
    width: 47,
    height: 24,
    padding: {
      top: 1,
      right: 3,
      bottom: 1,
      left: 3
    },
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: '#777777'
      }
    }
  });

  // Background board layout
  var initial_board = '' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '     {green-fg}1             2             3{/green-fg}   \n\n' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '     {green-fg}4             5             6{/green-fg}   \n\n' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '───┼───┼───   ───┼───┼───   ───┼───┼───\n' +
    '   │   │         │   │         │   │   \n' +
    '     {green-fg}7             8             9{/green-fg}   \n\n';

  container.content = initial_board;
  screen.append(container);

  // The player cursor
  var cursor = blessed.box({
    content: '█',
    top: 0,
    left: 1,
    width: 1,
    height: 1,
    tags: true,
    style: {
      fg: cursor_color,
      bg: 'black'
    }
  });

  container.append(cursor);

  // Box for current turn
  var current_turn = blessed.box({
    content: 'Turn: ' + ((o_turn) ? 'o' : 'x'),
    top: -2,
    left: -15,
    width: 11,
    height: 3,
    align: 'center',
    border: {
      type: 'line',
      fg: '#777777'
    }
  });

  container.append(current_turn);
  screen.render();

  // Create replay form but hide it
  var replay_form = blessed.form({
    hidden: true,
    keys: true,
    top: 'center',
    left: 'center',
    width: 25,
    height: 7,
    padding: {
      top: 1
    },
    align: 'center',
    valign: 'center',
    content: 'Play again?',
    border: {
      type: 'line',
      fg: 'red'
    }
  });

  var yes = blessed.button({
    parent: replay_form,
    keys: true,
    bottom: 1,
    left: 4,
    width: 7,
    height: 1,
    align: 'center',
    name: 'yes',
    content: 'Yes',
    style: {
      bg: 'blue',
      focus: {
        bg: 'green'
      },
      hover: {
        bg: 'green'
      }
    }
  });

  var no = blessed.button({
    parent: replay_form,
    keys: true,
    bottom: 1,
    right: 4,
    width: 6,
    height: 1,
    align: 'center',
    name: 'No',
    content: 'No',
    style: {
      bg: 'blue',
      focus: {
        bg: 'green'
      },
      hover: {
        bg: 'green'
      }
    }
  });

  container.append(replay_form);

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function() {
    if (game_type == 3) connection.emit('quit', player);
    return process.exit(0);
  });

  /************************* Key events for gameplay **************************/
  // Note: because of padding in container, get methods are offset

  screen.key('down', function() {
    // Only do something if player's turn
    if ((game_type == 2) ||
        (game_type == 1 && o_turn) ||
        (game_type == 3 && is_o == o_turn)) {
      var t = cursor.top - 2;
      cursor.style.fg = cursor_color;

      // Can't leave board space
      if (t < 18) {
        if (finished_boards[cursor_pos.board]) {
          // Somewhere in a finished board

          // Reset bg color of old cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#000000'
            }
          }

          // Move cursor straight to next mini board board
          if (t <= 11) {
            cursor.top = 14;
            cursor_pos.row = 0;
            cursor_pos.board += 3;

            if (t <= 4) cursor.top = 7;

          } else {
            cursor.top = t + 2;
            cursor_pos.row++;
          }

          // Highlight current cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#333333'
            }
          }

        } else {

          // Regular move
          if (cursor_pos.row == 2) {

            // Can only leave mini board if free == true
            if (free) {
              // Cursor is moving to a new mini board
              cursor_pos.board += 3;
              cursor_pos.row = -1;
              t++;

              // Change bg color of current cover
              var finished = finished_boards[cursor_pos.board];
              if (finished) {
                finished.style = {
                  fg: finished.style.fg,
                  bg: '#333333'
                }
              }
            
            } else {
              // Undo below
              cursor_pos.row--;
              t -= 2;
            }
          }

          cursor_pos.row++;
          cursor.top = t + 2;
        }
      }

      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      // Send update to other player
      if (game_type == 3) connection.emit('move', cursor_pos);

      // console.log(cursor_pos.row + ', ' + cursor_pos.col);
      screen.render();
    }
  });

  screen.key('up', function() {
    // Only do something if player's turn
    if ((game_type == 2) ||
        (game_type == 1 && o_turn) ||
        (game_type == 3 && is_o == o_turn)) {
      var t = cursor.top - 2;
      cursor.style.fg = cursor_color;

      // Can't leave board space
      if (t > 0) {
        if (finished_boards[cursor_pos.board]) {
          // Somewhere in a finished board

          // Reset bg color of old cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#000000'
            }
          }

          // Move cursor straight to next mini board
          if (t >= 7) {
            cursor.top = 4;
            cursor_pos.row = 2;
            cursor_pos.board -= 3;

            if (t >= 14) cursor.top = 11;

          } else {
            cursor.top = t - 2;
            cursor_pos.row--;
          }

          // Highlight current cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#333333'
            }
          }

        } else {
      
          // Regular move
          if (cursor_pos.row == 0) {

            // Can only leave mini board if free == true
            if (free) {

              // Cursor is moving to a new mini board
              cursor_pos.board -= 3;
              cursor_pos.row = 3;
              t--;

              finished = finished_boards[cursor_pos.board];
              if (finished) {
                finished.style = {
                  fg: finished.style.fg,
                  bg: '#333333'
                }
              }

            } else {
              // Undo below
              cursor_pos.row++;
              t += 2;
            }
          }

          cursor_pos.row--;
          cursor.top = t - 2;
        }
      }

      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      // Send update to other player
      if (game_type == 3) connection.emit('move', cursor_pos);

      // console.log(cursor_pos.row + ', ' + cursor_pos.col);
      screen.render();
    }
  });

  screen.key('left', function() {
    // Only do something if player's turn
    if ((game_type == 2) ||
        (game_type == 1 && o_turn) ||
        (game_type == 3 && is_o == o_turn)) {
      var l = cursor.left - 5;
      cursor.style.fg = cursor_color;

      // Can't leave board space
      if (l > 0) {
        if (finished_boards[cursor_pos.board]) {
          // Somewhere in a finished board

          // Reset bg color of old cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#000000'
            }
          }

          // Move cursor straight to next mini board
          if (l >= 14) {
            cursor.left = 9;
            cursor_pos.col = 2;
            cursor_pos.board--;

            if (l >= 28)
              cursor.left = 23;

          } else {
            cursor.left = l - 3;
            cursor_pos.col--;
          }

          // Highlight current cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#333333'
            }
          }

        } else {

          // Regular move
          if (cursor_pos.col == 0) {

            // Can only leave mini board if free == true
            if (free) {

              // Cursor is moving to a new mini board
              cursor_pos.board--;
              cursor_pos.col = 3;
              l -= 2;

              var finished = finished_boards[cursor_pos.board];
              if (finished) {
                finished.style = {
                  fg: finished.style.fg,
                  bg: '#333333'
                }
              }

            } else {
              // Undo below
              cursor_pos.col++;
              l += 4;
            }
          }

          cursor_pos.col--;
          cursor.left = l - 3;
        }
      }

      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      // Send update to other player
      if (game_type == 3) connection.emit('move', cursor_pos);

      // console.log(cursor_pos.row + ', ' + cursor_pos.col);
      screen.render();
    }
  });

  screen.key('right', function() {
    // Only do something if player's turn
    if ((game_type == 2) ||
        (game_type == 1 && o_turn) ||
        (game_type == 3 && is_o == o_turn)) {
      cursor.style.fg = cursor_color;

      // Can't leave board space
      var l = cursor.left - 5;
      if (l < 36) {
        if (finished_boards[cursor_pos.board]) {
          // Somewhere in a finished board

          // Reset bg color of old cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#000000'
            }
          }

          // Move cursor straight to next mini board
          if (l <= 22) {
            cursor.left = 29;
            cursor_pos.col = 0;
            cursor_pos.board++;

            if (l <= 8)
              cursor.left = 15;

          } else {
            cursor.left = l + 5;
            cursor_pos.col++;
          }

          // Highlight current cover
          var finished = finished_boards[cursor_pos.board];
          if (finished) {
            finished.style = {
              fg: finished.style.fg,
              bg: '#333333'
            }
          }

        } else {

          // Regular move
          if (cursor_pos.col == 2) {

            // Can only leave mini board if free == true
            if (free) {

              // Cursor is moving to a new mini board
              cursor_pos.board++;
              cursor_pos.col = -1;
              l += 2;

              var finished = finished_boards[cursor_pos.board];
              if (finished) {
                finished.style = {
                  fg: finished.style.fg,
                  bg: '#333333'
                }
              }

            } else {
              // Undo below
              cursor_pos.col--;
              l -= 4;
            }
          }

          cursor_pos.col++;
          cursor.left = l + 5;
        }
      }

      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      // Send update to other player
      if (game_type == 3) connection.emit('move', cursor_pos);

      // console.log(cursor_pos.row + ', ' + cursor_pos.col);
      screen.render();
    }
  });

  screen.key('x', function() {
    game_over = 'tie';
    playing = false;

    if (game_type == 3) connection.emit('game-over', game_over);

    if (over) {
      over.content = ascii_winner(game_over);
      over.style.fg = color_of(game_over);
      over.show();
    } else {
      over = blessed.box({
        top: 'center',
        left: 'center',
        width: 55,
        height: 20,
        content: ascii_winner(game_over),
        align: 'center',
        valign: 'bottom',
        border: {
          type: 'line',
          fg: 'white'
        },
        style: {
          fg: color_of(game_over),
          bg: 'black'
        }
      });

      container.append(over);
    }

    screen.render();
  });

  // Space makes the move for a player
  screen.key(['space', 'enter', 'o', 'x'], function() {

    // Only do something if player's turn
    if ((game_type == 2) ||
        (game_type == 1 && o_turn) ||
        (game_type == 3 && is_o == o_turn)) {

      // Ignore if mini board completed
      if (finished_boards[cursor_pos.board] || !playing) return;

      make_play();

      screen.render();

      if (game_type == 1 && !o_turn && game.won_game() === 'undetermined') {
        var ai_move = AI.opt_move(game, false, free, cursor_pos.board, 3);

        var finished = finished_boards[cursor_pos.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#000000'
          }
        }

        cursor_pos  = ai_move.move;
        cursor.top  = (2 * cursor_pos.row) + (7 * Math.floor(cursor_pos.board / 3));
        cursor.left = (4 * cursor_pos.col) + (14 * (cursor_pos.board % 3)) + 1;

        make_play();

        screen.render();
      }
    }
  });

  // Activated only for after game ends
  screen.on('keypress', function (ch, key) {
    if (!playing) {

      // Display form before allowing button selection
      if (!display_replay) {

        replay_form.show();
        replay_form.setFront();
        display_replay = true;

        no.on('press', function() {
          if (game_type == 3) connection.emit('quit', player);
          return process.exit(0);
        });

        yes.on('press', function () {

          if (game_type == 3) {
            connection.emit('request-replay');
            return;

          } else {
            // Start a new game
            game = new Board();
            playing = true;

            // Delete everything on the board
            for (i = 0; i < additions.length; i++) {
              container.remove(additions[i]);
            }
            additions = [];

            // Reset cursor
            cursor_pos = {
              board: 0,
              row: 0,
              col: 0
            }
            cursor.top  = 0;
            cursor.left = 1;

            // Hide form and winner cover
            container.focus();
            replay_form.hide();
            over.hide();
            display_replay = false;

            // Change turn to o
            o_turn = (Math.random() > 0.5) ? true : false;
            current_turn.content = 'Turn: ' + ((o_turn) ? 'o' : 'x');
          }

          screen.render();
        });

        screen.render();

      } else {
        // Allow tabs, arrows, etc to select new form button
        var allowed = ['up', 'down', 'left', 'right', 'tab'];
        if (allowed.indexOf(key.name) >= 0) {
          replay_form.focusNext();
        }
      }
    }
  });

  /***************************** Server listeners *****************************/
  // If the game isn't local, listen for events
  if (game_type == 3) {

    // Player o chooses starter
    connection.on('o-first', function (o_first) {
      o_turn = o_first;
      cursor_color = (o_turn == is_o) ? 'white' : 'blue';
      cursor.style.fg = cursor_color;
      screen.render();
    });

    // Update local cursor position
    connection.on('move', function (data) {
      cursor.style.fg = cursor_color;

      cursor_pos  = data;
      cursor.top  = (2 * data.row) + (7 * Math.floor(data.board / 3));
      cursor.left = (4 * data.col) + (14 * (data.board % 3)) + 1;

      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      screen.render();
    });

    // Opponent made a move
    connection.on('play', function (data) {

      var t    = (o_turn) ? 'o' : 'x',
          b    = data.board,
          r    = data.row,
          c    = data.col;
          free = false;

      game.make_move(data.board, data.row, data.col, t);

      o_turn = !o_turn;
      cursor_color = 'white';
      cursor.style.fg = cursor_color;
      current_turn.content = 'Turn: ' + ((o_turn) ? 'o' : 'x');

      // Add x or o to board
      var played = blessed.box({
        content: t,
        top: (2 * r) + (7 * Math.floor(b / 3)),
        left: (4 * c) + (14 * (b % 3)) + 1,
        width: 1,
        height: 1
      });

      container.append(played);
      additions.push(played);
      played.setBack();

      // Un-highlight old box if finished
      var finished = finished_boards[b];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor to appropriate board
      cursor_pos.board = r * 3 + c;
      cursor.top  = (7 * r)  + (2 * r);
      cursor.left = (14 * c) + (4 * c) + 1;

      // Make cursor red if current square not playable
      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';

      // Highlight new box if finished
      var finished = finished_boards[cursor_pos.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
        free = true;
      }

      screen.render();
    });

    // Update wins
    connection.on('game-over', function (winner) {

      playing = false;

      if (over) {
        over.content = ascii_winner(winner);
        over.style.fg = color_of(winner);
        over.show();

      } else {
        over = blessed.box({
          top: 'center',
          left: 'center',
          width: 55,
          height: 20,
          content: ascii_winner(winner),
          align: 'center',
          valign: 'bottom',
          border: {
            type: 'line',
            fg: 'white'
          },
          style: {
            fg: color_of(winner),
            bg: 'black'
          }
        });

        container.append(over);
      }
      screen.render();
    });

    connection.on('mini-win', function (data) {

      game.won_board(data.board);

      var finished = blessed.box({
        content: bigify(data.winner),
        top: (Math.floor(data.board / 3)) * 7,
        left: (data.board % 3) * 14,
        width: 11,
        height: 5,
        style: {
          bg: '#000000'
        }
      });

      // Highlight if cursor is not leaving
      if (data.board == cursor_pos.board) {
        finished.style.bg = '#333333';
      }

      finished.style.fg = color_of(data.winner);
      finished_boards[data.board] = finished;

      container.append(finished);
      additions.push(finished);

      screen.render();
    });


    // Received a replay request
    connection.on('request-replay', function () {
      // Display form if not already
      replay_form.show();
      replay_form.setFront();
      replay_form.height = 8;
      replay_form.content = 'Opponent requested a rematch!';

      display_replay = true;

      yes.on('press', function () {

        connection.emit('confirm-replay');

        // Start a new game
        game = new Board();
        playing = true;

        // Delete everything on the board
        for (i = 0; i < additions.length; i++) {
          container.remove(additions[i]);
        }
        additions = [];

        // Reset cursor
        cursor_pos = {
          board: 0,
          row: 0,
          col: 0
        }
        cursor.top  = 0;
        cursor.left = 1;

        // Hide form and winner cover
        container.focus();
        replay_form.hide();
        over.hide();
        display_replay = false;

        // Change turn to o
        o_turn = (Math.random() > 0.5) ? true : false;

        // Send or receive first turn
        if (is_o) connection.emit('o-first', o_turn);

        cursor_color = (o_turn == is_o) ? 'white' : 'blue';
        cursor.style.fg = cursor_color;

        current_turn.content = 'Turn: ' + ((o_turn) ? 'o' : 'x');

        screen.render();
      });

      no.on('press', function () {
        connection.emit('reject-replay', player);
        return process.exit(0);
      });

      screen.render();
    });

    connection.on('confirm-replay', function () {

      // Start a new game
      game = new Board();
      playing = true;

      // Delete everything on the board
      for (i = 0; i < additions.length; i++) {
        container.remove(additions[i]);
      }
      additions = [];

      // Reset cursor
      cursor_pos = {
        board: 0,
        row: 0,
        col: 0
      }
      cursor.top  = 0;
      cursor.left = 1;

      // Hide form and winner cover
      replay_form.hide();
      container.focus();
      over.hide();
      display_replay = false;

      // Change turn to o
      o_turn = (Math.random() > 0.5) ? true : false;

      // Send or receive first turn
      if (is_o) connection.emit('o-first', o_turn);

      cursor_color = (o_turn == is_o) ? 'white' : 'blue';
      cursor.style.fg = cursor_color;

      current_turn.content = 'Turn: ' + ((o_turn) ? 'o' : 'x');

      screen.render();
    });

    connection.on('reject-replay', function (who) {
      // Inform of rejection
      screen.unkey(['up', 'down', 'left', 'right', 'space']);

      var rejected = blessed.box({
        top: 'center',
        left: 'center',
        width: 18,
        height: 4,
        align: 'center',
        content: 'Player ' + who + '\n doesn\'t want a rematch.',
        border: {
          type: 'line',
          fg: 'red'
        },
        style: {
          fg: 'white',
          bg: 'black'
        }
      });

      container.append(rejected);
      screen.render();
    });

    // Received when opponent quits
    connection.on('quit', function (who) {
      screen.unkey(['up', 'down', 'left', 'right', 'space']);

      var quit = blessed.box({
        top: 'center',
        left: 'center',
        width: 18,
        height: 4,
        align: 'center',
        content: 'Player ' + who + '\nleft the game.',
        border: {
          type: 'line',
          fg: 'red'
        },
        style: {
          fg: 'white',
          bg: 'black'
        }
      });

      container.append(quit);
      screen.render();
    });
  }

  /******************************** Functions *********************************/

  /**
   * Makes a play.
   * Takes no parameters because it reads local variables (e.g. cursor_pos).
   */
  var make_play = function () {
    var t     = (o_turn) ? 'o' : 'x',
        which = cursor_pos.board,
        r     = cursor_pos.row,
        c     = cursor_pos.col;
        free  = false;

    var success = game.make_move(which, r, c, t);

    // Move was possible, i.e. spot was empty
    if (success) {
      // Add x or o to board
      var played = blessed.box({
        content: t,
        top: cursor.top - 2,
        left: cursor.left - 4,
        width: 1,
        height: 1
      });

      container.append(played);
      additions.push(played);
      played.setBack();

      // Send play
      if (game_type == 3) {
        connection.emit('play', cursor_pos);
        cursor_color = 'blue';
      }

      // Toggle turn
      o_turn = !o_turn;
      cursor.style.fg = cursor_color;
      current_turn.content = 'Turn: ' + ((o_turn) ? 'o' : 'x');

      // Un-highlight old box if finished
      var finished = finished_boards[which];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor to appropriate board
      cursor_pos.board = r * 3 + c;
      cursor.top  = (7 * r)  + (2 * r);
      cursor.left = (14 * c) + (4 * c) + 1;

      // Make cursor red if current square not playable
      if (!game.playable(cursor_pos.board, cursor_pos.row, cursor_pos.col))
        cursor.style.fg = 'red';


      // Highlight new box if finished
      var finished = finished_boards[cursor_pos.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
        free = true;
      }

      // Check if game or mini game over
      var mini_ended = game.won_board(which);
      var game_over  = game.won_game();

      if (game_over !== 'undetermined') {

        playing = false;

        // Send win
        if (game_type == 3) connection.emit('game-over', game_over);

        if (over) {
          over.content = ascii_winner(game_over);
          over.style.fg = color_of(game_over);
          over.show();

        } else {
          over = blessed.box({
            top: 'center',
            left: 'center',
            width: 55,
            height: 20,
            content: ascii_winner(game_over),
            align: 'center',
            valign: 'bottom',
            border: {
              type: 'line',
              fg: 'white'
            },
            style: {
              fg: color_of(game_over),
              bg: 'black'
            }
          });

          container.append(over);
        }

      } else if (mini_ended !== 'undetermined') {

        // Send win
        if (game_type == 3) connection.emit('mini-win', {
          winner: mini_ended,
          board: which
        });

        var finished = blessed.box({
          content: bigify(mini_ended),
          top: (Math.floor(which / 3)) * 7,
          left: (which % 3) * 14,
          width: 11,
          height: 5,
          style: {
            bg: '#000000'
          }
        });

        // Highlight if cursor is not leaving
        if (which == cursor_pos.board) {
          finished.style.bg = '#333333';
        }

        finished.style.fg = color_of(mini_ended);
        finished_boards[which] = finished;

        container.append(finished);
        additions.push(finished);

      }
    }
  }

  /********************************* AI First *********************************/
  // If x goes first, ai needs to play
  if (game_type == 1 && !o_turn) {
    var ai_move = AI.opt_move(game, false, free, cursor_pos.board, 3);

    cursor_pos = ai_move.move;
    cursor.top  = (2 * cursor_pos.row) + (7 * Math.floor(cursor_pos.board / 3));
    cursor.left = (4 * cursor_pos.col) + (14 * (cursor_pos.board % 3)) + 1;

    make_play();

    screen.render();
  }
}

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Random Functions ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a character to a large ASCII version.
 * @param   {string} str The string to convert. One of [o, x, tie]
 * @returns {string}     The ASCII-fied string
 */
var bigify = function (str) {
  if (str === 'o') {
    return '' +
      '  .d888b.  \n' +
      ' .8P   Y8. \n' +
      ' 88     88 \n' +
      ' `8b   d8\'\n' +
      '  `Y888P\' \n';

  } else if (str === 'x') {
    return '' +
      '  db   db  \n' +
      '  `8b d8\' \n' +
      '   `8d8\'  \n' +
      '  .8P Y8.  \n' +
      '  YP   YP  \n';

  } else if (str === 'tie') {
    return '' +
      '──┬──   ┌──\n' +
      '  │  ┬  │  \n' +
      '  │  │  ├──\n' +
      '  │  │  │  \n' +
      '  │  ┴  └──\n';
  }
}

/**
 * Returns the color associated with a given player
 * @param   {string} p The player
 * @returns {string}   The color for player p
 */
var color_of = function (p) {
  if (p === 'o') {
    return '#00FFFF';

  } else if (p === 'x') {
    return '#FFA500';

  } else {
    return 'magenta';
  }
}

/**
 * Returns the ASCII art text for the given winner.
 * @param   {string} winner The winner. One of [o, x, tie]
 * @returns {string}        The ASCII string to display
 */
var ascii_winner = function (winner) {
  var ascii_wins = '' +
    '   ____      ____  _____  ____  _____   ______      \n' +
    '|_  _|    |_  _||_   _||_   \\|_   _|.\' ____ \\    \n' +
    ' \\ \\  /\\  / /    | |    |   \\ | |  | (___ \\_|  \n' +
    '  \\ \\/  \\/ /     | |    | |\\ \\| |   _.____`.   \n' +
    '    \\  /\\  /     _| |_  _| |_\\   |_ | \\____) |  \n' +
    '    \\/  \\/     |_____||_____|\\____| \\______.\'  \n';

  var ascii_x = '' +
    '  ____  ____   \n' +
    ' |_  _||_  _|  \n' +
    '  \\ \\  / /  \n' +
    '    > `\' <     \n' +
    ' _/ /\'`\\ \\_ \n' +
    ' |____||____|  \n';

  var ascii_o = '' +
    '    ___      \n' +
    '  .\'   `.   \n' +
    ' /  .-.  \\  \n' +
    ' | |   | |   \n' +
    '\\  `-\'  / \n' +
    '  `.___.\'   \n';

  var ascii_tie = '' +
    '  _________  _____  ________  \n' +
    ' |  _   _  ||_   _||_   __  | \n' +
    ' |_/ | | \\_|  | |    | |_ \\_| \n' +
    '     | |      | |    |  _| _  \n' +
    '    _| |_    _| |_  _| |__/ | \n' +
    '   |_____|  |_____||________| \n';

  var binary_wins = '01010111 01001001 01001110 01010011';
  var binary_o = '01101111';
  var binary_x = '01111000';
  var binary_tie = '01110100 01101001 01100101';

  if (winner === 'tie') {
    return ascii_tie + '\n\n\n\n\n\n' + binary_tie;

  } else if (winner === 'o') {
    return ascii_o + '\n' + ascii_wins + '\n\n\n' +
      binary_o + ' ' + binary_wins;

  } else if (winner === 'x') {
    return ascii_x + '\n' + ascii_wins + '\n\n\n' +
      binary_x + ' ' + binary_wins;
  }
}
