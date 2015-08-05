package fr.djx.snake.core;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.inject.Inject;

import org.springframework.stereotype.Component;

import fr.djx.snake.core.SnakeCommands.SnakeClientCommands;
import fr.djx.snake.core.SnakeCommands.SnakeServerCommands;
import fr.djx.snake.core.SnakeGame.SnakeGameMod;
import fr.djx.snake.core.i.SnakeConnector;
import fr.djx.snake.core.i.SnakeDatas;
import fr.djx.snake.core.i.SnakeMethods;
import fr.djx.snake.errors.SnakeException;
import fr.djx.snake.errors.SnakeMessageException;
import fr.djx.snake.ws.SnakeMessage;
import fr.djx.snake.ws.SnakeMessageClient;

@Component
public class SnakeLogic implements SnakeConnector, SnakeMethods, SnakeDatas {

	private static final Logger logger = Logger.getLogger(SnakeLogic.class
			.getName());

	public static final String SERVER_ID = "0";

	public Map<String, SnakePlayer> players = new HashMap<>();
	public Map<Integer, SnakeGame> games = new HashMap<>();

	@Inject
	public SnakeCommands commands;

	protected SnakeLogic() {

	}

	@Override
	public void restore() {

	}

	@Override
	public void backup() {

	}

	@Override
	public SnakePlayer findPlayer(String nameOrID) {
		if (players.containsKey(nameOrID))
			return players.get(nameOrID);
		for (SnakePlayer player : players.values()) {
			if (player.getName().equals(nameOrID))
				return player;
		}
		return null;
	}

	@Override
	public SnakeGame findGame(String gameName) {
		for (SnakeGame game : games.values()) {
			if (game.getName().equals(gameName))
				return game;
		}
		return null;
	}

	@Override
	public SnakePlayer getPlayer(String source) {
		return players.get(source);
	}

	@Override
	public SnakeGame getGame(int gameID) {
		return games.get(gameID);
	}

	@Override
	public SnakeGame getGame(String nameOrID) {
		if (nameOrID.matches("\\d+")) {
			int gameID = Integer.parseInt(nameOrID);
			return getGame(gameID);
		} else {
			return findGame(nameOrID);
		}
	}

	@Override
	public void compute(SnakeMessage message) throws SnakeException {

		try {
			SnakeClientCommands command = SnakeClientCommands.valueOf(message
					.getCmd().toUpperCase());
			SnakePlayer player = players.get(message.getSource());

			command.compute(player, message);
		} catch (IllegalArgumentException e) {
			throw new SnakeMessageException("invalid command "
					+ message.getCmd());
		}

	}

	@Override
	public void enter(SnakeMessageClient client) {

		SnakePlayer joiner = SnakePlayer.create(client);

		// the new player is notified
		send(SERVER_ID, joiner, SnakeServerCommands.HEY, client.getID()
				.toString());
		for (SnakePlayer player : players.values()) {
			send(SERVER_ID, joiner, SnakeServerCommands.ENTER, player.getID(),
					player.getName(), player.getScore() + "");
		}

		// now all the world is notified
		players.put(client.getID(), joiner);
		broadcast(SERVER_ID, SnakeServerCommands.ENTER, joiner.getID(),
				joiner.getName(), joiner.getScore() + "");

		for (SnakeGame game : games.values()) {
			send(SERVER_ID, joiner, SnakeServerCommands.CREATE_GAME, game
					.getID().toString(), game.getName());
			for (SnakePlayer p : game.getPlayers())
				send(SERVER_ID, joiner, SnakeServerCommands.JOIN_GAME, game
						.getID().toString(), p.getID());
		}

		logger.fine("clients count : " + players.size());

	}

	@Override
	public void leave(SnakeMessageClient client) {

		SnakePlayer leaver = players.remove(client.getID());
		SnakePlayer.destroy(leaver);

		if (leaver.getGame() != null) {
			broadcast(leaver.getID(), SnakeServerCommands.QUIT_GAME,
					leaver.getID());
			// player.getGame().killSnake(player);
			leaver.getGame().removePlayer(leaver);
		}

		broadcast(SERVER_ID, SnakeServerCommands.LEAVE, client.getID()
				.toString());

		logger.fine("clients count : " + players.size());

	}

	@Override
	public synchronized void send(String source, SnakePlayer destination,
			SnakeServerCommands command, String... args) {

		if (!command.equals(SnakeServerCommands.PONG))
			logger.info("unicast command " + command.name() + " args.length="
					+ args.length);
		destination.client.send(source, command.name(), args);

	}

	@Override
	public void broadcast(String source, SnakeServerCommands command,
			String... args) {

		broadcast(source, players.values(), command, args);

	}

	private synchronized void broadcast(String source,
			Collection<SnakePlayer> players, SnakeServerCommands command,
			String... args) {
		/*
		 * logger.info("broadcast command " + command.name() + " args.length=" +
		 * args.length);
		 */
		for (SnakePlayer player : players) {
			player.client.send(source, command.name(), args);
			// send(source, player, command, args);
		}

	}

	@Override
	public void talk(SnakePlayer player, String message) {
		broadcast(player.getID(), SnakeServerCommands.TALK, message);
	}

	@Override
	public void wisp(SnakePlayer source, SnakePlayer destination, String message) {
		send(source.getID(), destination, SnakeServerCommands.WISP, message);
		send(source.getID(), source, SnakeServerCommands.WISP, message);
	}

