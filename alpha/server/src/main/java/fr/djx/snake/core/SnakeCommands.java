package fr.djx.snake.core;

import java.util.logging.Logger;

import javax.inject.Inject;

import org.springframework.stereotype.Component;

import fr.djx.snake.core.i.SnakeMethods;
import fr.djx.snake.errors.SnakeException;
import fr.djx.snake.errors.SnakeMessageException;
import fr.djx.snake.util.SnakeTools;
import fr.djx.snake.ws.SnakeMessage;

@Component
public class SnakeCommands {

	private static final Logger logger = Logger.getLogger(SnakeLogic.class
			.getName());

	public static enum SnakeClientCommands {

		START(SnakeCommands.START), //
		STOP(SnakeCommands.STOP), //
		TALK(SnakeCommands.TALK), //
		WISP(SnakeCommands.WISP), //
		PING(SnakeCommands.PING), //
		NICK(SnakeCommands.NICK), //
		GAME(SnakeCommands.GAME), //
		MOVE(SnakeCommands.MOVE), //
		CONFIG(SnakeCommands.CONFIG), //
		KILL(SnakeCommands.KILL), //
		PAUSE(SnakeCommands.PAUSE), //
		FOOD(SnakeCommands.FOOD), //
		EAT(SnakeCommands.EAT);

		private final SnakeCommand _command;

		SnakeClientCommands(SnakeCommand command) {
			_command = command;
		}

		public void compute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (_command != null) {
				_command.check(message);
				_command.execute(player, message);
			}
		}
	}

	public static enum SnakeServerCommands {
		START, STOP, TALK, WISP, PONG, HEY, BYE, //
		NICK, ENTER, LEAVE, CREATE_GAME, //
		DESTROY_GAME, JOIN_GAME, QUIT_GAME, STEP, //
		SNAKE, SPEEDUP, MOVE, FOOD, PAUSE, KILL, //
		CREATE_FOOD, RESET_GAME, MOD, CONFIG_GAME, //
		SLIM
	}

	public static SnakeMethods logic;

	@Inject
	public void setLogic(SnakeLogic logic) {
		this.logic = logic;
	}

	public SnakeCommands() {
		logger.info(SnakeClientCommands.values().length + " commands");
	}

	public static final SnakeCommand NICK = new SnakeCommand() {

		private String nick;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			logic.changeNick(player, nick);
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 1);
			nick = SnakeTools.normalize(message.getArg(0));
			if (nick.equals(""))
				throw new SnakeMessageException("invalid nick");
		}

	};

	public static final SnakeCommand WISP = new SnakeCommand() {

		private SnakePlayer destination;

		public void execute(SnakePlayer source, SnakeMessage message)
				throws SnakeException {
			logic.wisp(source, destination, message.getArg(1));
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 1);
			destination = logic.findPlayer(message.getArg(0));
			if (destination == null)
				throw new SnakeMessageException("unable to find '"
						+ message.getArg(0) + "' player");
			if (message.getSource().equals(destination.getID()))
				throw new SnakeMessageException("can't wisp to yourself");
		}

	};

	public static final SnakeCommand TALK = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			logic.talk(player, message.getArg(0));
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 1);
			if (message.getArg(0).trim().equals(""))
				throw new SnakeMessageException("can't send an empty message");
		}

	};

	public static final SnakeCommand PING = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			logic.ping(player);
		}

	};

	public static final SnakeCommand GAME = new SnakeCommand() {

		private SnakeGame game;
		private String subCmd;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			// switch to minimize commands
			switch (message.getArg(0).trim()) {
			case "create":
				String gameName = SnakeTools.normalize(message.getArg(1));
				if (gameName.equals(""))
					throw new SnakeMessageException("invalid game name");
				logic.createGame(player, gameName);
				break;
			case "destroy":
				logic.destroyGame(player, game);
				break;
			case "join":
				logic.joinGame(player, game);
				break;
			case "quit":
				logic.quitGame(player, game);
				break;
			default:
				throw new SnakeMessageException(
						"usage : /game (create|destroy|join|quit) nameOrID");
			}
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 2);
			subCmd = message.getArg(0).trim();
			if (!subCmd.equals("create")) {
				game = logic.getGame(message.getArg(1));
				if (game == null)
					throw new SnakeMessageException("unable to find this game");
			}
		}

	};

	public static final SnakeCommand MOVE = new SnakeCommand() {

		private int direction;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.moveSnake(player, direction);
			else
				throw new SnakeException("player is not linked to a game");
		}

		@Override
		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 1);
			direction = Integer.parseInt(message.getArg(0));
		}

	};

	public static final SnakeCommand CONFIG = new SnakeCommand() {

		private String key, value;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.configureGame(player, key, value);
			else
				throw new SnakeException("player is not linked to a game");
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 2);
			key = message.getArg(0);
			value = message.getArg(1);
		};

	};

	public static final SnakeCommand START = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.startGame(player.getGame());
			else
				throw new SnakeException("player is not linked to a game");
		}

	};

	public static final SnakeCommand STOP = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.stopGame(player.getGame(), null);
			else
				throw new SnakeException("player is not linked to a game");
		}

	};

	public static final SnakeCommand FOOD = new SnakeCommand() {

		private int x, y;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.addFood(player.getGame(), x, y, 0);
			else
				throw new SnakeException("player is not linked to a game");
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 2);
			x = Integer.parseInt(message.getArg(0));
			y = Integer.parseInt(message.getArg(1));
		};

	};

	public static final SnakeCommand EAT = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.eatFood(player);
			else
				throw new SnakeException("player is not linked to a game");
		}

	};

	public static final SnakeCommand KILL = new SnakeCommand() {

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.killSnake(player);
			else
				throw new SnakeException("player is not linked to a game");
		}

	};

	public static final SnakeCommand PAUSE = new SnakeCommand() {

		private boolean state;

		public void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException {
			if (player.getGame() != null)
				logic.pauseGame(player.getGame(), state);
			else
				throw new SnakeException("player is not linked to a game");
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
			checkArgs(message, 1);
			state = Boolean.parseBoolean(message.getArg(0));
		};

	};

	public static abstract class SnakeCommand {

		protected final void checkArgs(SnakeMessage message, int i)
				throws SnakeMessageException {
			if (message.getArgs().length < i)
				throw new SnakeMessageException("arguments missing");
		}

		public void check(SnakeMessage message) throws SnakeMessageException {
		}

		public abstract void execute(SnakePlayer player, SnakeMessage message)
				throws SnakeException;

	}

}