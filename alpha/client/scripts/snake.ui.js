
var graphics;

$(window).load(function() {
	$.preload([
		'i/fruits.png','i/wall.png','i/snake-3.png', 'i/portal-3.png', 
		'i/context.png', 'i/header.png'
	]);
});

$(function() {
    
    // cells = $('.snake-cell');
    
    $(document).keydown(function (e) {
        e.key = (e.keyCode || e.which);
    });
    
	$('#snake-snake').click(function() {
		alert('I\'m the banana king !');
	});
	
    $('select[name=snake-level]').val('');
	
	$('input').keydown(function(e) {
        e.key = (e.keyCode || e.which);
		e.stopPropagation();
	});
	
	$('[name=snake-map-scale]').attr("disabled", "disabled").val(SCALE).change(function() {
		var s = $(this).val() !== '' ? parseInt($(this).val()) : 100;
		rescaleLevel(s / 100);
	}).click(function() {
		var s = $(this).val() !== '' ? parseInt($(this).val()) : 100;
		rescaleLevel(s / 100);
	});

	$.jCanvas({
		// scale: SCALE,
		fromCenter: false,
		cropFromCenter: false,
		width: 10, height: 10,
		sWidth: 10, sHeight: 10,
		imageSmoothing: false
	});
	
});

$(function() {

	$(document)
	// player in da place
	.bind('enter', function(e) {
		var $score = e.score, $name = e.name, $id = e.player;
		if (typeof $score === 'undefined' || $score < 0) $score = 0;
		players.append($('<div data-player-id="' + $id + '" class="snake-item" />')
			.html($name + ' (<span class="snake-score">' + $score + '</span> wins)'));
	})
	// player leaves dat place
	.bind('leave', function(e) {
		$('[data-player-id=' + e.player + ']').remove();
	})
	// player renames himself
	.bind('nick', function(e) {
		var $id = e.player, $name = e.name;
		$('div[data-player-id=' + $id + ']')
			.html($name + ' (<span class="snake-score">' + manager.players.get($id).score + '</span> wins)');
		$('li[data-player-id=' + $id + ']').html($name);
	})
	// player joining a game
	.bind('join', function(e) {
		var $game = e.game, $player = e.player, $order = e.order;
		games.find('[data-game-id=' + $game + '] ul').append(
			'<li data-player-id="' + $player + '" style="color: ' + COLORS[$order] + ';">'
				+ manager.players.get($player).name + '</li>'
		);
	})
	// player leaving a game
	.bind('quit', function(e) {
		var $game = e.game, $player = e.player;
		$(this).find('[data-game-id=' + $game + '] ul li[data-player-id=' + $player + ']').remove();
		$(this).find('[data-game-id=' + $game + '] ul li').each(function(i, e) {
			$(this).css('color', COLORS[i]);
		});
	})
	// new game added
	.bind('create', function(e) {
		var $game = e.game, $name = e.name;
		games.append($('<div data-game-id="' + $game + '" class="snake-item" />')
			.html($name + '<ul></ul>'));
	})
	// old game removed
	.bind('destroy', function(e) {
		var $game = e.game;
		$('.snake-item[data-game-id=' + $game + ']').remove();
	})
	// switching mod
	.bind('mod', function(e) {
		$('[name=snake-mod][value=' + e.mod + ']').prop("selected", true);
	});
	// winner/looser toasting
	game.bind('stop', function(e) {
		var winner = e.winner ? manager.players.get(e.winner) : false;
		if (winner) {
			$(this).toast(winner ? winner.name + ' win' : 'draw');
			$('[data-player-id=' + e.winner + '] .snake-score').text(++winner.score);
		}
		else {
			$(this).toast('defeat');
		}
	}).bind('start', function(e) {
		$('input, select').blur();
	}).bind('level', function(e) {
		e.result.done(function() {
			$('[name=snake-level]').val(e.level);
		});
	});
	
});

// globals
var STEPID = 0;
var SNAKEID = 'snack';
var SNAKES = [];
var CELLS = [];
var LEVEL = 0;

// consts
var DIRECTION = { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3 };
var DIRECTIONS = [ DIRECTION.RIGHT, DIRECTION.UP, DIRECTION.LEFT, DIRECTION.DOWN ];
var DIMENSIONS = { HEIGHT: 20, WIDTH: 20 };
var DEGREES = [ 180, -90, 0, 90 ];
var WALLS = [ '+', '-', '|' ];
var STARTERS = [ '<', '^', '>', 'v' ];
var SCALE = 1;

