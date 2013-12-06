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
function set_tile($element, x, y)
{
	$element.css
	(
		'background-position',
		(-x * 32) + 'px ' + (-y * 32) + 'px'
	);
}
function update_ground($element)
{
	var width = $element.attr('width') || 1;
	var height = $element.attr('height') || 1;
	set_ground_size($element, width, height);
}
update_ground.attributes = ['width', 'height'];
function update_snapped($element)
{
	var x = $element.attr('x') || 0;
	var y = $element.attr('y') || 0;
	set_position($element, x, y);
}
update_snapped.attributes = ['x', 'y'];
function update_layered($element)
{
	var layer = $element.attr('layer') || 0;
	set_layer($element, layer);
}
update_layered.attributes = ['layer'];
function update_tile($element)
{
	update_snapped($element);
	update_layered($element);
	if(parseFloat($element.css('transition-duration')) === 0)
	{
		var tx = $element.attr('tx') || 0;
		var ty = $element.attr('ty') || 0;
		set_tile($element, tx, ty);
	}
}
update_tile.attributes = ['x', 'y', 'layer', 'tx', 'ty'];
function update_animated($element)
{
	function set_off()
	{
		var frames = $element.attr('frames');
		var frame_duration = $element.attr('frame-duration') || '';
		var frame_duration_unit = frame_duration.replace(/[0-9. ]/g, '') || 's';
		frame_duration = parseFloat(frame_duration) || 0;
		var transition_duration = (frame_duration * frames) + frame_duration_unit;
		$element.css('transition', 'background-position 0s');
		update_tile($element);
		$element.css('background-position'); // force "flush"
		if(frame_duration * frames === 0)
		{
			return;
		}
		$element.css('transition', 'background-position steps(' + frames + ', end) ' + transition_duration);
		var current_position = $element.css('background-position').split(' ').map
		(
			function(value)
			{
				return parseInt(value);
			}
		);
		current_position[0] -= (frames * 32);
		current_position[0] += 'px';
		current_position[1] += 'px';
		$element.css('background-position', current_position.join(' '));
	}
	$element.on('transitionend', set_off);
	set_off();
}
update_animated.attributes = [];
function make_update_handler(update_fn)
{
	return function(event, element, attribute)
	{
		if(event === 'removed')
		{
			return;
		}
		if(event === 'mutated' && update_fn.attributes.indexOf(attribute) === -1)
		{
			return;
		}
		update_fn($(element));
	};
}
dom_control('.ground', make_update_handler(update_ground));
dom_control('.snapped', make_update_handler(update_snapped));
dom_control('.layered', make_update_handler(update_layered));
dom_control('.tile', make_update_handler(update_tile));
dom_control('.tile[frames]', make_update_handler(update_animated));
