
var PLAYERS = [];
var GAMES = [];

$(function() {
	
	manager = new SnakeManager();
	
	players.bind('enter', function(e) {
		var $score = e.score, $name = e.name, $player = e.player;
		manager.players.add($player, $name, $score);
	})
	.bind('leave', function(e) {
		manager.players.remove(e.player);
	})
	.bind('nick', function(e) {
		var $id = e.player, $name = e.name;
		manager.players.rename($id, $name);
	});
	
	games.bind('join', function(e) {
		var $game = e.game, $player = e.player, $order = e.order;
		if (typeof $order === 'undefined') {
			$order = Object.size(GAMES[$game].players);
			e.order = $order;
		}
	    manager.games.addPlayer($game, $player, $order);
	})
	.bind('quit', function(e) {
		var $game = e.game, $player = e.player;
	    manager.games.removePlayer($game, $player);
	})
	.bind('create', function(e) {
		var $game = e.game, $name = e.name;
		manager.games.add($game, $name);
	})
	.bind('destroy', function(e) {
		var $game = e.game;
		manager.games.remove($game);
	});
	
});

function SnakeManager() {
	
	var m = this;
	
	m.players = new SnakePlayers();
	m.games = new SnakeGames();
	
}

function SnakePlayers() {
	
	var p = this;
	
	p.add = function($id, $name, $score) {
		PLAYERS["" + $id] = {id: $id, name: $name, score: $score};
	};

	p.rename = function($id, $name) {
		PLAYERS["" + $id].name = $name;
	};
	
	p.remove = function($id) {
		delete PLAYERS["" + $id];
		for (g in GAMES) {
			if ($id in GAMES[g].players) {
				manager.games.removePlayer(g, $id);
				break;
			}
		}
	};
	
	p.get = function($id) {
		return PLAYERS["" + $id];
	};
	
	p.clear = function() {
		PLAYERS = [];
	};

}

function SnakeGames() {
		
	var g = this;
	
	g.add = function($id, $name) {
		GAMES["" + $id] = {id: $id, name: $name, players: []};
	};

	g.remove = function($id) {
		delete GAMES["" + $id];
	};

	g.addPlayer = function($game, $player, $order) {
		if (typeof $order === 'undefined') $order = Object.size(GAMES[$game].players);
		GAMES[$game].players[$player] = { id: $player, order: $order };
	};

	g.removePlayer = function($game, $player) {
		delete GAMES[$game].players[$player];
	};
	
	g.clear = function() {
		GAMES = [];
	};

}

/* **

var SNAKES = [];
var PLAYERS = [];
var GAMES = [];

$(function() {
	
	db = $.indexedDB("snakeDatas", {
		"schema": {
			"1": function(t) {
				t.createObjectStore("players");
			},
			"2": function(t) {
				t.createObjectStore("games");
			},
			"3": function(t) {
				t.createObjectStore("players-games");
			}
		}
	});
	
	manager = new SnakeManager();
	
	players.bind('enter', function(e) {
		var $score = e.score, $name = e.name, $player = e.player;
		manager.players.add($player, $name, $score);
	})
	.bind('leave', function(e) {
		manager.players.remove(e.player);
	})
	.bind('nick', function(e) {
		var $id = e.player, $name = e.name;
		manager.players.rename($id, $name);
	});
	
	games.bind('join', function(e) {
		var $game = e.game, $player = e.player, $order = e.order;
		if (typeof $order === 'undefined') {
			$order = Object.size(GAMES[$game].players);
			e.order = $order;
		}
	    manager.games.addPlayer($game, $player, $order);
	})
	.bind('quit', function(e) {
		var $game = e.game, $player = e.player;
	    manager.games.removePlayer($game, $player);
	})
	.bind('create', function(e) {
		var $game = e.game, $name = e.name;
		manager.games.add($game, $name);
	})
	.bind('destroy', function(e) {
		var $game = e.game;
		manager.games.remove($game);
	});
	
});

function SnakeManager() {
	
	var m = this;
	
	m.players = new SnakePlayers();
	m.games = new SnakeGames();
	
}

function SnakePlayers() {
	
	var p = this;
	var tPlayers = db.objectStore("players", {
		"keyPath": "id",
		"autoIncrement": false
	});
	
	p.add = function($id, $name, $score) {
		//db.transaction(["players"]).then(function() {}, function() {}, function(t) {
		if (typeof $score === "undefined") $score = 0;
		tPlayers.add({
			"id": '' + $id,
			"name": $name,
			"score": $score
		}, parseInt($id));
		//});
	};

	p.rename = function($id, $name) {
		var player = p.get($id);
		player.name = $name;
		db.objectStore("players").update(player);
	};
	
	p.remove = function($id) {
		tPlayers.remove(parseInt($id));
		for (g in GAMES) {
			if ($id in GAMES[g].players) {
				manager.games.removePlayer(g, $id);
				break;
			}
		}
	};
	
	p.get = function($id) {
		var player = null;
		tPlayers.get(parseInt($id)).then(function(e) {
			player = e;
		}, function() {player = false;});
		while (player == null);
		return player;
	};
	
	p.clear = function() {
		tPlayers.openCursor()
		.deleteEach(function(value, key) {
			return true;
		});
	};

}

function SnakeGames() {
		
	var g = this;
	
	g.add = function($id, $name) {
		GAMES["" + $id] = {id: $id, name: $name, players: []};
	};

	g.remove = function($id) {
		delete GAMES["" + $id];
	};

	g.addPlayer = function($game, $player, $order) {
		if (typeof $order === 'undefined') $order = Object.size(GAMES[$game].players);
		GAMES[$game].players[$player] = { id: $player, order: $order };
	};

	g.removePlayer = function($game, $player) {
		delete GAMES[$game].players[$player];
	};
	
	g.clear = function() {
		GAMES = [];
	};

}

 ** */