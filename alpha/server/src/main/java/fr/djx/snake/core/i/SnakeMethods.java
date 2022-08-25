package fr.djx.snake.core.i;

import fr.djx.snake.core.SnakeGame;
import fr.djx.snake.core.SnakePlayer;
import fr.djx.snake.errors.SnakeException;

public interface SnakeMethods {

	SnakePlayer findPlayer(String nameOrID);

	SnakeGame findGame(String gameName);

	SnakePlayer getPlayer(String source);

	SnakeGame getGame(int gameID);

	SnakeGame getGame(String nameOrID);

	SnakeGame createGame(SnakePlayer source, String gameName)
			throws SnakeException;

	void destroyGame(SnakePlayer source, SnakeGame game) throws SnakeException;

	void wisp(SnakePlayer source, SnakePlayer destination, String message);

	void changeNick(SnakePlayer player, String nick);

	void quitGame(SnakePlayer player, SnakeGame game) throws SnakeException;

	void joinGame(SnakePlayer player, SnakeGame game) throws SnakeException;

	void startGame(SnakeGame game) throws SnakeException;

	void stopGame(SnakeGame game, SnakePlayer winner) throws SnakeException;

	void pauseGame(SnakeGame game, boolean state) throws SnakeException;

	void addFood(SnakeGame game, int x, int y, int type);

	void eatFood(SnakePlayer player);

	void requestFood(SnakePlayer player, int type);

	void stepGame(SnakeGame game);

	void moveSnake(SnakePlayer player, int gameID) throws SnakeException;

	void configureGame(SnakePlayer player, String key, String value)
			throws SnakeException;

	void killSnake(SnakePlayer player);

	void talk(SnakePlayer player, String arg);

	void ping(SnakePlayer player);

	void slimFast(SnakeGame game);

}