var KEYSETS = [ 
    $.ui.keyCode.LEFT, 
    $.ui.keyCode.UP, 
    $.ui.keyCode.RIGHT, 
    $.ui.keyCode.DOWN,	// <^>v
    81, 90, 68, 83,		// QZDS
    100, 104, 102, 101,	// 4865
    75, 79, 77, 76		// KOML
];
var COLORS = [ 'green', 'purple', 'orange', 'blue' ];
var POSITIONS = [
    {x:0, y:0, d:DIRECTION.RIGHT},
    {x:19, y:0, d:DIRECTION.DOWN},
    {x:19, y:19, d:DIRECTION.LEFT},
    {x:0, y:19, d:DIRECTION.UP}
];

function SimpleSnake(id, defaultX, defaultY, defaultDirection, order) {

    var self = this;
    var id = id;
    var head;
    var parts;
    var eaten;
    var eatCount;
    var direction;
    var directions = [];
    var dead;
    var order = order;
	var preparedMove;
	var slimed = false;
    
    this.eat = function(meatType) {
		eaten++;
        eatCount++;
    };
	this.slim = function() {
		slimed = true;
	}
    // snake gameplay enhancement
     this.addDirection = function(d) {
	 
        if (self.isDead()) return;
        
        directions.push(d);
        if (directions.length > 2) directions.shift();
		
    };
    this.consumeDirection = function() {
	
        var nd, sd = self.getDirection();
        
        if (directions.length == 0) return sd;
        while ((nd = directions.shift()) !== undefined) {
            if (Math.abs(nd - sd) == 2) continue;
            setDirection(nd);
            break;
        }
        
        return self.getDirection();
		
    };
    this.move = function() {
        
		if (preparedMove == null) return;
		
        head = cell(preparedMove);
		head.d = preparedMove.d;
		head.s = id;
		gc(head, false);
		
		if (slimed) {
			gc(parts.shift(), true);
		}
        if (!eaten) {
			gc(parts.shift(), true);
		}
        eaten = 0;
		slimed = false;
        
        parts.push(head);
		
		var size = parts.length;
		if (size > 1) {
			parts[0].d = parts[1].d;
			parts[0].st = 0;
			if (parts[0].type == "food")
				parts[0].type = null; // no food anymore
		}
		
		head.st = 2;
		if (size > 2) {
			if (head.d !== parts[size-2].d) {
				var d = head.d - parts[size-2].d;
				if (d == -3) d = 1;
				else if (d == 3) d = -1;
				parts[size-2].st = d > 0 ? 3 : 4;
			} else parts[size-2].st = 1;
		}
		
		preparedMove = null;
        
    };
	this.prepareMove = function() {
		
        if (self.isDead()) return;
        
        var d = self.getDirection();
        var prev = head, next, first;
        var move = { x: head.x, y: head.y, d: d };
        
        if (prev.type == "portal" && prev.subtype == "in") {
            move.x = prev.xx;
            move.y = prev.yy;
        }
        else {
            switch (d) {
            case DIRECTION.LEFT: move.x--; break;
            case DIRECTION.UP: move.y--; break;
            case DIRECTION.RIGHT: move.x++; break;
            case DIRECTION.DOWN: move.y++; break;
            }
        }
        
        if (move.x < 0) move.x = CELLS[0].length-1;
        else if (move.x >= CELLS[0].length) move.x = 0;
        if (move.y < 0) move.y = CELLS.length-1;
        else if (move.y >= CELLS.length) move.y = 0;
		
		next = cell(move);
		if (next.type == "food") {
			self.eat(next.subtype);
			if (self.getParts().length == 1)
				parts[0].type = null; // no food anymore
		}
		
		preparedMove = move;
		
        // not good : id = 0 uniquement si on a pas mangé ? bug bug bug
		var q = (next.type !== null && next.type !== "portal") || (next.s !== null && (next.st == 1 || next.st > 2))
			? 0 : (parts.length == 1 ? null : 1);
		
		// snake queue is rooted when he eats or when he dies on a wall
		return { 
			h : (eaten < 0 && parts.length == 1 ? null : next), 
			q : (q == null ? null : cell(parts[q])), d: d 
		};
		
	}
    
    this.reset = function() {
        directions = [];
        direction = defaultDirection;
        head = cell(defaultX, defaultY);
		head.d = defaultDirection;
		head.s = id;
		head.st = 2;
        parts = [ head ];
        eaten = 0;
        eatCount = 0;
        dead = false;
		preparedMove = null;
		slimed = false;
    };
	
    this.getParts = function() {
        return parts;
    };
    this.getX = function() {
        return head.x;
    };
    this.getY = function() {
        return head.y;
    };
    this.getID = function() {
        return "" + id;
    };
    this.getEatCount = function() {
        return eatCount;
    };
    this.setDead = function(d) {
        dead = d === true;
    }
    this.isDead = function() {
        return dead;
    }
    this.getOrder = function() {
        return order;
    };
    var setDirection = function(d) {
        if (typeof d === 'undefined') return;
        direction = d;
    };
    this.getDirection = function() {
        return typeof direction === 'undefined' ? defaultDirection : direction;
    };
	this.hasEaten = function() {
		return eaten > 0;
	};
    
    this.reset();
    
}

