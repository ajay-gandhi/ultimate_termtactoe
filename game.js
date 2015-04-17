
var blessed = require('blessed');

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
  // border: {
  //   type: 'line'
  // },
  style: {
    fg: 'white',
    bg: 'black'
  }
});

container.append(cursor);

cursor.top = 0;
screen.render();

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

/* Key events */
// Because of padding in container, get methods are offset
screen.key('down', function(ch, key) {
  var t = cursor.top - 2;
  if (t < 18) {
    if (t == 4 || t == 11) {
      t++;
    }
    cursor.top = t + 2;
  }

  screen.render();
});

screen.key('up', function(ch, key) {
  var t = cursor.top - 2;
  if (t > 0) {
    if (t == 7 || t == 14) {
      t--;
    }
    cursor.top = t - 2;
  }

  screen.render();
});

screen.key('left', function(ch, key) {
  var l = cursor.left - 5;
  if (l > 0) {
    if (l == 14 || l == 28) {
      l -= 2;
    }
    cursor.left = l - 3;
  }

  screen.render();
});

screen.key('right', function(ch, key) {
  var l = cursor.left - 5;
  console.log(l);
  if (l < 36) {
    if (l == 8 || l == 22) {
      l += 2;
    }
    cursor.left = l + 5;
  }

  screen.render();
});

screen.render();

