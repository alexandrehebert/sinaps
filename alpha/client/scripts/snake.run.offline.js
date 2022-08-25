
// ----------------------------------------------------------------------------
// disconnected mod :

var SPEED = 250;
var FOODS = 0;
var SPEEDUP = false;
var RUN = false;
var OFFLINEG = 'offline';
var FOODS_DISP = 0;

$(function() {
    
    // players.enter('offline1', 'Offline Player 1');
    games.create(OFFLINEG, 'Offline Game'); //.join(OFFLINEG, 'offline1');
	
    $(document).keydown(function(e) {
		if (!online()) {
			var keyCode = e.key;
            if (keyCode == $.ui.keyCode.ENTER) {
				if ($('.snake-players-list .snake-item').length > 0)
					game.reset().start();
            } else if (keyCode == $.ui.keyCode.ESCAPE) {
                game.stop();
            } else if (keyCode == $.ui.keyCode.SPACE) {
				// play | pause
				game.pause();
				return false;
			} else if ((directionCode = KEYSETS.indexOf(keyCode)) != -1) {
				keySet = Math.floor(directionCode / 4);
				if (running()) {
					for (var k in SNAKES) {
						var s = SNAKES[k];
						if ((!online() && s.getOrder() == keySet)
								|| (online() && s.getID() == me())) {
							game.move(s.getID(), directionCode % 4);
							e.stopImmediatePropagation();
							break;
						}
					}
					return false;
				} else if (!paused()) {
					var newP = true;
					var g = GAMES[OFFLINEG].players;
					for (var p in g) {
						if (g[p].order !== keySet) continue;
						newP = false;
						break;
					}
					if (newP) {
						var idP = 'offline' + (keySet+1);
						players.enter(idP, 'Offline P' + (keySet+1));
						games.join(OFFLINEG, idP, keySet);
					}
					return false;
				}
			}
		}
    });
	
	$('select[name=snake-level]').change(function(e) {
		if (!online()) {
			if (!game.reset().level($(this).val())) {
				e.preventDefault();
				return false;
			}
		}
    })
	
    game.bind('reset', function(e) {
		if (!online()) {
            FOODS = 0;
            SPEED = 250;
            SPEEDUP = false;
			FOODS_DISP = 0;
        }
    }).bind('start', function(e) {
		if (!online()) {
            if (RUN) {
                throw "already running";
            }
            for (var p in GAMES[OFFLINEG].players) {
                p = GAMES[OFFLINEG].players[p];
                game.snake(p.id, p.order);
            }
            RUN = setInterval(standaloneRunStep, SPEED);
            return false;
        }
    }).bind('pause', function(e) {
		if (!online()) {
			if (e.state) {
				clearInterval(RUN);
			} else {
				RUN = setInterval(standaloneRunStep, SPEED);
			}
		}
    }).bind('step', function() {
		if (!online()) {
			var alives = 0, snakes = 0, potentialWinner;
			for (var s in SNAKES) {
				s = SNAKES[s];
				if (!s.isDead()) {
					alives++;
					potentialWinner = s;
				}
				snakes++;
			}
			if ((snakes > 1 && alives <= 1) || (snakes == 1 && alives == 0)) {
				if (RUN == null) {
					throw "not running";
				}
				game.stop(potentialWinner);
				return false;
			} else {
				for (var i=0; i<snakes-FOODS_DISP; i++) {
					var f = randCell();
					game.food(f.x, f.y);
				}
				if (SPEEDUP) {
					SPEEDUP = false;
					SPEED = Math.round(SPEED - (SPEED * 0.2));
					if (SPEED < 20) SPEED = 20;
					clearInterval(RUN);
					RUN = setInterval(standaloneRunStep, SPEED);
				}
			}
		}
    }).bind('stop', function(e) {
		if (!online()) {
			clearInterval(RUN);
			RUN = false;
		}
    }).bind('food', function(e) {
		if (!online()) {
			FOODS_DISP++;
			if (FOODS++ > 0 && (FOODS-1) % 10 == 0) {
				SPEEDUP = true;
			}
		}
    }).bind('eat', function(e) {
		if (!online()) {
			FOODS_DISP--;
		}
	});
    
});

function standaloneRunStep() {
    game.step();
}

