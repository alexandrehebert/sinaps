
// ----------------------------------------------------------------------------
// connected mod :

var WSOCKET = false;
var WSCONNECTED = false;

$(function() {
    
	$(document).keydown(function(e) {
        if (online()) {
			var keyCode = e.key;
			var keySet, directionCode;
			if (keyCode == $.ui.keyCode.ENTER) {
				if (!running()) {
					wssend('start');
					return false;
				}
            } else if (keyCode == $.ui.keyCode.ESCAPE) {
				if (running()) {
					wssend('stop');
					return false;
				}
            } else if (keyCode == $.ui.keyCode.SPACE) {
				if (running() || paused()) {
					// play | pause
					wssend("pause", [ '' + !paused() ]);
					return false;
				}
			} else if ((directionCode = KEYSETS.indexOf(keyCode)) != -1) {
				if (running()) {
					keySet = Math.floor(directionCode / 4);
					for (var k in SNAKES) {
						var s = SNAKES[k];
						if (s.getID() == me()) {
							// s.addDirection(directionCode % 4);
							wssend("move", [ '' + (directionCode % 4) ]);
							e.stopImmediatePropagation();
							break;
						}
					}
					return false;
				}
			}
		}
    }).bind('online', function(e) {
		$(this).view(e.state ? 'online' : 'offline');
	});
	
	$('[name=snake-mod]').change(function(e) {
        if (online()) {
			wssend('config', [ 'mod', $(this).val() ]);
		}
	});
	
    $('[name=snake-talk-input]').keydown(function(e) {
        if (online()) {
			var keyCode = (e.keyCode || e.which);
			if (keyCode == $.ui.keyCode.ENTER) {
				var cmd = $.trim($(this).val());
				if (cmd !== "") {
					var c, a;
					if (cmd.indexOf('/') != 0) {
						c = 'talk';
						a = cmd;
					} else {
						cmd = cmd.match(/\/([a-z]+)(\s.+|)/i);
						c = cmd[1];
						a = $.trim(cmd[2]);
					}
					if (messenger.send(c, a))
						$(this).val('');
				}
			}
			e.stopPropagation();
		}
    });
    
	$('[name=snake-game-name]').keydown(function(e) {
        if (online()) {
			var keyCode = (e.keyCode || e.which);
			if (keyCode == $.ui.keyCode.ENTER) {
				$('[name=snake-game-manage]').click();
			}
			e.stopPropagation();
		}
	});
    
	$('[name=snake-game-manage]').click(function(e) {
        if (online()) {
			var gameName = $('[name=snake-game-name]').val().trim();
			if (gameName != '') {
				wssend('game', ['create', gameName]);
				$('[name=snake-game-name]').val('');
			}
		}
	});
	
	$(document).on('click', '.snake-games-list > .snake-item', function(e) {
        if (online() && !running()) {
			if ($(this).attr('data-game-id') !== 'offline') {
				wssend('game', ['join', '' + $(this).data('game-id')]);
			} else {
				e.preventDefault();
				return false;
			}
		}
	});
	
	$('[name=snake-talk-enable]').attr("checked", null).attr("disabled", (!WebSocket ? "disabled" : null)).change(function(e) {
		if ($(this).is(':checked')) {
			wsopen($('[name=snake-server-url]').val());
		} else {
			wsclose();
		}
	});

	$('select[name=snake-level]').change(function(e) {
        if (online()) {
			if ($(this).val() !== '') {
				wssend("config", [ "level", $(this).val() ]);
			}
		}
    })

    game /* .bind("start", function(e) {
        if (online()) {
            return false; // stopping propagation
        }
    }).bind("step", function(e) {
		if (online()) {
            return false;
		}
	}) */ .bind("eat", function(e) {
        if (online()) {
			if (e.snake === me()) wssend("eat");
		}
	}).bind("kill", function(e) {
		if (online()) {
			if (e.snake === me()) wssend("kill", [ e.snake ]);
		}
	});
    
    messenger.bind('send', function(e) {
        var cmd = e.cmd,
            args = (cmd == "talk" || e.text == "")
				? [e.text] : e.text.match(/(".*?"|[a-z0-9_\\-\\.\\,]+)/gi).map(function(i) {
					if (i.indexOf("\"") == 0 && i.length > 1) {
						return i.substr(1, i.length-2);
					} return i;
				});
		
        return wssend(cmd, args);
	});
    
    window.onbeforeunload = function() {
        wsclose();
    };

});

