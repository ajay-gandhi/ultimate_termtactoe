# Ultimate TermTacToe

Ultimate TermTacToe is the next generation of Tic Tac Toe. Featuring all-new
gameplay, a refreshing interface, and strategy beyond imagination, Ultimate
TermTacToe tests the bounds of your thinking ability.

Lol, jk. It's really just regular Tic Tac Toe, but with 9 simultaneous boards.
Winning a single one of these mini boards is all fine and good, but to win the
entire game, you have to win a row, column, or diagonal of the major board.

![Gameplay](https://raw.githubusercontent.com/ajay-gandhi/ultimate_termtactoe/master/img/v0.1.0.png)

## Playing

Install Node.js, then npm install this repo:

    $ npm install -g ajay-gandhi/ultimate_termtactoe

Run `tictactoe` or `ultimate-tictactoe` to display options:

    $ tictactoe

### Server Multiplayer

There is also an option to create a server so that you can play against someone
on a different computer:

    $ ./app.js -m            # Create a server
    $ ./app.js -c host:port  # Connect to a server

When you host a server, it will print the host and port the second player should connect to.

The server is implemented using Socket.io.

## Features

~~Right now, the game can only be played on a single computer with another
human.~~
I'm thinking of adding these features though:

 * ~~An AI for you to play against~~ _Done_ But it's really weak. I'm trying to
   improve the heuristics, and I'm pretty sure there are a few bugs with the
   minimax algorithm too :(
 * ~~A local server so that you can play against someone on another computer~~
   _Done_
