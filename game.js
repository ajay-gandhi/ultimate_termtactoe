
var blessed = require('blessed');
var Board = require('./board');

var game = new Board();

var o_turn = false;
var cursor_position = {
  board: 0,
  row: 0,
  col: 0
}

var screen = blessed.screen({
  autoPadding: true,
  smartCSR: true
});

screen.title = 'Ultimate TermTacToe';

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
      fg: '#f0f0f0'
    }
  }
});

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

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

/* Key events */
// Because of padding in container, get methods are offset
screen.key('down', function(ch, key) {
  var t = cursor.top - 2;
  cursor.style.fg = 'white';

  if (t < 18) {
    if (t == 4 || t == 11) {
      cursor_position.board += 3;
      cursor_position.row = 0;

      t++;
    }
    cursor_position.row++;
    cursor.top = t + 2;
  }

  // console.log(cursor.top + ', ' + cursor.left);
  screen.render();
});

screen.key('up', function(ch, key) {
  var t = cursor.top - 2;
  cursor.style.fg = 'white';

  if (t > 0) {
    if (t == 7 || t == 14) {
      cursor_position.board -= 3;
      cursor_position.row = 2;

      t--;
    }
    cursor_position.row--;
    cursor.top = t - 2;
  }

  // console.log(cursor.top + ', ' + cursor.left);
  screen.render();
});

screen.key('left', function(ch, key) {
  var l = cursor.left - 5;
  cursor.style.fg = 'white';

  if (l > 0) {
    if (l == 14 || l == 28) {
      cursor_position.board--;
      cursor_position.col = 2;

      l -= 2;
    }
    cursor_position.col--;
    cursor.left = l - 3;
  }

  // console.log(cursor.top + ', ' + cursor.left);
  screen.render();
});

screen.key('right', function(ch, key) {
  cursor.style.fg = 'white';

  var l = cursor.left - 5;
  if (l < 36) {
    if (l == 8 || l == 22) {
      cursor_position.board++;
      cursor_position.col = 0;
      l += 2;
    }
    cursor_position.col++;
    cursor.left = l + 5;
  }

  // console.log(cursor.top + ', ' + cursor.left);
  screen.render();
});

screen.key('space', function(ch, key) {
  var success = game.make_move(cursor_position.board, cursor_position.row, cursor_position.col, (o_turn) ? 'x' : 'o');

  // Move was possible, i.e. spot empty
  if (success) {
    var played = blessed.box({
      content: (o_turn) ? 'x' : 'o',
      top: cursor.top - 2,
      left: cursor.left - 4,
      width: 1,
      height: 1
    });

    o_turn = !o_turn;

    container.append(played);
    cursor.setFront();

    var ended = game.won_board(cursor_position.board);
    console.log(ended);

    if (ended !== 'undetermined') {

      var finished = blessed.box({
        content: bigify(ended),
        top: 0,
        left: 0,
        width: 11,
        height: 5
      });

      container.append(finished);

    }

  } else {
    // There is already o or x in that spot
    cursor.style.fg = 'red';
  }

  screen.render();
});

screen.render();

var bigify = function (str) {
  if (str === 'o') {
    return '' +
      '  .d88b.   \n' +
      ' .8P  Y8.  \n' +
      ' 88    88  \n' +
      ' `8b  d8\' \n' +
      '  `Y88P\'  \n';

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