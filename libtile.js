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
function update_tile(event, $element)
{
	update_snapped(event, $element);
	update_layered(event, $element);
	if(parseFloat($element.css('transition-duration')) === 0)
	{
		var tx = $element.attr('tx') || 0;
		var ty = $element.attr('ty') || 0;
		set_tile($element, tx, ty);
	}
}
update_tile.attributes = ['x', 'y', 'layer', 'tx', 'ty'];
function calculate_transition_duration($element)
{
	var frames = $element.attr('frames');
	var frame_duration = $element.attr('frame-duration') || '';
	var frame_duration_unit = frame_duration.replace(/[0-9. ]/g, '') || 's';
	var frame_duration_scalar = parseFloat(frame_duration) || 0;
	return (frame_duration_scalar * frames) + frame_duration_unit;
}
function update_tile_animation(event, $element)
{
	if(!$element.data('animating'))
	{
		$element.on('transitionend.animated-tile', update_tile_animation.bind(null, event, $element));
	}
	try
	{
		var frames = $element.attr('frames');
		var sheet_orientation = $element.attr('sheet-orientation') || 'horizontal';
		var transition_duration = calculate_transition_duration($element);
		$element.css('transition', 'background-position 0s');
		update_tile(event, $element);
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
		$element.off('animated-tile');
		$element.data('animating', false);
	}
}
update_tile_animation.attributes = ['frames', 'frame-duration', 'sheet-orientation'];
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
dom_control('.layered', make_update_handler(update_layered));
dom_control('.tile', make_update_handler(update_tile));
dom_control('.tile[frames]', make_update_handler(update_tile_animation));