var GC = [], NGC = [];
function gc(part, toDelete) {
	if (toDelete) {
		GC.push(part);
	}
	else {
		NGC.push(part);
	}
}

function rescaleLevel(scale) {
	SCALE = scale;
	$('#snake-scale').text(SCALE);
	var w = DIMENSIONS.WIDTH * SCALE * 10,
		h = DIMENSIONS.HEIGHT * SCALE * 10;
	graphics
		.css("width", w + "px")
		.css("height", h + "px");
	// fix a ff BUG (height+=4)
	game.css('height', graphics.css("height"));
}

function setLevel(id) {
    return $.ajax({
        url: 'f/levels/level-' + id + '.txt' + '?' + (+new Date),
        dataType: "csv"
    }).done(function(rows) {
        
        var portals = [];
		CELLS = [];
        DIMENSIONS.HEIGHT = rows.length;
        DIMENSIONS.WIDTH = rows[0].length;
		LEVEL = id;
		
		graphics.attr("width", DIMENSIONS.WIDTH * 10)
			.attr("height", DIMENSIONS.HEIGHT * 10);
		
		rescaleLevel(SCALE);
		
		graphics.clearCanvas({
			width: graphics.attr('width'),
			height: graphics.attr('height'),
		});
		
        $.each(rows, function(i, r) {
            if (r.length > 1) {
			
                var row = [];
                $.each(r, function(j, c) {
					
                    var tmp = $.trim(c);
					var cell = { x : j, y : i, d: 0, c: "black", type: null, subtype: null, s: null };
					
					// mur (carré||ligne)
                    if ((c = WALLS.indexOf(tmp)) >= 0) {
						if (c == 2) {
							c = 1; cell.d = 1;
						} else {
							cell.d = 1 ? 2 : 1;
						}
						addWall(cell, c);
                    }
					
					// portail (entrée||sortie)
					else if (c = tmp.match(/(@|§)([0-9A-Z])/)) {
                        var portalID = 'portal-' + c[2], subtype = (c[1] == '@' ? 'in' : 'out');
                        var p = (portalID in portals ? portals[portalID] : {});
						if (subtype === 'in') {
							if (subtype in p) p[subtype].push(cell);
							else p[subtype] = [ cell ];
						} else {
							p[subtype] = cell;
						}
                        portals[portalID] = p;
                        cell.type = "portal";
						cell.subtype = subtype;
                    }
					
					// point de départ de joueur (direction+order)
					else if (c = tmp.match(/([<>^v#])([0-9])/)) {
						var pID = parseInt(c[2])-1;
						var p = POSITIONS[pID];
						if ((c = STARTERS.indexOf(c[1])) >= 0) p.d = c;
						else p.d = DIRECTIONS[pID];
                        p.x = j; p.y = i;
                    }
					
					row.push(cell);
					
                });
				CELLS.push(row);
				
            }
        });
        
        for (p in portals) {
			p = portals[p];
            if (p && p['in'] && p['out']) {
				$.each(p['in'], function(j, inn) {
					addPortal(cell(inn), cell(p['out']));
				});
            }
        }
		
		$.each(CELLS, function(i, row) {
			$.each(row, function(j, c) {
				drawPart(c);
			});
		});
		
		if (CELLS.length) {
			$('[name=snake-map-scale]').attr("disabled", null);
		}
        
    });
}

function addFood(c) {
    c.type = "food";
	c.subtype = rand(4);
	drawPart(c);
}

function addWall(c, type) {
    c.type = "wall";
	c.subtype = type;
}

function addPortal(fromCell, toCell) {
    fromCell.type = "portal";
	fromCell.subtype = "in";
    toCell.type = "portal";
	toCell.subtype = "out";
    fromCell.xx = toCell.x;
    fromCell.yy = toCell.y;
}

function addSnake(id, order) {
    var p = POSITIONS[order];
    var s = new SimpleSnake(id, p.x, p.y, p.d, order);
    SNAKES[id] = s;
    return s;
}

function killSnake(id) {
	var snake = SNAKES[id];
    snake.setDead(true);
	d('core', "snake " + snake.getID() + " : invalid move");
}

function addToast(message) {
    $('p', toast).text(message.toUpperCase());
    toast.show();
}

function clearToast() {
    toast.hide();
}

function parseMessage($commandLine) {
    var args = [], c;
    while (c = (" " + $commandLine).match(/\s+([a-z0-9,.]+|\s+?".*?")/mi)) {
        args.push(c);
    }
    return args;
}

function addMessage($player, $text) {
	var name = ($player !== null ? '#' + $player : '@system');
    $('#snake-talk-output-textarea').append('<span style="color: ' + ($player !== null ? 'black' : 'gray') + '">'
		+ name + ': ' + $text + '</span><br />');
	var textarea = document.getElementById('snake-talk-output');
	textarea.scrollTop = textarea.scrollHeight;
	// dirty way but ...
}

function doSlimFast() {
	for (var s in SNAKES) {
		SNAKES[s].slim();
	}
}

function randCell() {
	var c;
	do {
		c = cell(rand(CELLS[0].length), rand(CELLS.length));
	} while (c.type !== null || c.s !== null);
    return c;
}

function rand(max) {
    return Math.floor((Math.random() * max * 10) + 1) % max;
}

function timestamp() {
    return Math.round(new Date().getTime() / 1000);
}

function cell(x, y) {
	if (typeof x === 'undefined' || x == null) return null;
    if (typeof y === 'undefined') {
        y = x.y;
        x = x.x;
    }
    return CELLS[y][x];
}

function me() {
    return SNAKEID;
}

function snake(id) {
    return SNAKES[id];
}

// FIXME checks if game is running, etc.
var PAUSE = false;
function togglePause(state) {
    if (typeof state === 'undefined') state = !paused();
    PAUSE = state;
}
function paused() {
    return PAUSE;
}

// FIXME this method may be useless
var RUNNING = false;
function setRunning(state) {
    if (state == RUNNING) return RUNNING;
    RUNNING = state;
}
function running() {
    return /*!paused() && */RUNNING;
}

// FIXME hardcoded duuuude
var ONLINE = false;
var VIEW = 'offline';
function online() {
	return ONLINE === true;
}
function setConnected(m) {
	if (m === ONLINE) return false;
	ONLINE = m;
	return true;
}
function view(v) {
	if (typeof v === 'undefined') return VIEW;
	return VIEW === v;
}
function setView(v) {
	if (VIEW === v) return false;
	VIEW = v;
	return true;// setConnected(v === 'online');
}

function drawPart(c, $type, $subtype) {
	var $x = (c.x * 10),
		$y = (c.y * 10),
		$direction = DEGREES[c.d];
	if (!$type) $type = c.type;
	if ($subtype == undefined) $subtype = c.subtype;
	$.jCanvas({
		fillStyle: c.c,
		rotate: $direction,
	});
	graphics.drawRect({ 
		x: $x, y: $y,
	});
	switch ($type) {
	case "part":
		var s = "i/snake-3.png";
		if (c.type == "food") {
			if (c.st == 1) $subtype = 5; // body food
		} else if (c.type == "portal") {
			if (c.subtype == "in") {
				if (c.st >= 1) $subtype = 1; // body|head in portal
				else $subtype = 2; // queue in portal
			} else {
				if (c.st == 0) $subtype = 6; // queue out of portal
				else if (c.st == 2) $subtype = 5; // head out
				else if (c.st == 1) $subtype = 4; // body out
				else if (c.st == 4) $subtype = 8; // body corner
				else if (c.st == 3) $subtype = 7; // body corner
			}
			s = "i/portal-3.png";
		}
		graphics.drawImage({
			source: s,
			sx: $subtype * 10, sy: 0,
			x: $x, y: $y,
		});
		break;
	case "food":
		graphics.drawImage({
			source: "i/fruits.png",
			sx: $subtype * 10, sy: 0,
			x: $x, y: $y,
		});
		break;
	case "wall":
		graphics.drawImage({
			source: "i/wall.png",
			sx: $subtype * 10, sy: 0,
			x: $x, y: $y,
		});
		break;
	case "portal":
		if ($subtype == 'in') $subtype = 0;
		else if ($subtype == 'out') $subtype = 3;
		graphics.drawImage({
			source: "i/portal-2.png",
			sx: $subtype * 10, sy: 0,
			x: $x, y: $y,
		});
		break;
	}
}

function clearPart(part) {
	// <FIXED> bad repaint with firefox
	/*graphics.clearCanvas({
		x: (part.x * 10), y: (part.y * 10),
		width: 10, height: 10
	});*/
	graphics.drawRect({ 
		fillStyle: "black",
		x: (part.x * 10), y: (part.y * 10),
	});
	// </FIXED>
	if (part.type == "food") {
		part.type = null;
		part.subtype = null;
	}
	resetPart(part);
	part.d = 2;
}

function resetPart(part) {
	part.sq = 0;
	part.sh = 0;
	part.st = -1;
	part.c = "black";
	part.s = null;
}

function reset() {
	if (CELLS && CELLS.length) {
		$.each(CELLS, function(i, row) {
			$.each(row, function(j, c) {
				if (c.type !== "wall" && c.type !== "portal") {
					clearPart(c);
				} else {
					resetPart(c);
					drawPart(c);
					// part.d = 2;
				}
			});
		});
	}
	SNAKES = [];
	STEPID = 0;
}

var STEPTIME = 0;
function preRenders() {
	STEPTIME = +new Date;
	GC = [];
	NGC = [];
}
function render(snake) {
	var parts = snake.getParts();
	$.each(parts, function(i, part) {
		part.c = snake.isDead() ? (part.st == 2 ? "red" : "gray") : COLORS[snake.getOrder()];
		drawPart(part, "part", part.st);
		part.sq = 0; // queue|head predictions reset
		part.sh = 0;
	});
}
function postRenders() {
	$.each(GC, function(i, part) {
		if (NGC.indexOf(part) < 0) {
			if (part.type == "portal") {
				resetPart(part);
				drawPart(part);
			} else {
				clearPart(part);
			}
		}
		part.sq = 0; // queue|head predictions reset (useless?)
		part.sh = 0;
	});
	STEPTIME = (+new Date) - STEPTIME;
	$('#steps').text(STEPTIME);
}

function step() {
	preRenders();
	if (STEPID++ > 0) {
		
        //$('.snake-game .snake-cell').removeData('snake-head').removeData('snake-queue');
		// FIXME empty sq & sh
		
		var moves = [];
		for (var k in SNAKES) {
			var s = SNAKES[k];
			var p = s.getParts();
			if (!s.isDead()) {
				s.consumeDirection();
				var m = s.prepareMove();
				if (m) {
					if (m.h) m.h.sh++;
					if (m.q) m.q.sq++;
					if (m.h && m.h.s && m.h.s != s.getID()) {
						var adv = snake(m.h.s);
						if (m.h.st == 2 && (Math.abs(adv.getDirection() - m.d) == 2 || adv.getParts().length > 1)) {
							m.h.sh++; // invalid harakiri
						}
					}
					m.s = s;
					moves.push(m);
				}
			} else {
				if (p.length > 1) p[0].sq++;
				p[p.length-1].sh++;
			}
		}
		
		// predict next move
		var alives = Object.size(moves);
		for (var k in moves) {
            var m = moves[k];
			var s = m.s;
            if (m.h == null || m.h.sq >= 1 || m.h.sh > 1 || m.h.st == 1 || m.h.st > 2 
					|| (m.h.type !== null && m.h.type !== "food" && m.h.type !== "portal")) {
                game.kill(s.getID());
				alives--;
                // delete moves[k];
            }
		}
        
        // stop rendering if not necessary (eye candy finish)
        var eyeCandyFinish = (Object.size(SNAKES) > 1 && alives <= 1);
        
		for (var m in moves) {
            var s = moves[m].s;
			if (!eyeCandyFinish && !s.isDead()) {
				var e = s.hasEaten(); // before moving
				s.move();
				if (e) {
					game.eat(s.getID());
				}
			}
			if (!eyeCandyFinish || s.isDead()) {
				render(s);
			}
        }
		
	} else {
		for (var s in SNAKES) {
			render(SNAKES[s]);
		}
	}
	postRenders();
}
