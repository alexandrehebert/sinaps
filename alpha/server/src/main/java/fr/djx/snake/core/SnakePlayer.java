package fr.djx.snake.core;

import java.util.HashMap;
import java.util.Map;

import fr.djx.snake.ws.SnakeMessageClient;

public class SnakePlayer {

	public/* final */SnakeMessageClient client;
	private String _name;
	private SnakeGame _game;
	private int _score = 0;

	private static final Map<String, SnakePlayer> disconnected = new HashMap<>();

	public SnakePlayer(SnakeMessageClient client) {
		this.client = client;
		this.setName("player$" + client.getID());
	}

	public void setName(String name) {
		this._name = name;
	}

	public String getName() {
		return _name;
	}

	public void setGame(SnakeGame game) {
		_game = game;
	}

	public SnakeGame getGame() {
		return _game;
	}

	public String getID() {
		return client.getID().toString();
	}

	public void addWin() {
		_score++;
	}

	public int getScore() {
		return _score;
	}

	public static SnakePlayer create(SnakeMessageClient client) {
		SnakePlayer join = disconnected.containsKey(client.getAddr()) ? disconnected
				.get(client.getAddr()) : new SnakePlayer(client);
		join.client = client;
		disconnected.remove(join.client.getAddr());
		return join;
	}

	public static void destroy(SnakePlayer leave) {
		disconnected.put(leave.client.getAddr(), leave);
	}

}
