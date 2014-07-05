/**
 * 
 * -- GridWizard -- 
 * jQuery plug-in provides interactive table building 
 *
 * This plug-in is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @link http://gridwizard.rayz.ru/
 * @copyright 2009, RayZ.ru .
 * @author Andrew Rumm <gridwizardw@rayz.ru>
 * @version 0.1.1
 * 
 */

$(function($) {
	$.fn.gridWizard = function(options) {

		/***********************************************************************
		 * Default configuration
		 **********************************************************************/
		var defaults = {

			// Call mama, i didn't ever mind what is this stuff is all about!
			id : 'gridWizard',

			// Callback called when grid builded
			'onRebuild' : function() {

			},
			// Language strings
			l : {
				'split' : 'split',
				'px' : 'px',
				'joinright' : 'join with right cell',
				'joinup' : 'join with up cell',
				'joindown' : 'join with down cell',
				'joinleft' : 'join with left cell'
			},

			// Internal trigger
			rebuild : function() {
				init(this);
			},

			// Default original layout size
			width : 800,
			height : 600,

			// option: toggle sizing table cells
			resizeCells : true,

			// option: toggle joining and table cells
			formatTable : true,

			// option: display table cells sizes
			showSizes : true,

			// default scaled layout
			scaledWidth : 300,
			scaledHeight : 300,

			// Layout Table Rows x Cols
			maxCol : 4,
			maxRow : 4,

			matrix : [],

			cells : [{
				id : '0',
				colspan : 4,
				rowspan : 4
			}]
		};

		options = $.extend(defaults, options);
		

		/***********************************************************************
		 * custom configuration
		 **********************************************************************/

		options.obj = this;

		var _top = 0;
		var _left = 0;
		var _height = 0;
		var _width = 0;

		/***********************************************************************
		 * INIT
		 **********************************************************************/
		var init = function(opts) {
			
			if ((opts.scaledWidth / opts.scaledHeight) >= (opts.width / opts.height)) {
				_height = opts.scaledHeight;
				_width = parseInt(_height * (opts.width / opts.height));
				opts.scaleRatio = _height / opts.height;
			} else {
				_width = opts.scaledWidth;
				_height = parseInt(_width * (opts.height / opts.width));
				opts.scaleRatio = _width / opts.width;
			}

			var defaultCellW = Math.round(opts.width / opts.maxCol);
			var defaultCellH = Math.round(opts.height / opts.maxRow);

			opts.sizesW = opts.sizesW || [];
			opts.sizesH = opts.sizesH || [];

			for (i = 0; i < opts.maxCol; i++) {
				opts.sizesW[i] = parseInt(opts.sizesW[i]) || defaultCellW;
			}

			for (i = 0; i < opts.maxRow; i++) {
				opts.sizesH[i] = parseInt(opts.sizesH[i]) || defaultCellH;
			}

			$(opts.obj).css('position', 'absolute').html('');

			_top = parseInt($(opts.obj).css('top'));
			_left = parseInt($(opts.obj).css('left'));

			opts.sizesW = normalizeSizes(opts.sizesW, opts.width);
			opts.sizesH = normalizeSizes(opts.sizesH, opts.height);
			opts.sizesW = convertPercents(opts.sizesW, opts.width);
			opts.sizesH = convertPercents(opts.sizesH, opts.height);

			$('#' + opts.channelsContainerId).empty();
			var container = containerBuilder(opts);

			if (opts.resizeCells) {
				arr = dragBuilder(opts);
				$(arr).each(function() {
					$(container).append(this);
				});
			}

			var table = tableBuilder(opts);

			if (opts.showSizes) {
				opts.table = table[2];
			} else {
				opts.table = table[0];
			}

			$(container).append(table);

			if (opts.showChannels) {
				var channels = channelsBuilder(opts);
				$(container).append(channels);
			}

			$(opts.obj).append(container);
			opts.onRebuild.call(opts);
		};

		/***********************************************************************
		 * SPREAD DELTA PX
		 **********************************************************************/
		var spreadPixels = function(arr, pixels) {
			for (var i = 0; i < arr.length; i++) {
				if (pixels == 0)
					return true;
				if (pixels > 0) {
					arr[i] = arr[i] - 1;
					pixels = pixels - 1;
				} else {
					arr[i] = arr[i] + 1;
					pixels = pixels + 1;
				}
			}
			if (pixels != 0)
				spreadPixels(arr, pixels);
		};

		/***********************************************************************
		 * ARRAY SUM
		 **********************************************************************/
		var arraySum = function(arr, toIndex, fromIndex) {
			var sum = 0;
			var x = (typeof(toIndex) == 'undefined') ? arr.length : toIndex;
			var y = (typeof(fromIndex) == 'undefined') ? 0 : fromIndex;
			for (i = y; i <= x; i++) {
				if (!(/\%/.test(arr[i]))) {
					sum = sum + parseInt(arr[i]);
				} else {
					return false;
				}
			}
			return sum;
		};

		/***********************************************************************
		 * CONVERT PERCENTS
		 **********************************************************************/
		var convertPercents = function(arr, aspect) {
			var impressionSum = 0;
			for (var i = 0; i < arr.length; i++) {
				if (typeof(arr[i]) == 'string') {
					if (/\%/.test(arr[i])) {
						perc = parseFloat(arr[i]);
						arr[i] = Math.round((aspect / 100) * perc);
						impressionSum = impressionSum + Math.round((aspect / 100) * perc) - ((aspect / 100) * perc);
					}
				}
			}

			spreadPixels(arr, Math.round(impressionSum));
			return arr;
		};

		/***********************************************************************
		 * NORMALISE SIZES
		 **********************************************************************/
		var normalizeSizes = function(sizes, aspect) {
			var real = arraySum(sizes);
			if (real && real != aspect) {
				for (var i = 0; i < sizes.length; i++) {
					sizes[i] = (100 / (real / sizes[i])) + '%';
				}
			}
			return sizes;

		};

		/***********************************************************************
		 * RESUZE CONTAINER
		 **********************************************************************/
		var resizeContainer = function(container, top, left, _width, _height) {
			$(container)
				.css('top', top + 'px')
				.css('left', left + 'px')
				.css('width', _width + 'px')
				.css('height', _height + 'px');
		};

		/***********************************************************************
		 * RESERVE MATRIX
		 **********************************************************************/
		var reserveMatrix = function(width, height, x, y, limCols, opts) {
			var sizeY = 0;
			for (j = y; j <= y + height - 1; j++) {
				var sizeX = 0;
				for (i = x; i <= x + width - 1; i++) {
					opts.matrix[j * limCols + i] = false;
					sizeX = sizeX + Math.round(opts.sizesW[i] * opts.scaleRatio);
				}
				sizeY = sizeY + Math.round(opts.sizesH[j] * opts.scaleRatio);
			}
			return {
				'x' : sizeX,
				'y' : sizeY
			};
		};

		/***********************************************************************
		 * RECALCULATE SIZES
		 **********************************************************************/
		var recalculateSizes = function(dragletsH, dragletsV, opts) {
			var horW = [];
			var horH = [];
			horH[0] = 0;
			horW[0] = 0;
			for (i = 0; i < opts.maxCol - 1; i++) horW[i + 1] = Math.round(parseInt($(dragletsV[i]).css('left')) / opts.scaleRatio);
			horW[horW.length] = opts.width;
			for (i = 0; i < opts.maxCol; i++) opts.sizesW[i] = horW[i + 1] - horW[i];
			for (i = 0; i < opts.maxRow - 1; i++)  horH[i + 1] = Math.round(parseInt($(dragletsH[i]).css('top')) / opts.scaleRatio);
			horH[horH.length] = opts.height;
			for (i = 0; i < opts.maxRow; i++) opts.sizesH[i] = horH[i + 1] - horH[i];
			init(opts);
		};

		var containerBuilder = function(opts) {
			var container = document.createElement('div');
			resizeContainer(container, 0, 0, _width, _height);
			$(container).addClass('wiz-container').attr('id', 'wiz-' + opts.id);

			opts.container = container;
			return container;
		};

		/***********************************************************************
		 * DRAG BUILDER
		 **********************************************************************/
		var dragBuilder = function(opts) {
			var dragContainer = document.createElement('div');
			$(dragContainer).attr('id', 'ui-layout-draglets').css('height',
					_height).css('width', _width).css('z-index', 50).css(
					'position', 'absolute');

			var dragletVertical = [];
			var dragletHorizontal = [];

			for (n = 0; n < opts.maxCol - 1; n++) {
				dragletVertical[n] = document.createElement('div');
				$(dragletVertical[n])
					.css('left', Math.round((arraySum(opts.sizesW, n) * opts.scaleRatio)) + 'px')
					.attr('rel', n + 1);
			}
			for (n = 0; n < opts.maxRow - 1; n++) {
				dragletHorizontal[n] = document.createElement('div');
				$(dragletHorizontal[n])
					.css('top', Math.round((arraySum(opts.sizesH, n) * opts.scaleRatio)) + 'px')
					.attr('rel', n + 1);
			}

			$(dragletVertical)
				.addClass('ui-vertical-draglets')
				.css('height', _height)
				.css('z-index', 120)
				.css('position', 'absolute');

			$(dragletHorizontal)
				.addClass('ui-horizontal-draglets')
				.css('width', _width)
				.css('z-index', 120)
				.css('position', 'absolute');

			$(dragletHorizontal)
				.mousedown(function() {
					$(dragContainer).addClass('ui-container-drag');
					$(this).addClass('ui-draglet-inuse');
					var index = parseInt($(this).attr('rel'));
					if (index == 1) {
						resizeContainer(dragContainer, 0, 0, _width, Math.round(arraySum(opts.sizesH, index) * opts.scaleRatio));
					} else {
						resizeContainer(dragContainer, Math.round(arraySum(opts.sizesH, index - 2) * opts.scaleRatio), 0, _width, Math.round(arraySum(opts.sizesH, index, index- 1)* opts.scaleRatio));
					}

				})
				.mouseup(function() {
					resizeContainer(dragContainer, 0, 0, _width, _height);
					$(dragContainer).removeClass('ui-container-drag');
					$(this).removeClass('ui-draglet-inuse');
				})
				.draggable({
					axis : 'y',
					containment : $(dragContainer),
					scroll : false,
					start : function() {
						$(opts.table).hide();
					},
					stop : function() {
						resizeContainer(dragContainer, 0, 0, _width, _height);
						$(dragContainer).removeClass('ui-container-drag');
						recalculateSizes(dragletHorizontal, dragletVertical, opts);
					}
				});

			$(dragletVertical)
				.mousedown(function() {
					$(dragContainer).addClass('ui-container-drag');
					$(this).addClass('ui-draglet-inuse');
					var index = parseInt($(this).attr('rel'));
					if (index == 1) {
						resizeContainer(dragContainer, 0, 0, Math.round(arraySum(opts.sizesW, index) * opts.scaleRatio), _height);
					} else {
						resizeContainer(dragContainer, 0, Math.round(arraySum( opts.sizesW, index - 2) * opts.scaleRatio), Math.round(arraySum( opts.sizesW, index, index - 1) * opts.scaleRatio), _height);
					}
				})
				.mouseup(function() {
					resizeContainer(dragContainer, 0, 0, _width, _height);
					$(dragContainer).removeClass('ui-container-drag');
					$(this).removeClass('ui-draglet-inuse');
				})
				.draggable({
					axis : 'x',
					containment : $(dragContainer),
					scroll : false,
					start : function() {
						$(opts.table).hide();
					},
					stop : function() {
						resizeContainer(dragContainer, 0, 0, _width, _height);
						$(dragContainer).removeClass('ui-container-drag');
						recalculateSizes(dragletHorizontal, dragletVertical, opts);
					}
				});
			return [dragContainer, dragletHorizontal, dragletVertical];
		};

		/***********************************************************************
		 * TABLE BUILDER
		 **********************************************************************/
		var tableBuilder = function(opts) {
			var limitCol = opts.maxCol;
			var limitRow = opts.maxRow;
			for (j = 0; j < limitRow * limitCol; j++) {
				opts.matrix[j] = true;
			}

			if (opts.showSizes) {
				var WSizesTBL = document.createElement('table');
				var HSizesTBL = document.createElement('table');

				$(WSizesTBL).addClass('ui-tableWsizes').css('position',	'absolute').css('width', _width + 'px').css('top',	(_height + 10) + 'px');
				$(HSizesTBL).addClass('ui-tableHsizes').css('position',	'absolute').css('height', _height + 'px').css('left', (_width + 10) + 'px');

				for (var i = 0; i < limitCol; i++) {
					var Wtd = document.createElement('td');
					$(Wtd)
						.css('width', parseInt(opts.sizesW[i] * opts.scaleRatio) + 'px')
						.css('text-align', 'center')
						.html('<div>' + opts.sizesW[i] + 'px</div>');
					$(WSizesTBL).append(Wtd);
				}
				var top = 0;
				for (i = 0; i < limitRow; i++) {
					var Htr = document.createElement('tr');
					var Htd = document.createElement('td');

					$(Htd)
						.css('height', parseInt(opts.sizesH[i] * opts.scaleRatio) + 'px')
						.css('text-align', 'center')
						.html('<div style="' +
							'left:' + 10 + 'px; ' +
							'top:' + (parseInt(top) + 2) + 'px; ' +
							'position:absolute;'
							+ 'height:' + Math.round(opts.sizesH[i] * opts.scaleRatio) + 'px;"></div>'
							+ opts.sizesH[i] + 'px');
					$(Htr).append(Htd);
					top = top + parseInt(opts.sizesH[i] * opts.scaleRatio);
					$(HSizesTBL).append(Htr);
				}
			}

			var currentTBL = document.createElement('table');
			var currentTBLBody = document.createElement('tbody');
			$(currentTBL).attr('width', _width).attr('height', _height).attr(
					'id', 'wiz-' + opts.id).attr('cellspacing', 0).attr(
					'cellpadding', 0).attr('border', 0).css('position',
					'absolute').css('z-index', 100).addClass('wiz-grid');

			var currZoneIndex = 0;
			for ( y = 0; y < limitRow; y++) {
				var currentTR = document.createElement('tr');
				$(currentTR).attr('valign', 'top');
				
				for ( x = 0; x < limitCol; x++) {
					if (!opts.matrix[y * limitCol + x])
						continue;
					
					var currZone = opts.cells[currZoneIndex];
					var cellSizes = reserveMatrix(parseInt(currZone.colspan),
							parseInt(currZone.rowspan), x, y, limitCol, opts);
					opts.matrix[y * limitCol + x] = true;
					currZoneIndex++;

					currentTD = document.createElement('td');
					$(currentTD).attr('id', 'zone' + currZone.id).attr('width',
							cellSizes.x).attr('height', cellSizes.y).css(
							'width', cellSizes.x + 'px').css('height',
							cellSizes.y + 'px').addClass('ui-zone');
					$(currentTR).append(currentTD);

					currentTD.colSpan = currZone.colspan;
					currentTD.rowSpan = currZone.rowspan;
					$(currentTD).attr('colspan', currZone.colspan);
					$(currentTD).attr('rowspan', currZone.rowspan);

				}
				$(currentTBLBody).append(currentTR);
			}

			for (i = 0; i < limitCol; i++) {
				var currentCol = document.createElement('col');
				$(currentCol).css('width', opts.sizesW[i] + 'px');
				$(currentTBL).append(currentCol);
			}

			$(currentTBL).append(currentTBLBody);

			$('td', currentTBL).each(function() {
				var $this = $(this);
				var newDiv = document.createElement('div');
				$(newDiv)
					.css('position', 'absolute').css('width', (parseInt($this.attr('width')) - 2) + 'px')
					.css('height', (parseInt($this.attr('height')) - 2) + 'px') 
					.addClass('ui-zone-fill');
				$this.append(newDiv);
			});

			if (opts.formatTable) {

				var tds = $('td', currentTBL);

				currZoneIndex = 0;

				var newMatrix = [];
				var currentIndex = 0;
				for (var y = 0; y < opts.maxRow; y++) {
					for (var x = 0; x < opts.maxCol; x++) {
						var newNode = {};
						newNode.state = opts.matrix[y * opts.maxCol + x];
						if (opts.matrix[y * opts.maxCol + x]) {
							newNode.colspan = parseInt(opts.cells[currentIndex].colspan);
							newNode.rowspan = parseInt(opts.cells[currentIndex].rowspan);
							newNode.index = currentIndex;
							currentIndex++;
						}
						newMatrix[y * opts.maxCol + x] = $.extend(newMatrix[y * opts.maxCol + x], newNode);
					}
				}


				$(tds).each(function() {

					if (parseInt($(this).attr('rowspan')) > 1 || parseInt($(this).attr('colspan')) > 1) {
						$(this).prepend(createButton(this, 'split', opts, currZoneIndex));
					}

					var cZoneIndex = 0;
					var targetZoneIndex;
					for (var y = 0; y < opts.maxRow; y++) {
						for (var x = 0; x < opts.maxCol; x++) {
							var current = newMatrix[y * opts.maxCol + x];

							if (!current.state)
								continue;
							if (cZoneIndex == currZoneIndex) {

								if (y > 0) {
									for (var j = 1; j <= y; j++) {
										if (newMatrix[(y - j) * opts.maxCol + x].state && newMatrix[(y - j) * opts.maxCol + x].rowspan == j) {
											var top = newMatrix[(y - j) * opts.maxCol + x];
											break;
										}
									}
								}

								if (!(x + current.colspan >= opts.maxCol))
									var right = newMatrix[y * opts.maxCol + (x + parseInt(current.colspan))];
								if (!(y + current.rowspan >= opts.maxRow))
									var bottom = newMatrix[(y + parseInt(current.rowspan)) * opts.maxCol + x];
								if (x > 0)
									var left = newMatrix[y * opts.maxCol + (x - 1)];

								// top
								if ((y > 0) && typeof(top) != 'undefined' && top.state && (top.colspan == current.colspan)) {
									targetZoneIndex = top.index;
									$(this).prepend(createButton(this, 'top', opts, currZoneIndex, targetZoneIndex));
								}
								// right
								if ((x < opts.maxCol - 1) && typeof(right) != 'undefined' && right.state && (right.rowspan == current.rowspan)) {
									targetZoneIndex = right.index;
									$(this).prepend(createButton(this, 'right', opts, currZoneIndex, targetZoneIndex));
								}
								// left
								if ((x > 0) && typeof(left) != 'undefined' && left.state && (left.rowspan == current.rowspan)) {
									targetZoneIndex = left.index;
									$(this).prepend(createButton(this, 'left', opts, currZoneIndex, targetZoneIndex));
								}
								// bottom
								if ((y < opts.maxRow - 1) && typeof(bottom) != 'undefined' && bottom.state && (bottom.colspan == current.colspan)) {
									targetZoneIndex = bottom.index;
									$(this).prepend(createButton(this, 'bottom', opts, currZoneIndex, targetZoneIndex));
								}
							}

							cZoneIndex++;

						}
					}

					currZoneIndex++;

				}).click(function() {
							$('td', currentTBL).removeClass('selected');
							$(this).addClass('selected');
						}).hover(function() {
							$('td', currentTBL).removeClass('selected');
							$(this).addClass('selected');
						});
			}

			if (opts.showSizes) {
				return [HSizesTBL, WSizesTBL, currentTBL];
			} else {
				return [currentTBL];
			}

		};

		/***********************************************************************
		 * CREATE BUTTON (Join/Split)
		 **********************************************************************/
		var createButton = function(el, dir, opts, index, targetIndex) {
			var button = document.createElement('div');
			$(button)
				.addClass('ui-zone-button')
				.addClass(dir).css('position', 'absolute')
				.css('z-index', '1000')
				.hover(function() {
						$(this).addClass('ui-button-hover');
					}, function() {
						$(this).removeClass('ui-button-hover');
					});

			switch (dir) {
				case 'top' :
					$(button)
						.css('margin-left', Math.round(parseInt($(el).attr('width')) / 2) - 7+ 'px')
						.append("&uarr;")
						.bind('click', opts, function(e) {
								rebuildCells(e.data, index, targetIndex, 'top');
						});
					break;
				case 'right' :
					$(button)
						.css('margin-left', Math.round(parseInt($(el).attr('width'))) - 15 + 'px')
						.css('margin-top', Math.round(parseInt($(el).attr('height')) / 2) - 7+ 'px')
						.append("&rarr;")
						.bind('click', opts, function(e) {
								rebuildCells(e.data, index, targetIndex, 'right');
						});
					break;
				case 'bottom' :
					$(button)
						.css('margin-left', Math.round(parseInt($(el).attr('width')) / 2) - 7 + 'px')
						.css('margin-top', Math.round(parseInt($(el).attr('height'))) - 15 + 'px')
						.append("&darr;")
						.bind('click',opts, function(e) {
								rebuildCells(e.data, index, targetIndex, 'bottom');
						});
					break;
				case 'left' :
					$(button)
						.css('margin-top', Math.round(parseInt($(el).attr('height')) / 2) - 7 + 'px')
						.append("&larr;")
						.bind('click', opts, function(e) { 
							rebuildCells(e.data, index, targetIndex, 'left');
						});
					break;
				case 'split' :
					$(button)
						.css('margin-left', Math.round(parseInt($(el).attr('width')) / 2) - 15 + 'px')
						.css('margin-top', Math.round(parseInt($(el).attr('height')) / 2) - 10 + 'px')
						.text(opts.l.split)
						.bind('click', opts, function(e) {
							var currentIndex = 0;
							var newCells = [];
							for ( y = 0; y <= e.data.maxRow - 1; y++) {
								for ( x = 0; x <= e.data.maxCol - 1; x++) {
									if (e.data.matrix[y * e.data.maxCol + x] == false)
										continue;

									var currZone = e.data.cells[currentIndex];
									if (currentIndex == index) {
										for (var j = y; j <= y
												+ parseInt(currZone.rowspan)
												- 1; j++) {
											for (var i = x; i <= x
													+ parseInt(currZone.colspan)
													- 1; i++) {
												e.data.matrix[j
														* e.data.maxCol + i] = 'reserved';
											}
										}
										e.data.cells[currentIndex].colspan = 1;
										e.data.cells[currentIndex].rowspan = 1;
										e.data.matrix[y * e.data.maxCol + x] = true;
									}
									currentIndex++;
								}
							}

							currentIndex = 0;
							var newIndex = 0;

							for (var y = 0; y <= e.data.maxRow - 1; y++) {
								for (var x = 0; x <= e.data.maxCol - 1; x++) {
									currZone = e.data.cells[currentIndex];
									if (e.data.matrix[y * e.data.maxCol + x] == true) {
										newCells[newIndex] = currZone;
										currentIndex++;
										newIndex++;
										continue;
									}

									if (e.data.matrix[y * e.data.maxCol + x] == 'reserved') {
										newCells[newIndex] = {
											'colspan' : 1,
											'rowspan' : 1
										};
										e.data.matrix[y * e.data.maxCol + x] = true;
										newIndex++;

									}
								}
							}

							e.data.cells = newCells;
							e.data.rebuild(e.data);

						});
					break;
			}

			return button;
		};

		var deleteZone = function(arr, index) {
			var newArr = [];
			for (var i = 0; i < arr.length; i++) {
				if (i != index)
					newArr[newArr.length] = arr[i];
			}
			return newArr;
		};

		var rebuildCells;
		rebuildCells = function (o, index, targetIndex, direction) {
			switch (direction) {
				case 'bottom' :
					o.cells[index].rowspan = parseInt(o.cells[index].rowspan)
					+ parseInt(o.cells[targetIndex].rowspan);
					o.cells = deleteZone(o.cells, targetIndex);
					break;
				case 'top' :
					o.cells[targetIndex].rowspan = parseInt(o.cells[index].rowspan) + parseInt(o.cells[targetIndex].rowspan);
					o.cells[targetIndex].id = o.cells[index].id;
					o.cells = deleteZone(o.cells, index);
					break;
				case 'left' :
					o.cells[targetIndex].colspan = parseInt(o.cells[index].colspan) + parseInt(o.cells[targetIndex].colspan);
					o.cells[targetIndex].id = o.cells[index].id;
					o.cells = deleteZone(o.cells, index);
					break;
				case 'right' :
					o.cells[index].colspan = parseInt(o.cells[index].colspan) + parseInt(o.cells[targetIndex].colspan);
					o.cells = deleteZone(o.cells, targetIndex);
					break;
			}
			o.rebuild(o);
		};

		/***********************************************************************
		 * 
		 **********************************************************************/
		return this.each(function() {
			init(options);
		});
	};
});