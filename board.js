
module.exports = (function () {

  function Board () {
    this.boards = [];
    this.moves_on_board = [];

    // Create empty 9 x (3 x 3) array
    for (k = 0; k < 9; k++) {
      this.boards[k] = [];
      this.moves_on_board[k]  = 0;

      for (j = 0; j < 3; j++) {
        this.boards[k][j] = ['a' + j, 'b' + (j + 1), 'c' + (j + 2)];
      }
    }
  }

  Board.prototype.make_move = function (b, r, c, o) {
    if (this.boards[b][r][c] === 'o' || this.boards[b][r][c] === 'x') {
      return false;
    } else {
      this.boards[b][r][c] = o;
      this.moves_on_board[b]++;

      return true;
    }
  }

  Board.prototype.won_board = function (b) {
    var board = this.boards[b];

    for (j = 0; j < 3; j++) {
      // Check row j
      if ((board[j][0] === board[j][1]) && (board[j][1] === board[j][2])) {
        return board[j][0];
      }

      // Check column j
      if ((board[0][j] === board[1][j]) && (board[1][j] === board[2][j])) {
        return board[0][j];
      }
    }

    if ((board[0][0] === board[1][1] && board[1][1] === board[2][2]) ||
      (board[2][0] === board[1][1] && board[1][1] === board[0][2])) {
      return board[0][0];
    }

    if (this.moves_on_board[b] == 9)
      return 'tie';
    else
      return 'undetermined';
  }

  return Board;

})();
