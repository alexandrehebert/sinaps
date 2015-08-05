
var map, tools;

$(function() {
	
	map = $('#snake-map-area');
	tools = $('#snake-map-tools');
	
	$("[name=snake-map-resize]").click(function() {
		if (view('editor')) {
			createEmptyMap($('[name=map-x]').val(), $('[name=map-y]').val());
		}
	});
	
	$("[name=snake-map-generate]").click(function() {
		if (view('editor')) {
			generateMap();
		}
	});
	
	$("#snake-map-editor-onoff").click(function(e) {
		$(document).view(!$('#snake-map-generator').is(":visible") ? 'editor' : 'offline');
		e.preventDefault();
		return false;
	});
	
	$(document).bind('view', function(e) {
		$('#snake-map-generator').toggle(e.view === 'editor');
	});
	
	map.on('click', '.snake-cell', function(e) {
		if (view('editor')) {
			if (e.which == 2) { 
				e.preventDefault();
				return false;
			} else {
				if (getSelectedType() != "rotate" && getSelectedType() != getType($(this))) {
					$(this).rotate(0).removeClass('snake-portal snake-portal-in snake-portal-out '
						+ 'snake-wall snake-wall-0 snake-wall-1 snake-wall-2 '
						+ 'snake-head snake-part').css('background-color', 'black').removeAttr('data-color');
				}
				switch (getSelectedType()) {
				case "portal":
					var c = $(this).hasClass('snake-portal-in') ? 'snake-portal-out' : 'snake-portal-in';
					$(this).removeClass('snake-portal-in snake-portal-out').addClass('snake-portal').addClass(c);
					break;
				case "wall":
					var c = $(this).hasClass('snake-wall-0') ? 'snake-wall-1' : 'snake-wall-0';
					$(this).removeClass('snake-wall-0 snake-wall-1 snake-wall-2').addClass('snake-wall ' + c);
					break;
				case "head":
					var c = COLORS.indexOf($(this).attr('data-color')) + 1;
					if (c >= COLORS.length || c < 0) c = 0;
					$(this).attr('data-color', COLORS[c]).css('background-color', COLORS[c]).addClass('snake-head snake-part');
					break;
				case "rotate":
					var c = $(this).data('rotate');
					if (c == null) c = 0;
					c += 90;
					if (c > 180) c = -90;
					$(this).rotate(c);
					break;
				default: break; // default = remove cell content
				}
			}
		}
	}).on('contextmenu', '.snake-cell', function(e) {
		if (view('editor')) {
			var t = selectedTool();
			selectedTool($('[data-type=]'));
			$(this).click();
			selectedTool(t);
			return false;
		}
	});
	
	tools.on('click', '.snake-cell', function(e) {
		if (view('editor')) {
			selectedTool($(this));
		}
	});
	
});

function createEmptyMap(width, height) {
	map.empty();
	for (var i=0; i<height; i++) {
        map.append('<div class="snake-row"></div>');
	    for (var j=0; j<width; j++) {
            $('.snake-row:last', map).append('<div class="snake-cell" data-x="' + j + '" data-y="' + i + '"></div>');
		}
	}
}

function generateMap() {
	var levelOut = '';
	$('#snake-map-area .snake-row').each(function() {
		$(this).find('.snake-cell').each(function(i) {
			levelOut += (i > 0 ? ';' : '') + cellToText($(this));
		});
		levelOut += "\n";
	});
	alert(levelOut);
}

function selectedTool(tool) {
	if (typeof tool === 'undefined') return $('.snake-tool-selected');
	$('#snake-map-tools .snake-cell').removeClass('snake-tool-selected');
	tool.addClass('snake-tool-selected');
}

function getType(cell) {
	if (!cell.length) return;
	if (cell.attr("data-type")) {
		return cell.attr("data-type");
	}
	if (cell.hasClass('snake-portal')) {
		return "portal";
	} else if (cell.hasClass('snake-head')) {
		return "head"
	} else if (cell.hasClass('snake-wall')) {
		return "wall";
	}
}

function cellToText(cell) {
	if (cell.hasClass('snake-portal-out')) return '§';
	else if (cell.hasClass('snake-portal-in')) return '@';
	else if (cell.hasClass('snake-wall-0')) return '+';
	else if (cell.hasClass('snake-wall-1')) return cellToDirection(cell) % 2 == 0 ? '-' : '|';
	else if (cell.hasClass('snake-head')) {
		return STARTERS[cellToDirection(cell)]
			+ (COLORS.indexOf(cell.attr('data-color')) + 1);
	}
	return '';
}

function cellToDirection(cell) {
	return cell.data('rotate') != null ? DEGREES.indexOf(cell.data('rotate')) : 0;
}

function getSelectedType() {
	return getType(tools.find('.snake-tool-selected'));
}
