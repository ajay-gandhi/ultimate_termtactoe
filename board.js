
module.exports = (function () {

  function Board () {
    // Mini boards
    this.boards = [];
    this.moves_on_board = [];

    // Major board
    this.major_board = [0, 1, 2, 3, 4, 5, 5, 6, 7, 8];
    this.mini_wins = 0;


    // Create empty 9 x (3 x 3) array
    for (k = 0; k < 9; k++) {
      this.boards[k] = [];
      this.moves_on_board[k]  = 0;

      for (j = 0; j < 3; j++) {
        this.boards[k][j] = ['a' + j, 'b' + (j + 1), 'c' + (j + 2)];
      }
    }
  }

  /**
   * Attempts to place character o on board b at coordinates (r, c). Fails if
   *   there is already a character there
   *
   * @param   {int}    b The index of the board on which to play
   * @param   {int}    r The row of the board
   * @param   {int}    c The column of the board
   * @param   {string} o The character to place
   *
   * @returns {bool}     True if the character was placed, false if there was
   *   already a character there
   */
  Board.prototype.make_move = function (b, r, c, o) {
    var board = this.boards[b];

    if (board[r][c] === 'o' || board[r][c] === 'x') {
      return false;

    } else {
      this.boards[b][r][c] = o;
      this.moves_on_board[b]++;

      return true;
    }
  }

  /**
   * Checks if a mini board has ended. Returns the character that won, tie in
   *   case of a tie, or undetermined.
   *
   * @param   {int}    b The index of the board to check
   *
   * @returns {string}   The winner or undetermined
   */
  Board.prototype.won_board = function (b) {
    var board = this.boards[b];

    for (j = 0; j < 3; j++) {
      // Check row j
      if ((board[j][0] === board[j][1]) && (board[j][1] === board[j][2])) {
        this.mini_wins++;
        this.major_board[b] = board[j][0]; 
        return board[j][0];
      }

      // Check column j
      if ((board[0][j] === board[1][j]) && (board[1][j] === board[2][j])) {
        this.mini_wins++;
        this.major_board[b] = board[0][j]; 
        return board[0][j];
      }
    }

    // Diagonals
    if ((board[0][0] === board[1][1] && board[1][1] === board[2][2]) ||
      (board[2][0] === board[1][1] && board[1][1] === board[0][2])) {
      this.mini_wins++;
      this.major_board[b] = board[1][1]; 
      return board[1][1];
    }

    if (this.moves_on_board[b] == 9) {
      this.mini_wins++;
      return 'tie';

    } else {
      return 'undetermined';
    }
  }

  /**
   * Checks if the major board has been won. Returns the character for the
   *   winner, tie, or undetermined.
   *
   * @returns {string} The winner of the entire game
   */
  Board.prototype.won_game = function () {
    var major = this.major_board;

    for (j = 0; j < 3; j++) {

      // Check row j
      if ((major[j * 3] === major[j * 3 + 1]) && (major[j * 3] === major[j * 3 + 2])) {
        return major[j * 3];
      }

      // Check column j
      if ((major[j] === major[j + 3]) && (major[j] === major[j + 6])) {
        return major[j];
      }
    }

    // Diagonals
    if ((major[0] === major[4] && major[0] === major[8]) ||
      (major[2] === major[4] && major[2] === major[6])) {
      return major[0];

    } else if (this.mini_wins == 9) {
      return 'tie';
    } else {
      return 'undetermined';
    }
  }

  return Board;

})();
