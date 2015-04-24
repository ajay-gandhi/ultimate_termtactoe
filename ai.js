'use strict';
/**
 * The artificial intelligence, basic minimax search (heuristic function below)
 */

var Board = require('./board');

/**
 * Find the optimal move given the status of the game.
 *
 * @param   {Board} game         The Board object for the game
 * @param   {bool}  player_turn  True if it is the human player's turn
 * @param   {bool}  free         True the player is free to move on any board
 * @param   {int}   which        Index of the board the player is restricted to
 * @param   {int}   depth        How many more levels to search
 *
 * @returns {Object} An object containing the best move and its eval'd score
 */
var opt_move = function (game, player_turn, free, which, depth) {
  // Evaluate and return score if game over or depth 0
  if (depth == 0 || game.won_game() !== 'undetermined') {
    return { score: evaluate_board(game), move: -1 };
  }

  var best_scores = [-1],
      best_moves;

  if (player_turn) {
    // Assume minimize

    if (free) {
      // Try all possibilities on all boards
      for (var k = 0; k < 9; k++) {

        // Disallow if this board has been won
        if (game.won_board(k) !== 'undetermined') continue;

        for (var j = 0; j < 3; j++) {
          for (var i = 0; i < 3; i++) {

            // Create temp game clone
            var game_props = JSON.parse(JSON.stringify(game));
            var temp       = new Board(game_props);

            var poss = temp.make_move(k, j, i, 'x');
            if (poss) {
              // Move is possible, evaluate move

              // Next turn is free if forced board is won
              var next_board = (j * 3) + i;
              var is_won     = temp.won_board(next_board);
              var next_free  = (is_won === 'undetermined') ? false : true;
              var new_score  = opt_move(temp, false, is_won, next_board, depth - 1).score;

              // Set this to best move if score higher
              // All elements in best_scores should be equal value
              if (new_score < best_scores[0] || !best_moves) {
                best_scores = [new_score];
                best_moves  = [{
                  board: k,
                  row: j,
                  col: i
                }];

              } else if (new_score == best_scores[0]) {
                best_scores.push(new_score);
                best_moves.push({
                  board: which,
                  row: j,
                  col: i
                });
              }

            }
          }
        }
      }

    } else {
      // Restricted to board which
      for (var j = 0; j < 3; j++) {
        for (var i = 0; i < 3; i++) {

          // Create temp game clone
          var game_props = JSON.parse(JSON.stringify(game));
          var temp       = new Board(game_props);

          var poss = temp.make_move(which, j, i, 'o');
          if (poss) {
            // Move is possible, evaluate move

            // Next turn is free if forced board is won
            var next_board = (j * 3) + i;
            var is_won     = temp.won_board(next_board);
            var next_free  = (is_won === 'undetermined') ? false : true;
            var new_score  = opt_move(temp, false, is_won, next_board, depth - 1).score;

            // Set this to best move if score higher
            if (new_score < best_scores[0]) {
              best_scores = [new_score];
              best_moves  = [{
                board: which,
                row: j,
                col: i
              }];

            } else if (new_score == best_scores[0]) {
              best_scores.push(new_score);
              best_moves.push({
                board: which,
                row: j,
                col: i
              });
            }

          }
        }
      }
    }

  } else {
    // Maximize

    if (free) {
      // Try all possibilities on all boards
      for (var k = 0; k < 9; k++) {

        // Disallow if this board has been won
        if (game.won_board(k) !== 'undetermined') continue;

        for (var j = 0; j < 3; j++) {
          for (var i = 0; i < 3; i++) {

            // Create temp game clone
            var game_props = JSON.parse(JSON.stringify(game));
            var temp       = new Board(game_props);

            var poss = temp.make_move(k, j, i, 'x');
            if (poss) {
              // Move is possible, evaluate move

              // Next turn is free if forced board is won
              var next_board = (j * 3) + i;
              var is_won     = temp.won_board(next_board);
              var next_free  = (is_won === 'undetermined') ? false : true;
              var new_score  = opt_move(temp, true, is_won, next_board, depth - 1).score;

              // Set this to best move if score higher
              if (new_score > best_scores) {
                best_scores = [new_score];
                best_moves  = [{
                  board: k,
                  row: j,
                  col: i
                }];

              } else if (new_score == best_scores[0]) {
                best_scores.push(new_score);
                best_moves.push({
                  board: which,
                  row: j,
                  col: i
                });
              }
            }
          }
        }
      }

    } else {
      // Restricted to board which
      for (var j = 0; j < 3; j++) {
        for (var i = 0; i < 3; i++) {

          // Create temp game clone
          var game_props = JSON.parse(JSON.stringify(game));
          var temp       = new Board(game_props);

          var poss = temp.make_move(which, j, i, 'x');
          if (poss) {
            // Move is possible, evaluate move

            // Next turn is free if forced board is won
            var next_board = (j * 3) + i;
            var is_won     = temp.won_board(next_board);
            var next_free  = (is_won === 'undetermined') ? false : true;
            var new_score  = opt_move(temp, true, is_won, next_board, depth - 1).score;

            // Set this to best move if score higher
            if (new_score > best_scores) {
              best_scores = [new_score];
              best_moves  = [{
                board: which,
                row: j,
                col: i
              }];

            } else if (new_score == best_scores[0]) {
              best_scores.push(new_score);
              best_moves.push({
                board: which,
                row: j,
                col: i
              });
            }

          }
        }
      }

    }
  }

  // Get random move from best moves
  var index = Math.floor(Math.random() * best_moves.length);
  var best_score = best_scores[index];
  var best_move = best_moves[index];

  return { score: best_score, move: best_move };
}
module.exports.opt_move = opt_move;

