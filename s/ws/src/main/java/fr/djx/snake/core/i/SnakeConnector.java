package fr.djx.snake.core.i;

import fr.djx.snake.core.SnakeCommands;
import fr.djx.snake.core.SnakePlayer;
import fr.djx.snake.core.SnakeCommands.SnakeServerCommands;
import fr.djx.snake.errors.SnakeException;
import fr.djx.snake.ws.SnakeMessage;
import fr.djx.snake.ws.SnakeMessageClient;

public interface SnakeConnector {

	void send(String source, SnakePlayer destination,
			SnakeServerCommands command, String... args);

	void broadcast(String source, SnakeServerCommands command, String... args);

	void enter(SnakeMessageClient snakeMessageClient);

	void leave(SnakeMessageClient snakeMessageClient);

	void compute(SnakeMessage message) throws SnakeException;

}
