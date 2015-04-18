#!/usr/bin/env node

var blessed = require('blessed');
var Board = require('./board');

// Manages the backend of the board, e.g. who won/lost
var game = new Board();

var o_turn = true,
    free = false,
    playing = true,
    over,
    display_replay = false,
    replay_form;

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
    fg: 'white',
    bg: 'black'
  }
});

container.append(cursor);

// Box for current turn
var current_turn = blessed.box({
  content: 'Turn: o',
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

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

/* Key events for gameplay */
// Because of padding in container, get methods are offset

screen.key('down', function() {
  var t = cursor.top - 2;
  cursor.style.fg = 'white';

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

  // console.log(cursor_pos.row + ', ' + cursor_pos.col);
  screen.render();
});

screen.key('up', function() {
  var t = cursor.top - 2;
  cursor.style.fg = 'white';

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

  // console.log(cursor_pos.row + ', ' + cursor_pos.col);
  screen.render();
});

screen.key('left', function() {
  var l = cursor.left - 5;
  cursor.style.fg = 'white';

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

  // console.log(cursor_pos.row + ', ' + cursor_pos.col);
  screen.render();
});

screen.key('right', function() {
  cursor.style.fg = 'white';

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

  // console.log(cursor_pos.row + ', ' + cursor_pos.col);
  screen.render();
});

screen.key('x', function() {
  game_over = 'tie';
  playing = false;

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
screen.key('space', function() {
  // Ignore if mini board completed
  if (finished_boards[cursor_pos.board] || !playing) return;

  free = false;
  var t = (o_turn) ? 'o' : 'x';
  var which = cursor_pos.board;
  var r = cursor_pos.row;
  var c = cursor_pos.col;

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

    // Toggle turn
    o_turn = !o_turn;
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
    var ended = game.won_board(which);
    var game_over = game.won_game();

    if (game_over !== 'undetermined') {

      playing = false;

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

    } else if (ended !== 'undetermined') {

      var finished = blessed.box({
        content: bigify(ended),
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

      finished.style.fg = color_of(ended);
      finished_boards[which] = finished;

      container.append(finished);
      additions.push(finished);

    }

  } else {
    // There is already o or x in that spot
    cursor.style.fg = 'red';
  }

  screen.render();
});

// Activated only for after game ends
screen.on('keypress', function (ch, key) {
  if (!playing) {

    // Display form before allowing button selection
    if (!display_replay) {
      // If already exists just show its
      if (replay_form) {
        replay_form.show();
        display_replay = true;
        return;
      }

      display_replay = true;

      // Display form
      replay_form = blessed.form({
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
        top: 2,
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
        top: 2,
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

      no.on('press', function() {
        return process.exit(0);
      });

      yes.on('press', function () {
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
        cursor.top = 0;
        cursor.left = 1;

        // Hide form and winner cover
        replay_form.hide();
        over.hide();
        display_replay = false;

        // Change turn to o
        current_turn.content = 'Turn: o';
        o_turn = true;

        screen.render();
      });

      container.append(replay_form);
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
