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
function update_ground(event, $element)
{
	var width = $element.attr('width') || 1;
	var height = $element.attr('height') || 1;
	$element.css('width', (width * 32) + 'px');
	$element.css('height', (height * 32) + 'px');
}
update_ground.attributes = ['width', 'height'];
function update_snapped(event, $element, attribute, old_value)
{
	var x = $element.attr('x') || 0;
	var y = $element.attr('y') || 0;
	$element.css('left', (x * 32) + 'px');
	$element.css('top', (y * 32) + 'px');
}
update_snapped.attributes = ['x', 'y'];
function update_layered(event, $element)
{
	var layer = $element.attr('layer') || 0;
	$element.css('z-index', layer);
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
	$element.css
	(
		'background-position',
		[
			(-sx * $element.width()) + 'px',
			(-sy * $element.height()) + 'px'
		]
		.join(' ')
	);
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
function update_character(event, $element, attribute, old_value)
{
	if(event === 'added'|| event === 'exists')
	{
		if(!$element.data('api'))
		{
			$element.data('api', {});
		}
		$element.data('api').character =
		{
			$element: $element,
		};
	}
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
function is_arrow_key(key)
{
	var arrow_keys = [arrow_down, arrow_left, arrow_right, arrow_up];
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
function SnappedMovementController()
{
	this.requests = [];
	requestAnimationFrame(this.frame_callback.bind(this));
}
SnappedMovementController.prototype._initialize_request_if_not_yet = function(request)
{
	var $element = request.$element;
	var movement_ns = $element.data('namespaces').movement;
	if(!movement_ns.initialized)
	{
		movement_ns.distance_traveled = 0;
		movement_ns.origin =
		{
			x: parseInt($element.attr('x')),
			y: parseInt($element.attr('y'))
		};
		movement_ns.target = {};
		switch(request.direction)
		{
			case 'down':
				movement_ns.axis = 'y';
				movement_ns.target.x = movement_ns.origin.x;
				movement_ns.target.y = movement_ns.origin.y + 1;
				break;
			case 'left':
				movement_ns.axis = 'x';
				movement_ns.target.x = movement_ns.origin.x - 1;
				movement_ns.target.y = movement_ns.origin.y;
				break;
			case 'up':
				movement_ns.axis = 'y';
				movement_ns.target.x = movement_ns.origin.x;
				movement_ns.target.y = movement_ns.origin.y - 1;
				break;
			case 'right':
				movement_ns.axis = 'x';
				movement_ns.target.x = movement_ns.origin.x + 1;
				movement_ns.target.y = movement_ns.origin.y;
				break;
			default:
				throw new Error("Invalid direction ('" + request.direction + ".')");
		}
		if($('[x="' + movement_ns.target.x + '"][y="' + movement_ns.target.y + '"]').length > 0)
		{
			throw new Error("Collision.");
		}
		$element.attr('tx', movement_ns.target.x);
		$element.attr('ty', movement_ns.target.y);
		movement_ns.speed = parseFloat($element.attr('speed')) || 2.5;
		movement_ns.initialized = true;
	}
};
SnappedMovementController.prototype._request_resolved = function(index)
{
	var $element = this.requests[index].$element;
	var element_namespaces = $element.data('namespaces');
	var movement_ns = element_namespaces.movement;
	$element.removeAttr('tx');
	$element.removeAttr('ty');
	delete $element.data('namespaces').movement;
	this.requests.splice(index, 1);
};
SnappedMovementController.prototype._update_timestamps = function(timestamp)
{
	var previous = this.latest_timestamp;
	this.latest_timestamp = timestamp;
	return previous;
};
SnappedMovementController.prototype.frame_callback = function(timestamp)
{
	requestAnimationFrame(this.frame_callback.bind(this));
	timestamp = timestamp || 0;
	var tile_size = 32;
	var previous_timestamp = this._update_timestamps(timestamp);
	var timestamp_delta = timestamp - previous_timestamp;
	var second_multiplier = timestamp_delta / 1000;
	this.requests.forEach
	(
		function(request, i)
		{
			try
			{
				this._initialize_request_if_not_yet(request);
				var $element = request.$element;
				var movement = $element.data('namespaces').movement;
				var target = movement.target[movement.axis];
				var origin = movement.origin[movement.axis];
				var final_offset = (target - origin) * tile_size;
				var frame_offset = final_offset * movement.speed * second_multiplier;
				movement.distance_traveled += Math.abs(frame_offset);
				var final_distance = Math.abs(final_offset);
				if(movement.distance_traveled >= final_distance)
				{
					movement.distance_traveled = final_distance;
				}
				var current_offset = Math.floor(movement.distance_traveled) * Math.sign(final_offset);
				$element.css
				(
					{ x: 'left', y: 'top' }[movement.axis],
					((origin * tile_size) + current_offset) + 'px'
				);
				if(movement.distance_traveled >= final_distance)
				{
					$element.attr(movement.axis, movement.target[movement.axis]);
					request.promise_resolver.resolve();
					this._request_resolved(i);
				}
			}
			catch(error)
			{
				request.promise_resolver.reject(error);
				this._request_resolved(i);
			}
		},
		this
	);
};
SnappedMovementController.prototype.move = function($element, direction)
{
	var movement_controller = this;
	var element_namespaces
			= $element.data('namespaces')
			|| $element.data('namespaces', {}).data('namespaces');
	if(element_namespaces.movement)
	{
		return Promise.reject(new Error('Element already moving.'));
	}
	element_namespaces.movement = {};
	return new Promise
	(
		function(resolve, reject)
		{
			movement_controller.requests.push
			({
				$element: $element,
				direction: direction,
				promise_resolver: { resolve: resolve, reject: reject }
			});
		}
	);
};
var movement_controller = new SnappedMovementController();
window.move_snapped = movement_controller.move.bind(movement_controller);
var moving = false;
var directions = {};
directions[arrow_down] = 'down';
directions[arrow_left] = 'left';
directions[arrow_up] = 'up';
directions[arrow_right] = 'right';
(
	function input_frame()
	{
		requestAnimationFrame(input_frame);
		if(moving || arrows_stack.length === 0)
		{
			return;
		}
		moving = true;
		var pc = $('.pc');
		function reset_moving_flag(error)
		{
			if(error || arrows_stack.length === 0)
			{
				pc.removeClass('walking');
			}
			moving = false;
		}
		var latest_arrow = arrows_stack[arrows_stack.length - 1];
		var direction = directions[latest_arrow];
		move_snapped(pc, direction)
			.then(reset_moving_flag, reset_moving_flag);
		if(pc.attr('direction') !== direction)
		{
			pc.attr('direction', direction);
		}
		if(!pc.hasClass('walking'))
		{
			pc.addClass('walking');
		}
	}
)();