	@Override
	public SnakeGame createGame(SnakePlayer source, String gameName)
			throws SnakeException {
		if (findGame(gameName) != null)
			throw new SnakeException("a game with this name already exists");
		SnakeGame game = new SnakeGame(this, gameName);
		games.put(game.getID(), game);
		broadcast(source.getID(), SnakeServerCommands.CREATE_GAME, game.getID()
				.toString(), game.getName());
		return game;
	}

	@Override
	public void destroyGame(SnakePlayer source, SnakeGame game)
			throws SnakeException {
		game.end();
		games.remove(game.getID());
		for (SnakePlayer player : game.getPlayers())
			player.setGame(null);
		broadcast(source.getID(), SnakeServerCommands.DESTROY_GAME,
				game.getID() + "");
	}

	@Override
	public void changeNick(SnakePlayer player, String nick) {
		String oldName = player.getName();
		player.setName(nick);
		broadcast(player.getID(), SnakeServerCommands.NICK, player.getID(),
				oldName, player.getName());
		logger.config("player " + player.getID() + " nick " + player.getName());
	}

	@Override
	public void quitGame(SnakePlayer player, SnakeGame game)
			throws SnakeException {
		if (!game.hasPlayer(player))
			throw new SnakeException("unable to leave this game");
		if (!game.removePlayer(player))
			throw new SnakeException("unable to leave running game");
		broadcast(player.getID(), SnakeServerCommands.QUIT_GAME, game.getID()
				.toString(), player.getID());
	}

	@Override
	public void joinGame(SnakePlayer player, SnakeGame game)
			throws SnakeException {
		if (game.hasPlayer(player))
			throw new SnakeException("already in this game");
		if (game.getPlayers().size() >= 4)
			throw new SnakeException("game is full");
		if (player.getGame() != null && !player.getGame().equals(game)) {
			quitGame(player, player.getGame());
		}
		if (!game.addPlayer(player))
			throw new SnakeException("unable to join running game");
		send(SERVER_ID, player, SnakeServerCommands.RESET_GAME);
		broadcast(player.getID(), SnakeServerCommands.JOIN_GAME, game.getID()
				.toString(), player.getID());
		if (game.getLevel() != 0)
			send(SERVER_ID, player, SnakeServerCommands.CONFIG_GAME, "level",
					game.getLevel() + "");
		send(SERVER_ID, player, SnakeServerCommands.CONFIG_GAME, "mod", game
				.getMod().name().toLowerCase());
	}

	@Override
	public void startGame(SnakeGame game) throws SnakeException {
		if (game.isRunning())
			throw new SnakeException("already running game");
		// will maybe randomize start-order in another version of the game
		Integer order = 0;
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.RESET_GAME);
		for (SnakePlayer p : game.getPlayers())
			broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.SNAKE,
					p.getID(), (order++).toString());
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.START);
		game.begin();
	}

	@Override
	public void stopGame(SnakeGame game, SnakePlayer winner)
			throws SnakeException {
		if (!game.isRunning())
			throw new SnakeException("already stopped game");
		game.end();
		if (winner != null)
			winner.addWin();
		for (SnakePlayer p : game.getPlayers())
			send(SERVER_ID, p, SnakeServerCommands.STOP,
					winner != null ? winner.getID() : null);
	}

	@Override
	public void stepGame(SnakeGame game) {
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.STEP);
	}

	@Override
	public void moveSnake(SnakePlayer player, int direction)
			throws SnakeException {
		SnakeGame game = player.getGame();
		if (!player.getGame().isRunning())
			throw new SnakeException("game is not running");
		// player.setDirection(direction);
		broadcast(player.getID(), game.getPlayers(), SnakeServerCommands.MOVE,
				player.getID(), direction + "");
	}

	@Override
	public void killSnake(SnakePlayer player) {
		player.getGame().killSnake(player);
		broadcast(player.getID(), player.getGame().getPlayers(),
				SnakeServerCommands.KILL, player.getID());
	}

	@Override
	public void eatFood(SnakePlayer player) {
		player.getGame().eatFood(player);
	}

	@Override
	public void addFood(SnakeGame game, int x, int y, int type) {
		game.addFood(type);
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.FOOD, ""
				+ x, "" + y);
	}

	@Override
	public void requestFood(SnakePlayer pilot, int type) {
		send(SERVER_ID, pilot, SnakeServerCommands.CREATE_FOOD, type + "");
	}

	@Override
	public void pauseGame(SnakeGame game, boolean state) throws SnakeException {
		if (!game.pause(state))
			throw new SnakeException("impossible to pause game");
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.PAUSE,
				state + "");
	}

	@Override
	public void configureGame(SnakePlayer player, String key, String value)
			throws SnakeException {
		SnakeGame game = player.getGame();
		Object valueObject = null;
		switch (key) {
		case "level":
			valueObject = Integer.parseInt(value);
			break;
		case "mod":
			valueObject = SnakeGameMod.valueOf(value.toUpperCase());
			break;
		default:
			throw new SnakeException("invalid configuration key");
		}
		if (game.configure(key, valueObject)) {
			broadcast(player.getID(), game.getPlayers(),
					SnakeServerCommands.CONFIG_GAME, key, value);
		} else {
			throw new SnakeException("unable to configure a running game");
		}
	}

	@Override
	public void ping(SnakePlayer player) {
		send(SERVER_ID, player, SnakeServerCommands.PONG);
	}

	@Override
	public void slimFast(SnakeGame game) {
		broadcast(SERVER_ID, game.getPlayers(), SnakeServerCommands.SLIM);
	}

}
