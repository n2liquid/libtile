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
function setGroundSize($element, width, height)
{
	$element.css('width', (width * 32) + 'px');
	$element.css('height', (height * 32) + 'px');
}
function setPosition($element, x, y, layer)
{
	$element.css('left', (x * 32) + 'px');
	$element.css('top', (y * 32) + 'px');
	$element.css('z-index', layer);
}
function setTile($element, x, y)
{
	$element.css
	(
		'background-position',
		(-x * 32) + 'px ' + (-y * 32) + 'px'
	);
}
function updateGround($element)
{
	var width = $element.attr('width') || 1;
	var height = $element.attr('height') || 1;
	setGroundSize($element, width, height);
}
updateGround.attributes = ['width', 'height'];
function updateTile($element)
{
	var x = $element.attr('x') || 0;
	var y = $element.attr('y') || 0;
	var layer = $element.attr('layer') || 0;
	var tx = $element.attr('tx') || 0;
	var ty = $element.attr('ty') || 0;
	setPosition($element, x, y, layer);
	setTile($element, tx, ty);
}
updateTile.attributes = ['x', 'y', 'layer', 'tx', 'ty'];
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
dom_control('.ground', make_update_handler(updateGround));
dom_control('.tile', make_update_handler(updateTile));
