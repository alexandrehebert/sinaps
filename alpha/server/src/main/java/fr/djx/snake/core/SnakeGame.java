package fr.djx.snake.core;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import fr.djx.snake.core.i.SnakeMethods;
import fr.djx.snake.errors.SnakeException;

public class SnakeGame {

	private static final Logger logger = Logger.getLogger(SnakeGame.class
			.getName());

	private static int UNIQUE_ID = 0;

	private final int id;
	private final String _name;
	private Thread _game;
	private List<SnakePlayer> _players = new ArrayList<>();
	private Map<SnakePlayer, Snake> _snakes = new HashMap<>();
	private int _stepCount = 0;
	private int _speed = 250;
	private int _foods = 0;
	private int _eats = 0;
	private int _foodPendingRequest = 0;
	private int _stayinAlive = 0;
	private int _sliMoment;
	private boolean _speedUp = false, _paused = false;

	private Map<String, Object> _properties = new HashMap<>();

	private final SnakeMethods logic;

	public SnakeGame(SnakeMethods methods, String gameName) {
		this.id = ++UNIQUE_ID;
		this._name = gameName.trim();
		this.logic = methods;
		this.configure("level", 0);
		this.configure("mod", SnakeGameMod.SNAKE);
	}

	public static interface RunnableGameMod {
		void run(SnakeGame game) throws SnakeException;
	}

	public static enum SnakeGameMod implements RunnableGameMod {

		SNAKE(new RunnableGameMod() {
			public void run(SnakeGame game) {
				// game food generation
				game.generateFood();
				// game acceleration
				game.speedUp();
			}
		}),

		SNUKE(new RunnableGameMod() {
			public void run(SnakeGame game) {

			}
		}),

		SNACK(new RunnableGameMod() {
			public void run(SnakeGame game) {

			}
		}),

		SMOKE(new RunnableGameMod() {
			public void run(SnakeGame game) {

			}
		}),

		SNUDE(new RunnableGameMod() {
			public void run(SnakeGame game) {
				// game food generation
				game.generateFood();
				if (game._stepCount != 0
						&& game._stepCount % game._sliMoment == 0) {
					if (game._sliMoment > 10)
						game._sliMoment--;
					game.logic.slimFast(game);
				}
			}
		});

		private final RunnableGameMod _mod;

		private SnakeGameMod(RunnableGameMod mod) {
			_mod = mod;
		}

		@Override
		public void run(SnakeGame game) throws SnakeException {
			try {
				_mod.run(game);
			} catch (Exception e) {
				throw new SnakeException(e.getMessage());
			}
		}

	}

	public boolean begin() {
		if (isRunning())
			return false;
		_stepCount = 0;
		_paused = false;
		_speedUp = false;
		_speed = 250;
		_foodPendingRequest = 0;
		_eats = 0;
		_foods = 0;
		_paused = false;
		_snakes.clear();
		_sliMoment = 40;
		_game = new Thread(new Runnable() {
			public void run() {
				logger.info("start game " + id);
				for (SnakePlayer player : getPlayers())
					_snakes.put(player, new Snake());
				_stayinAlive = _snakes.size(); // optimization
				SnakeGameMod _mod = getMod();
				try {
					while (_game != null) {
						if (_paused && _snakes.size() > 0
						/* || _foodPendingRequest > 0 */) {
							Thread.yield();
							continue;
						}
						if (_snakes.size() == 0 || _stayinAlive == 0
								|| (_snakes.size() > 1 && _stayinAlive <= 1)) {
							logic.stopGame(SnakeGame.this, getPotentialWinner());
						} else {
							_stepCount++;
							logic.stepGame(SnakeGame.this);
							_mod.run(SnakeGame.this);
							Thread.sleep(_speed);
						}
					}
				} catch (InterruptedException | SnakeException e) {
					logger.severe(e.getMessage());
				}
				try {
					if (isRunning())
						logic.stopGame(SnakeGame.this, getPotentialWinner());
				} catch (SnakeException ee) {
					ee.printStackTrace();
				}
				logger.info("stop game " + id);
			}
		});
		_game.start();
		return true;
	}

	private void speedUp() {
		// if (_stepCount > 0 && _stepCount % 20 == 0) {
		if (_speedUp) {
			_speedUp = false;
			_speed = (int) Math.round(_speed - (_speed * 0.07));
			if (_speed < 50)
				_speed = 50;
		}
	}

	private void generateFood() {
		if (_foodPendingRequest == 0) {
			SnakePlayer foodPilot = getFoodPilot();
			if (foodPilot != null) {
				int needFood = _snakes.size() - _foods;
				_foodPendingRequest = needFood;
				while (needFood-- > 0 && foodPilot != null)
					logic.requestFood(foodPilot, 0);
			}
		}
	}

	private SnakePlayer getPotentialWinner() {
		for (Map.Entry<SnakePlayer, Snake> e : _snakes.entrySet()) {
			if (e.getValue().isAlive())
				return e.getKey();
		}
		return null;
	}

	public boolean end() {
		if (!isRunning())
			return false;
		// Thread gameTemp = _game;
		_game = null;
		// gameTemp.interrupt();
		return true;
	}

	public boolean pause(boolean state) {
		if (!isRunning())
			return false;
		_paused = state;
		return true;
	}

	public String getName() {
		return _name;
	}

	public Integer getID() {
		return id;
	}

	public boolean isRunning() {
		// synchronized (_game) {
		return _game != null;
		// }
	}

	public boolean isPaused() {
		return _paused;
	}

	public void killSnake(SnakePlayer player) {
		if (_snakes.containsKey(player)) {
			_snakes.get(player).setAlive(false);
			_stayinAlive--;
		}
	}

	public void eatFood(SnakePlayer player) {
		if (_foods > 0) {
			_snakes.get(player).eat(0 /* FIXME TYPE */);
			_eats++;
			_foods--;
		}
	}

	public void addFood(int type) {
		_foods++; /* FIXME TYPE */
		_foodPendingRequest--;
		if (_eats != 0 && _eats % 10 == 0) {
			_speedUp = true;
		}
	}

	private SnakePlayer getFoodPilot() {
		for (Map.Entry<SnakePlayer, Snake> e : _snakes.entrySet()) {
			if (e.getValue().isAlive())
				return e.getKey();
		}
		return null;
	}

	public List<SnakePlayer> getPlayers() {
		return _players;
	}

	public boolean hasPlayer(SnakePlayer player) {
		return _players.contains(player);
	}

	public boolean removePlayer(SnakePlayer player) {
		killSnake(player);
		_players.remove(player);
		player.setGame(null);
		return true;
	}

	public boolean addPlayer(SnakePlayer player) {
		if (!isRunning()) {
			_players.add(player);
			player.setGame(this);
			return true;
		}
		return false;
	}

	public boolean configure(String key, Object value) {
		if (!isRunning()) {
			_properties.put(key, value);
			return true;
		}
		return false;
	}

	public Integer getLevel() {
		return (Integer) _properties.get("level");
	}

	public SnakeGameMod getMod() {
		return (SnakeGameMod) _properties.get("mod");
	}

}
