/*
	Copyright (C) 2013 Guilherme Vieira 

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
function set_ground_size($element, width, height)
{
	$element.css('width', (width * 32) + 'px');
	$element.css('height', (height * 32) + 'px');
}
function set_position($element, x, y, layer)
{
	$element.css('left', (x * 32) + 'px');
	$element.css('top', (y * 32) + 'px');
}
function set_layer($element, layer)
{
	$element.css('z-index', layer);
}
function set_sprite($element, x, y)
{
	var width = $element.width();
	var height = $element.height();
	$element.css
	(
		'background-position',
		(-x * width) + 'px ' + (-y * height) + 'px'
	);
}
function update_ground(event, $element)
{
	var width = $element.attr('width') || 1;
	var height = $element.attr('height') || 1;
	set_ground_size($element, width, height);
}
update_ground.attributes = ['width', 'height'];
function update_snapped(event, $element, attribute, old_value)
{
	var x = $element.attr('x') || 0;
	var y = $element.attr('y') || 0;
	set_position($element, x, y);
}
update_snapped.attributes = ['x', 'y'];
function update_layered(event, $element)
{
	var layer = $element.attr('layer') || 0;
	set_layer($element, layer);
}
update_layered.attributes = ['layer'];
function update_sprite(event, $element, attribute, old_value, force_set)
{
	var sx = $element.attr('sx') || 0;
	var sy = $element.attr('sy') || 0;
	if($element.data('animating') && !force_set)
	{
		return;
	}
	set_sprite($element, sx, sy);
}
update_sprite.attributes = ['sx', 'sy'];
function calculate_transition_duration($element)
{
	var frames = $element.attr('frames');
	var frame_duration = $element.attr('frame-duration') || '';
	var frame_duration_unit = frame_duration.replace(/[0-9. ]/g, '') || 's';
	var frame_duration_scalar = parseFloat(frame_duration) || 0;
	return (frame_duration_scalar * frames) + frame_duration_unit;
}
function update_sprite_animation(event, $element)
{
	if(!$element.data('animating'))
	{
		$element.on('transitionend.animated-sprite', update_sprite_animation.bind(null, event, $element));
	}
	try
	{
		var frames = $element.attr('frames');
		var sheet_orientation = $element.attr('sheet-orientation') || 'horizontal';
		var transition_duration = calculate_transition_duration($element);
		$element.css('transition', 'background-position 0s');
		update_sprite(event, $element, null, null, true);
		$element.css('background-position'); // force "flush"
		if(parseFloat(transition_duration) === 0)
		{
			return;
		}
		$element.css('transition', 'background-position steps(' + frames + ', end) ' + transition_duration);
		var position = $element.css('background-position').split(' ').map
		(
			function(value)
			{
				return parseInt(value);
			}
		);
		var sheet_axis = (sheet_orientation !== 'vertical')? 0 : 1;
		position[sheet_axis] -= (frames * 32);
		position[0] += 'px';
		position[1] += 'px';
		position = position.join(' ');
		$element.css('background-position', position);
		$element.data('animating', true);
	}
	catch(e)
	{
		console.error(e);
		$element.off('animated-sprite');
		$element.data('animating', false);
	}
}
update_sprite_animation.attributes = ['sx', 'sy', 'frames', 'frame-duration', 'sheet-orientation'];
var t = 0;
function update_character(event, $element, attribute, old_value)
{
	if(event === 'added' || event === 'exists' || attribute === 'direction')
	{
		var direction = $element.attr('direction');
		if(!direction)
		{
			$element.attr('direction', direction = 'down');
		}
		var sys =
		{
			'down': 0,
			'left': 1,
			'right': 2,
			'up': 3
		};
		$element.attr('sy', sys[direction]);
	}
	if(event === 'added' || event === 'exists' || attribute === 'class')
	{
		if($element.is('.walking'))
		{
			$element.attr('frames', 4);
			if(!$element.attr('frame-duration'))
			{
				$element.attr('frame-duration', '0.2s');
			}
		}
		else
		{
			$element.attr('frames', 0);
		}
	}
}
update_character.attributes = ['class', 'direction'];
function make_update_handler(update_fn)
{
	return function(event, element, attribute, old_value)
	{
		if(event === 'removed')
		{
			return;
		}
		if(event === 'mutated' && update_fn.attributes.indexOf(attribute) === -1)
		{
			return;
		}
		update_fn(event, $(element), attribute, old_value);
	};
}
dom_control('.ground', make_update_handler(update_ground));
dom_control('.snapped', make_update_handler(update_snapped));
dom_control('[layer]', make_update_handler(update_layered));
dom_control('.sprite', make_update_handler(update_sprite));
dom_control('.sprite[frames]', make_update_handler(update_sprite_animation));
dom_control('.character', make_update_handler(update_character));
var key_states = new Array(256);
var arrow_down = 40;
var arrow_left = 37;
var arrow_right = 39;
var arrow_up = 38;
var arrow_keys = [arrow_down, arrow_left, arrow_right, arrow_up];
function is_arrow_key(key)
{
	return (arrow_keys.indexOf(key) !== -1);
}
$(document).on
(
	'keydown keyup', function(event)
	{
		var $target = $(event.target);
		switch(event.type)
		{
			case 'keydown':
				var previous_key_state = key_states[event.which];
				key_states[event.which] = 1;
				if(!previous_key_state)
				{
					$target.trigger('proper-keydown', event);
				}
				break;
			case 'keyup':
				key_states[event.which] = 0;
				break;
		}
		if(is_arrow_key(event.which))
		{
			event.preventDefault();
		}
	}
);
var arrows_stack = [];
$(document).on
(
	'proper-keydown', function(event, original_event)
	{
		if(!is_arrow_key(original_event.which))
		{
			return;
		}
		arrows_stack.push(original_event.which);
	}
);
$(document).keyup
(
	function(event)
	{
		if(!is_arrow_key(event.which))
		{
			return;
		}
		var index = arrows_stack.indexOf(event.which);
		arrows_stack.splice(index, 1);
	}
);
setInterval
(
	function()
	{
		if(arrows_stack.length === 0)
		{
			return;
		}
		var character = $('.character');
		var background_position_mod_32 = character.css('background-position').split(' ').map
		(
			function(value)
			{
				return parseInt(value) % 32;
			}
		);
		if(background_position_mod_32[0] && background_position_mod_32[1])
		{
			return;
		}
		var x = character.attr('x');
		var y = character.attr('y');
		var direction = character.attr('direction');
		switch(arrows_stack[arrows_stack.length - 1])
		{
			case arrow_down:
				character.attr('y', ++y);
				if(direction !== 'down')
				{
					character.attr('direction', 'down');
				}
				break;
			case arrow_left:
				character.attr('x', --x);
				if(direction !== 'left')
				{
					character.attr('direction', 'left');
				}
				break;
			case arrow_right:
				character.attr('x', ++x);
				if(direction !== 'right')
				{
					character.attr('direction', 'right');
				}
				break;
			case arrow_up:
				character.attr('y', --y);
				if(direction !== 'up')
				{
					character.attr('direction', 'up');
				}
				break;
		}
	},
	50
);
