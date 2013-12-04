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
window.dom_control = function(selector, handler)
{
    dom_control.handlers[selector] = handler;
};
dom_control.remove = function(selector)
{
    delete dom_control.handlers[selector];
};
var handlers = dom_control.handlers = {};
var big_brother = dom_control.big_brother = new MutationObserver
(
    function(mutations)
    {
        mutations.forEach
        (
            function(mutation)
            {
                if(mutation.attributeName)
                {
                    var $target = $(mutation.target);
                    for(var selector in handlers)
                    {
                        if($target.is(selector))
                        {
                            handlers[selector]('mutated', mutation.target, mutation.attributeName);
                        }
                    }
                }
                else
                if(mutation.addedNodes)
                {
                    var $addedNodes = $(mutation.addedNodes);
                    for(var selector in handlers)
                    {
                        $addedNodes.find(selector).addBack(selector).each
                        (
                            function(i, addedNode)
                            {
                                handlers[selector]('added', addedNode);
                            }
                        );
                    }
                }
                else
                if(mutation.removedNodes)
                {
                    var $removedNodes = $(mutation.removedNodes);
                    for(var selector in handlers)
                    {
                        $removedNodes.find(selector).addBack(selector).each
                        (
                            function(i, removedNode)
                            {
                                handlers[selector]('removed', removedNode);
                            }
                        );
                    }
                }
            }
        );
    }
);
big_brother.observe(document, { attributes: true, subtree: true, childList: true });
