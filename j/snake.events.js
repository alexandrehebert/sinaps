
// game preparing
jQuery.fn.level = function($level) {
	if (!running() && !paused()) {
        if ($level && $level !== '') {
			var e = $.Event('level', { level: $level });
			$(this).trigger(e);
		}
    }
	return false;
};
jQuery.fn.mod = function($mod) {
	return game.trigger({type: 'mod', mod: $mod});
};
jQuery.fn.food = function($x, $y, $type) {
    return $(this).trigger({type: 'food', x: $x, y: $y, food: $type});
};
jQuery.fn.toast = function($text) {
	return game.trigger({type: 'toast', text: $text});
};
jQuery.fn.online = function($state) {
	if (online() == $state) return;
	return game.trigger({type: 'online', state: $state});
};
jQuery.fn.view = function($view) {
	if (view() == $view) return;
	return $(document).trigger({type: 'view', view: $view});
};

// game running
jQuery.fn.step = function() {
	if (running()) {
		var e = $.Event('step');
		$(this).trigger(e);
		return (e.result !== false) ? $(this).trigger({type: 'render'}) : $(this);
	}
};
jQuery.fn.slim = function() {
	if (running()) {
		return $(this).trigger({type: 'slim'});
	}
};
jQuery.fn.pause = function($state) {
	if (running() || paused()) {
	  return $(this).trigger({type: 'pause', state: $state});
	}
};
jQuery.fn.move = function($id, $direction) {
	if (running()) {
	  return $(this).trigger({type: 'move', snake: $id, direction: $direction});
	}
};
jQuery.fn.eat = function($snake) {
	if (running()) {
		return $(this).trigger({type: 'eat', snake: $snake});
	}
};

// game launching
jQuery.fn.start = function() {
	if (!running() && !paused() && CELLS.length > 0) {
		$(this).trigger({type: 'start'});
	}
	return $(this);
};
jQuery.fn.stop = function($winner) {
	if (running()) {
		$(this).trigger({type: 'stop', winner: $winner});
	}
	return $(this);
};
jQuery.fn.reset = function() {
	if (!running() && !paused()) {
		$(this).trigger({type: 'reset'});
	}
	return $(this);
};
jQuery.fn.snake = function($id, $order) {
	if (typeof $id === 'undefined') return snake($(this).attr('snake-id'));
	return $(this).trigger({type: 'snake', player: $id, order: $order});
};
jQuery.fn.kill = function($id) {
	return $(this).trigger({type: 'kill', snake: $id});
};

// game players
jQuery.fn.enter = function($id, $name, $score) {
	return $(this).trigger({type: 'enter', player: $id, name: $name, score: $score});
};
jQuery.fn.leave = function($id, $name) {
	return $(this).trigger({type: 'leave', player: $id});
};
jQuery.fn.talk = function($id, $text) {
	return $(this).trigger({type: 'talk', player: $id, text: $text});
};
jQuery.fn.nick = function($id, $name) {
	return $(this).trigger({type: 'nick', player: $id, name: $name});
};
jQuery.fn.notify = function($text) {
	return $(this).trigger({type: 'notify', text: $text});
};
jQuery.fn.join = function($game, $player, $order) {
	return $(this).trigger({type: 'join', game: $game, player: $player, order: $order});
};
jQuery.fn.quit = function($game, $player) {
	return $(this).trigger({type: 'quit', game: $game, player: $player});
};
jQuery.fn.create = function($id, $name) {
	return $(this).trigger({type: 'create', game: $id, name: $name});
};
jQuery.fn.destroy = function($id) {
	return $(this).trigger({type: 'destroy', game: $id});
};
jQuery.fn.send = function($cmd, $message) {
    var e = $.Event('send', {cmd: $cmd, text: $message});
	$(this).trigger(e);
	/*if (!e.result) {
	    $('[name=snake-talk-output]').append('@error' + '\n');
    }*/
	return e.result !== false;
};
        
// ----------------------------------------------------------------------------
// orchestrator :

$(function() {

    game = $('.snake-game:first');
    players = $('.snake-players-list:first');
    games = $('.snake-games-list:first');
    toast = $('.snake-toast:first');
    messenger = $('.snake-talk:first');
	graphics = $('canvas');
	
	$('select').data('pre', $('select').val()).change(function(e) {
        if (running()) {
			// prevent config changes during game
			// we dont wanna manage inputs disabling/enabling, so dirty
			$(this).val($(this).data('pre'));
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
			return false;
		} else {
			$(this).data('pre', $(this).val());
		}
	});
	
	// live events because changing level removes cells
	$(document).bind('view', function(e) {
		if (!setView(e.view)) {
			e.stopPropagation();
			return false;
		}
	});
	
	game.bind('toast', function(e) {
		if (e.text) addToast(e.text);
		else clearToast();
	}).bind('reset', function(e) {
		reset();
		$(this).toast();
	}).bind('level', function(e) {
        var self = $(this);
		$(this).toast('loading');
		return setLevel(e.level).done(function() {
			$(this).toast();
		});
	}).bind('render', function(e) {
		step();
	}).bind('move', function(e) {
		snake(e.snake).addDirection(e.direction);
	}).bind('stop', function(e) {
		setRunning(false);
		togglePause(false);
	}).bind('start', function(e) {
		$(document).focus();
		setRunning(true);
	}).bind('pause', function(e) {
		togglePause(e.state);
		e.state = paused();
		$(this).toast(paused() ? 'pause' : false);
	}).bind('snake', function(e) {
	    addSnake(e.player, e.order);
	}).bind('kill', function(e) {
		killSnake(e.snake);
	}).bind('online', function(e) {
		setConnected(e.state);
	}).bind('slim', function(e) {
		doSlimFast();
	}).bind('food', function(e) {
		addFood(cell(e.x, e.y), e.food);
	});
	
	messenger.bind('talk', function(e) {
		addMessage(e.player, e.text);
	}).bind('notify', function(e) {
		addMessage(null, e.text);
	});
	
});
		
// ----------------------------------------------------------------------------