function wsopen(url) {

    if (WSCONNECTED) {
        return;
    }
	
    $('[name=snake-talk-enable]').attr('disabled', 'disabled');
    $('[for=snake-talk-enable]').text('...');
	
	if (!WebSocket) {
		// blue screen of the death, dude
		$('[for=snake-talk-enable]')
			.html('<span style="color: white; background-color: blue;">BSOTD</span>');
		return;
	}
	
	WSOCKET = new WebSocket(url);
	
    WSOCKET.onopen = function() {
        messenger.notify('connection opened');
        d('ws', 'connected');
        $('[name=snake-talk-enable]').attr('checked', 'checked')
            .attr('disabled', null);
        $('[for=snake-talk-enable]').text('On');
		WSPING = setInterval(ping, 2000);
        WSCONNECTED = true;
		$(document).online(true);
    };
	
    WSOCKET.onmessage = function(e) {
        var message = $.parseJSON(e.data);
        setTimeout(function() {
			wsreceive(message.cmd, message.source, message.args)
		}, 1);
    };
	
    WSOCKET.onerror = function(e) {
        messenger.notify('connection ' + (WSCONNECTED ? 'lost' : 'is not opened'));
        d('ws', e.type);
    };
	
    WSOCKET.onclose = function () {
        $('[name=snake-talk-enable]').attr('checked', null)
            .attr('disabled', null);
        $('[for=snake-talk-enable]').text('Off');
		$('#ping').text('-');
        WSCONNECTED = false;
		manager.players.clear();
		manager.games.clear();
		games.children(':not([data-game-id=offline])').remove();
		players.children(':not([data-player-id^=offline])').remove();
		if (typeof WSPING !== 'undefined') clearInterval(WSPING);
		delete WSPING;
		$(document).online(false);
    };
	
}

function wsclose() {
    if (!wsconnected()) {
        return;
    }
    $('[name=snake-talk-enable]').attr('disabled', 'disabled');
    $('[for=snake-talk-enable]').text('...');
    WSOCKET.close();
    WSOCKET = null;
}

function wsreceive($cmd, $source, $args) {
    switch ($cmd) {
    case 'step':
        game.step();
        break;
	case 'snake':
		game.snake($args[0], $args[1]);
		break;
    case 'move':
        game.move($args[0], parseInt($args[1]));
        break;
    case 'food':
        game.food($args[0], $args[1], $args[2]);
        break;
	case 'create_food':
		var foodCell = randCell();
		wssend('food', [foodCell.x, foodCell.y]);
		break;
	case 'slim':
		game.slim();
		break;
    case 'wisp':
    case 'talk':
        messenger.talk(manager.players.get($source).name, $args[0]);
        break;
    case 'config_game':
        if ($args[0] == 'level') game.level(parseInt($args[1]));
		else if ($args[0] == 'mod') game.mod($args[1]);
        messenger.notify("property '" + $args[0] + "' setted to '" + $args[1] + "'");
        break;
    case 'start':
        game.start();
        break;
	case 'pause':
		game.pause();
        break;
    case 'stop':
        game.stop($args[0]);
        break;
    case 'pause':
        game.pause();
        break;
	case 'reset_game':
		game.reset();
		break;
    case 'create_game':
        messenger.notify("game '" + $args[1] + "' created");
        games.create($args[0], $args[1]);
        break;
    case 'destroy_game':
        messenger.notify("game '" + manager.games.get($args[0]).name + "' destroyed");
        games.destroy($args[0]);
        break;
    case 'join_game':
        messenger.notify("player '" + 
			manager.players.get($args[1]).name + "' join '" + 
			manager.games.get($args[0]).name + "'");
        games.join($args[0], parseInt($args[1]));
        break;
    case 'quit_game':
        messenger.notify("player '" + 
			manager.players.get($args[1]).name + "' quit '" + 
			manager.games.get($args[0]).name + "'");
        games.quit($args[0], $args[1]);
        break;
	case 'kill': break;
	/*case 'kill':
		// game.kill(snake.getID());
		break;*/
	case 'nick':
		players.nick($args[0], $args[2]);
        messenger.notify("rename '" + $args[1] + "' in '" + $args[2] + "'");
        break;
	case 'hey':
		SNAKEID = $args[0];
		break;
	case 'enter':
        messenger.notify("player '" + $args[1] + "' enter");
		players.enter($args[0], $args[1], parseInt($args[2]));
        break;
	case 'leave':
        messenger.notify("player '" + 
			manager.players.get($args[1]).name + "' leave");
		players.leave($args[0]);
        break;
	case 'log':
		d('log', $args.join(', '));
		break;
	case 'pong':
		_pong = +new Date;
		$('#ping').text((_pong - _ping));
		break;
    case 'error':
        messenger.notify('<strong style="color: red;">error</strong> ' + $args[0]);
        break;
    default:
        d('ws', 'unkown command : ' + $cmd);
        break;
    }
}

function wsconnected() {
    return WSCONNECTED;
}

function wssend($cmd, $args) {
    if (!wsconnected()) {
        return false;
    }
    return WSOCKET.send($.toJSON({cmd: $cmd, args: $args}));
}

var _ping = 0;
var _pong = 0;
function ping() {
	_ping = +new Date;
	wssend('ping');
}