/**
 * Heuristic function
 */
var evaluate_board = function (game) {
  var me    = 'x';
  var score = 0;
  var major = game.major_board;

  /******************************* Mini boards ********************************/
  for (var k = 0; k < 9; k++) {
    var b = game.boards[k];

    for (var i = 0; i < 3; i++) {

      // 2 in a row
      for (var j = 0; j < 2; j++) {

        // Horizontal
        if (b[i][j] === b[i][j + 1] && b[i][j] === me)
          score += 2;

        // Vertical
        if (b[j][i] === b[j + 1][i] && b[j][i] === me)
          score += 2;
      }

      // Won row i
      if ((b[i][0] === b[i][1]) && (b[i][1] === b[i][2]) && (b[i][0] === me))
        score += 6;

      // Won column i
      if ((b[0][i] === b[1][i]) && (b[1][i] === b[2][i]) && (b[0][i] === me))
        score += 6;

    }
    // Won diagonals
    if ((b[0][0] === b[1][1] && b[1][1] === b[2][2] && b[1][1] === me) ||
      (b[2][0] === b[1][1] && b[1][1] === b[0][2] && b[1][1] === me))
      score += 6;

    // 2 in a row diagonals
    if (b[0][0] === b[1][1] && b[1][1] === me) score += 2;
    if (b[2][2] === b[1][1] && b[1][1] === me) score += 2;
    if (b[2][0] === b[1][1] && b[1][1] === me) score += 2;
    if (b[0][2] === b[1][1] && b[1][1] === me) score += 2;
  }

  /******************************* Major boards *******************************/
  for (i = 0; i < 3; i++) {

    // 2 in a col
    if (major[i] === major[i + 3] && major[i] === me)
      score += 20;
    if (major[i + 6] === major[i + 3] && major[i + 6] === me)
      score += 20;

    // 2 in a row
    if (major[i * 3] === major[i * 3 + 1] && major[i * 3] === me)
      score += 20;
    if (major[i * 3 + 2] === major[i * 3 + 1] && major[i * 3] === me)
      score += 20;

    // Won row i
    if ((major[i * 3] === major[i * 3 + 1]) && (major[i * 3] === major[i * 3 + 2]))
      score += 60;

    // Won column i
    if ((major[i] === major[i + 3]) && (major[i] === major[i + 6]))
      score += 60;
  }

  // Won diagonals
  if ((major[0] === major[4] && major[0] === major[8]) ||
    (major[2] === major[4] && major[2] === major[6]))
    score += 60;

  return score;
}
