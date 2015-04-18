
var blessed = require('blessed');
var Board = require('./board');

// Manages the backend of the board, e.g. who won/lost
var game = new Board();

var o_turn = true;

// Initial position of the player's cursor
var cursor_position = {
  board: 0,
  row: 0,
  col: 0
}

// Keeps track of which mini boards have ended and their winners
var finished_boards = [];

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
    if (finished_boards[cursor_position.board]) {
      // Somewhere in a finished board

      // Reset bg color of old cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor straight to next board
      if (t <= 11) {
        cursor.top = 14;
        cursor_position.row = 0;
        cursor_position.board += 3;

        if (t <= 4) cursor.top = 7;

      } else {
        cursor.top = t + 2;
        cursor_position.row++;
      }

      // Highlight current cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
      }

    } else {

      // Regular move
      if (t == 4 || t == 11) {

        // Cursor is moving to a new board
        cursor_position.board += 3;
        cursor_position.row = -1;
        t++;

        // Change bg color of current cover
        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#333333'
          }
        }
      }

      cursor_position.row++;
      cursor.top = t + 2;
    }
  }

  // console.log(cursor_position.row + ', ' + cursor_position.col);
  screen.render();
});

screen.key('up', function() {
  var t = cursor.top - 2;
  cursor.style.fg = 'white';

  // Can't leave board space
  if (t > 0) {
    if (finished_boards[cursor_position.board]) {
      // Somewhere in a finished board

      // Reset bg color of old cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor straight to next
      if (t >= 7) {
        cursor.top = 4;
        cursor_position.row = 2;
        cursor_position.board -= 3;

        if (t >= 14) cursor.top = 11;

      } else {
        cursor.top = t - 2;
        cursor_position.row--;
      }

      // Highlight current cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
      }

    } else {
  
      // Regular move
      if (t == 7 || t == 14) {
        // Reset bg color of cover
        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#000000'
          }
        }

        // Cursor is moving to a new board
        cursor_position.board -= 3;
        cursor_position.row = 3;
        t--;

        finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#333333'
          }
        }
      }

      cursor_position.row--;
      cursor.top = t - 2;
    }
  }

  // console.log(cursor_position.row + ', ' + cursor_position.col);
  screen.render();
});

screen.key('left', function() {
  var l = cursor.left - 5;
  cursor.style.fg = 'white';

  // Can't leave board space
  if (l > 0) {
    if (finished_boards[cursor_position.board]) {
      // Somewhere in a finished board

      // Reset bg color of old cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor straight to next
      if (l >= 14) {
        cursor.left = 9;
        cursor_position.col = 2;
        cursor_position.board--;

        if (l >= 28)
          cursor.left = 23;

      } else {
        cursor.left = l - 3;
        cursor_position.col--;
      }

      // Highlight current cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
      }

    } else {

      // Regular move
      if (l == 14 || l == 28) {
        // Reset bg color of cover
        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#000000'
          }
        }

        // Cursor is moving to a new board
        cursor_position.board--;
        cursor_position.col = 3;
        l -= 2;

        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#333333'
          }
        }
      }

      cursor_position.col--;
      cursor.left = l - 3;
    }
  }

  // console.log(cursor_position.row + ', ' + cursor_position.col);
  screen.render();
});

screen.key('right', function() {
  cursor.style.fg = 'white';

  // Can't leave board space
  var l = cursor.left - 5;
  if (l < 36) {
    if (finished_boards[cursor_position.board]) {
      // Somewhere in a finished board

      // Reset bg color of old cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#000000'
        }
      }

      // Move cursor straight to next
      if (l <= 22) {
        cursor.left = 29;
        cursor_position.col = 0;
        cursor_position.board++;

        if (l <= 8)
          cursor.left = 15;

      } else {
        cursor.left = l + 5;
        cursor_position.col++;
      }

      // Highlight current cover
      var finished = finished_boards[cursor_position.board];
      if (finished) {
        finished.style = {
          fg: finished.style.fg,
          bg: '#333333'
        }
      }

    } else {

      // Regular move
      if (l == 8 || l == 22) {
        // Reset bg color of cover
        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#000000'
          }
        }

        // Cursor is moving to a new board
        cursor_position.board++;
        cursor_position.col = -1;
        l += 2;

        var finished = finished_boards[cursor_position.board];
        if (finished) {
          finished.style = {
            fg: finished.style.fg,
            bg: '#333333'
          }
        }
      }

      cursor_position.col++;
      cursor.left = l + 5;
    }
  }

  // console.log(cursor_position.row + ', ' + cursor_position.col);
  screen.render();
});

screen.key('x', function() {
  game_over = 'tie';

  var over = blessed.box({
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

  screen.render();
});

screen.key('space', function() {
  // Ignore if mini board completed
  if (finished_boards[cursor_position.board]) return;

  var c = (o_turn) ? 'o' : 'x';
  var which = cursor_position.board;

  var success = game.make_move(which, cursor_position.row, cursor_position.col, c);

  // Move was possible, i.e. spot was empty
  if (success) {
    // Add x or o to board
    var played = blessed.box({
      content: c,
      top: cursor.top - 2,
      left: cursor.left - 4,
      width: 1,
      height: 1
    });

    container.append(played);
    played.setBack();

    o_turn = !o_turn;

    var ended = game.won_board(which);
    var game_over = game.won_game();

    if (game_over !== 'undetermined') {

      var over = blessed.box({
        top: 'center',
        left: 'center',
        width: 70,
        height: 20,
        content: ascii_winner(game_over),
        align: 'center',
        valign: 'bottom',
        border: {
          type: 'line',
          fg: 'white'
        },
        style: {
          fg: 'white',
          bg: 'black'
        }
      });

      container.append(over);

    } else if (ended !== 'undetermined') {

      var finished = blessed.box({
        content: bigify(ended),
        top: (Math.floor(which / 3)) * 7,
        left: (which % 3) * 14,
        width: 11,
        height: 5,
        style: {
          bg: '#333333'
        }
      });

      finished.style.fg = color_of(ended);
      finished_boards[which] = finished;

      container.append(finished);

    }

  } else {
    // There is already o or x in that spot
    cursor.style.fg = 'red';
  }

  screen.render();
});

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
