
jQuery.fn.rotate = function(degrees) {
	return $(this).data('rotate', degrees).css({
		'-webkit-transform' : 'rotate('+ degrees +'deg)',
		'-moz-transform' : 'rotate('+ degrees +'deg)',
		'-ms-transform' : 'rotate('+ degrees +'deg)',
		'transform' : 'rotate('+ degrees +'deg)'
	});
};

jQuery.extend($, {preload : function(images) {
    $.each(images, function() {
        $('<img/>')[0].src = this;
    });
}});

/*jQuery.jQueryRandom = 0;
jQuery.extend(jQuery.expr[':'], {
    random: function(a, i, m, r) {
        if (i == 0) {
            jQuery.jQueryRandom = Math.floor(Math.random() * r.length);
        };
        return i == jQuery.jQueryRandom;
    }
});*/

jQuery.fn.random = function() {
	if (this.length == 0) return null;
    var randomIndex = Math.floor(Math.random() * this.length);  
    return jQuery(this[randomIndex]);
};

jQuery.ajaxSetup({
	converters: {
		"csv text": true,
		"text csv": function ( result ) {
			var rows = new Array();
			$.each(result.split("\n"), function(key, value) {
				rows.push(value.split(";"));
			});
			return rows;
		}
	}
});

if (!$.ui) { // in prevision of jQueryUI integration
	$.ui = { keyCode: {
		ALT: 18,
		BACKSPACE: 8,
		CAPS_LOCK: 20,
		COMMA: 188,
		COMMAND: 91,
		COMMAND_LEFT: 91, // COMMAND
		COMMAND_RIGHT: 93,
		CONTROL: 17,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		INSERT: 45,
		LEFT: 37,
		MENU: 93, // COMMAND_RIGHT
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SHIFT: 16,
		SPACE: 32,
		TAB: 9,
		UP: 38,
		WINDOWS: 91 // COMMAND
	}};
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function d(t, l) {
    console.log(t + ' : ' + l);
}

