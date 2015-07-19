"use strict";
/**
 * JSVolume
 *
 * A JSVolume is a group of grid-aligned elements represented internally by a single-dimensional 
 * array.
 *
 * @module JSVolume
 * @constructor
 * @param params an object with the following members:
 * @param params.offsets {array} [x, y, z] - an array of coordinates denoting the top, north, east corner of the grid
 * @param params.dimensions {mixed} [width, height, length] or int - an array of width, height, and length, or a single integer equal to the length of a side if the dimensions are identical
 * @param params.type {mixed} one of the JSVolume.types, or a constructor for any Array or Array-like object
 * @property {int} width width of the volume in units
 * @property {int} height width of the volume in units
 * @property {int} depth width of the volume in units
 * @property {Int32Array} offsets offsets of the bottom, north, west corner of the JSVolume
 * @property {object} boundaries object defining the north, south, east, west, top and bottom bounds
 * @property {array} elements elements are stored in a flattened array
 */
function JSVolume(params) {
	/**
	 * use these during initialization, providing defaults here because
	 * they're going to get set to read-only properties when we're done
	 */
	var _type = JSVolume.prototype.types.ARRAY;
	var _dimensions = new Uint32Array([1,1,1]);
	var _offsets = new Int32Array([0,0,0]);
	var _extents = new Int32Array([1,1,1]);


	/**
	 * Do some checking with the parameters to make sure they're not dangerous or silly.
	 */
	if(typeof params !== "undefined") {
		/**
		 * Type contains the constructor for the type of Array we use to store
		 * our volume elements internally.
		 */
		_type = (typeof params.type === "function")?params.type:Array;
		switch(typeof params.dimensions) {
			case "undefined": // already set up defaults
			break;
			case "number":
				_dimensions = new Uint32Array([params.dimensions, params.dimensions, params.dimensions]);
			break;
			case "object":
				if(params.dimensions.length == 3) {
					if(params.dimensions[0] < 1 || params.dimensions[1] < 1 || params.dimensions[2] < 1) throw new Error("refusing to create volume with empty or negative dimensions");
					else _dimensions = new Uint32Array(params.dimensions);
				}
			break;
			default:
				throw new TypeError(params.dimensions + " is neither an integer nor vectorish");
		}
		switch(typeof params.offsets) {
			case "undefined": // already set up defaults
			break;
			case "number":
				_offsets = new Int32Array([params.offsets, params.offsets, params.offsets]);
			break;
			case "object":
				if(params.offsets.length === 3) {
					_offsets = new Int32Array(params.offsets);
				}
			break;
			default:
				throw new TypeError(params.offsets + " is neither an integer nor vectorish");
		}
		_extents = new Int32Array([
			_offsets[0] + _dimensions[0] -1,
			_offsets[1] + _dimensions[1] -1,
			_offsets[2] + _dimensions[2] -1
		]);
	}

	/**
	 * All of these properties are read-only because changing them after initialization
	 * would corrupt the volume. We define accessors here so they can get at the
	 * privateish values. The only way to prevent mutation of TypedArray values that
	 * I know of is to make a copy. - Nphyx 
	 */
	Object.defineProperty(this, "type", {get:function() {return _type}});
	Object.defineProperty(this, "dimensions", {get:function() {return new Uint32Array(_dimensions)}});
	Object.defineProperty(this, "offsets", {get:function() {return new Int32Array(_offsets)}});
	Object.defineProperty(this, "extents", {get:function() {return new Int32Array(_extents)}});

	/**
	 * Prevents the elements array from being overwritten but permits individual
	 * elements to be written to
	 */
	Object.defineProperty(this, "elements", {value: new this.type(_dimensions[0]*_dimensions[1]*_dimensions[2]), writable:false});
	Object.defineProperties(this, {
		width:{value:_dimensions[0], writable:false},
		height:{value:_dimensions[1], writable:false},
		depth:{value:_dimensions[2], writable:false},
		boundaries:{value:{
				west:_offsets[0],
				bottom:_offsets[1],
				north:_offsets[2],
				east:_extents[0],
				top:_extents[1],
				south:_extents[2]
			}, writable:false
		}
	});

	// methods below defined internally because they need to access internal props
	// directly and it's much slower if they have to get at the cloned values. small
	// memory hit, big performance gain

	/**
	 * Checks whether a requested coordinate is valid.
	 */
	this.hasCoord = function hasCoord(coord) {
		return (
			coord[0] >= _offsets[0] && coord[0] <= _extents[0] &&
			coord[1] >= _offsets[1] && coord[1] <= _extents[1] &&
			coord[2] >= _offsets[2] && coord[2] <= _extents[2]
		);
	}

	/**
	 * Gets a element's index by its internal coordinates.
	 */
	this.getElementIndexRelative = function getElementIndexRelative(coord) {
		return coord[0] + _dimensions[0] * (coord[1] + _dimensions[1] * coord[2]);
	}

	/**
	 * Gets the internal coordinates for the element in this.elements corresponding to the given index.
	 */
	this.getElementCoordsRelative = function getElementCoordsRelative(index) {
		if(index < 0 || index > this.elements.length) return false;
		return new Int32Array([
			index%_dimensions[0], 
			Math.floor(index/_dimensions[0])%_dimensions[1],
			Math.floor(index/_dimensions[0]/_dimensions[1])%_dimensions[2]
		]);
	}

	/**
	 * Finds the internal index of a element given its external coordinates
	 * @param coord {mixed} a 3-element array or array-like object of x, y, and z coordinates
	 */
	this.getElementIndex = function getElementIndex(coord) {
		if(!this.hasCoord(coord)) return false;
		return (coord[0] - _offsets[0]) + _dimensions[0] * ((coord[1] - _offsets[1]) + _dimensions[1] * (coord[2] - _offsets[2]));
	}

	/**
	 * Gets absolute coordinates of a element by its index in the elements array.
	 */
	this.getElementCoords = function getElementCoords(index) {
		if(index < 0 || index > this.elements.length) return false;
		else return new Int32Array([
			index%_dimensions[0] + _offsets[0], 
			Math.floor(index/_dimensions[0])%_dimensions[1] + _offsets[1],
			Math.floor(index/_dimensions[0]/_dimensions[1])%_dimensions[2] + _offsets[2]
		]);
	}

	return this;
}

/**
 * Some virtual properties for convenience / backward compatibility with 0.1
 */

JSVolume.prototype.types = {
	ARRAY:Array,
	INT8ARRAY:Int8Array,
	INT16ARRAY:Int16Array,
	INT32ARRAY:Int32Array,
	UINT8ARRAY:Uint8Array,
	UINT8CLAMPEDARRAY:Uint8ClampedArray, 
	UINT16ARRAY:Uint16Array,
	UINT32ARRAY:Uint32Array,
	FLOAT32ARRAY:Float32Array,
	FLOAT64ARRAY:Float64Array
}


	/**
	 * gets a element by its x, y, and z coordinates
	 */
JSVolume.prototype.getElement = function getElement(coord) {
	try {
		return this.elements[this.getElementIndex(coord)];
	}
	catch (e) {return undefined;}
}

/**
 * Sets the element at the given coordinates
 */
JSVolume.prototype.setElement = function(coord, value) {
	return (this.elements[this.getElementIndex(coord)] = value);
}

/**
 * Returns a shallow copy of a portion of the volume starting at inclusive [begin] and extending to exclusive [size]. 
 *
 * Similar to Array#slice but not identical, since the negative [end] parameter behavior of Array#slice isn't 
 * meaningful in this context. 
 *
 * Extents of the new volume may be greater than those of the original volume, in which case empty elements are undefined.
 *
 * Offsets are calculated based on the original volume.
 */
JSVolume.prototype.slice = function slice(start, size) {
	var element, px, py, pz, normalStart, normalEnd;
	if(size[0] === 0 || size[1] === 0 || size[2] === 0) throw new Error("Size may not be zero on any axis when slicing as this would produce an empty volume");
	// normalize start and size to a box designated by the [north,bottom,west] and [south,top,east] vertices.
	// this makes iteration easier and helps calculate the new offsets
	normalStart = [Math.min(start[0], start[0]+size[0]), Math.min(start[1], start[1]+size[1]), Math.min(start[2], start[2]+size[2])];
	normalEnd = [Math.max(start[0], start[0]+size[0]), Math.max(start[1], start[1]+size[1]), Math.max(start[2], start[2]+size[2])];
	var offsets = this.offsets;

	var params = {
		offsets:new Int32Array([offsets[0]+normalStart[0],offsets[1]+normalStart[1],offsets[2]+normalStart[2]]),
		dimensions:new Int32Array([normalEnd[0]-normalStart[0], normalEnd[1]-normalStart[1], normalEnd[2]-normalStart[2]])
	}
	var volume = new JSVolume(params);

	for(px = normalStart[0]; px < normalEnd[0]; px++) {
		for(py = normalStart[0]; py < normalEnd[0]; py++) {
			for(pz = normalStart[0]; pz < normalEnd[0]; pz++) {
				if(this.hasCoord([px, py, pz])) element = this.getElement([px, py, pz]);
				else element = undefined;
				volume.setElement([px, py, pz], element);
			}
		}
	}
	return volume;
}

/**
 * Identical behavior to Array#map, except that the return value will be a new JSVolume with the same initial parameters
 * as the original JSVolume. Does not mutate the original JSVolume, although the callback might.
 *
 * Hint: use JSVolume#getNodeCoords and JSVolume#getNodeCoordsRelative to find the coordinates of an element.
 */
JSVolume.prototype.map = function map(callback) {
	if(typeof(this) === undefined) throw new TypeError("this is null or not defined");
	if(typeof callback !== "function") throw new TypeError(callback + " is not a function");
	var that;
	var i = 0;
	var newVolume = new JSVolume({
		offsets:this.offsets,
		dimensions:[this.width, this.height, this.depth],
		type:this.type
	});

	if(arguments.length === 2) that = arguments[1];
	else that = this;

	for(i; i < newVolume.elements.length; i++) {
		newVolume.elements[i] = callback.apply(that, [this.elements[i], i, this]);
	}
	return newVolume;
}

/**
 * Identical behavior to Array#reduce. Does not mutate the JSVolume, although the callback might.
 *
 * Hint: use JSVolume#getNodeCoords and JSVolume#getNodeCoordsRelative to find the coordinates of an element.
 */
JSVolume.prototype.reduce = function reduce(callback) {
	var initialVal;
	var i = 0;
	if(arguments.length === 2) initialVal = arguments[1];
	else if(this.elements.length === 1) return this.elements[0];
	else {
		initialVal = this.elements[0];
		i++;
	}
	
	for(; i < this.elements.length; i++) {
		initialVal = callback(initialVal, this.elements[i], i, this);
	}
	return initialVal;
}

/**
 * Applies the callback function once for each element, with the JSVolume in context of
 * this. Callback should accept a single argument, index, which is the index of the
 * current element. It"s done this way because some volumes will have primitives as element
 * values rather than objects to which the callback can be applied directly.
 * @return this
 */
JSVolume.prototype.each = function(callback) {
	var i;
	for(i = 0; i < this.elements.length; i++) {
		callback.call(this, i);
	}
	return this;
}

/**
 * Fill a volume with a value.
 * @return this
 */
JSVolume.prototype.fill = function(newValue) {
	var i;
	for(i = 0; i < this.elements.length; i++) {
		this.elements[i] = newValue;
	}
	return this;
}

/**
 * Checks whether the volume is within the boundaries set by the boundaries argument, an object
 * containing north, south, east, west, top and bottom members to test against.
 */
JSVolume.prototype.isContainedBy = function isContainedBy(boundaries) {
	return (
		this.offsets[0] >= boundaries.west && this.offsets[0]+this.width <= boundaries.east &&
		this.offsets[1] >= boundaries.bottom && this.offsets[1]+this.height <= boundaries.top &&
		this.offsets[2] >= boundaries.north && this.offsets[2]+this.depth <= boundaries.south
	);
}

/**
 * Checks whether the volume can contain another volume's boundaries.
 */
JSVolume.prototype.canContain = function(boundaries) {
	return (
		this.offsets[0] <= boundaries.west && this.offsets[0]+this.width >= boundaries.east &&
		this.offsets[1] <= boundaries.bottom && this.offsets[1]+this.height >= boundaries.top &&
		this.offsets[2] <= boundaries.north && this.offsets[2]+this.depth >= boundaries.south
	);
}

/**
 * Gets the extents of a volume by checking whether the element at each location is truthy and, if so,
 * whether it is the highest or lowest in its range
 */
JSVolume.prototype.getExtents = function getExtents() {
	var extents = {
		north:0,
		south:0,
		east:0,
		west:0,
		top:0,
		bottom:0
	}
	var coords;
	this.each(function(index) {
		if(this.elements[index]) {
			coords = this.getElementCoords(index);	
			if(coords[0] > extents.east) extents.east = coords[0];
			if(coords[0] < extents.west) extents.west = coords[0];
			if(coords[1] > extents.south) extents.south = coords[1];
			if(coords[1] < extents.north) extents.north = coords[1];
			if(coords[2] > extents.bottom) extents.bottom = coords[2];
			if(coords[2] < extents.top) extents.top = coords[2];
		}
	});
	return extents;
}

/**
 * Utility function to compare the types of two or more volumes, returning true if
 * all volumes are the same type, false if they are not.
 */
JSVolume.prototype.isSameType = function isSameType() {
	var i, typeOfThis, typeOfThat;
	typeOfThis = Object.prototype.toString.call(this.elements);
	var volumes = [];
	volumes.push(this);
	if(!arguments.length) {
		throw new Error("JSVolume.isSameType must be given at least one argument!");
	}
	for(i = 0; i < arguments.length; i++) {
		if(!(arguments[i] instanceof JSVolume)) throw new TypeError(arguments[i] + " is not a JSVolume");
		typeOfThat = Object.prototype.toString.call(arguments[i].elements);
		if(typeOfThis !== typeOfThat) return false;
	}
	return true;
}

/**
 * Merges this JSVolume with one or more additional JSVolumes, expanding the volume if neccessary, with a right-to-left precedence if there are overlaps. 
 * If the element types are different they'll be coerced to the type of this volume (be careful, or start with a generic array typed volume!).
 * Does not mutate the original JSVolume. Equivalent to boolean OR (and aliased as JSVolume.or).
 */
JSVolume.prototype.merge = function merge() {
	var i, n, newVolume, volume, newCoords;
	// start with the maximum boundaries and pare them down
	var newStart = [Math.pow(2,31),Math.pow(2,31),Math.pow(2,31)];
	var newEnd = [-Math.pow(2,31),-Math.pow(2,31),-Math.pow(2,31)];
	var dimensions = new Int32Array(3);
	var volumes = [];
	volumes.push(this);
	if(JSVolume.prototype.isSameType.apply(this, arguments)) {
		for(i = 0; i < arguments.length; i++) {
			volumes.push(arguments[i]);
		}
	}
	else throw new TypeError("JSVolume#merge tried to merge volumes with different types");
	
	for(i = 0; i < volumes.length; i++) {
		volume = volumes[i];
		for(n = 0; n < 3; n++) if(volume.offsets[n] < newStart[n]) newStart[n] = volume.offsets[n];
		for(n = 0; n < 3; n++) if(volume.extents[n] > newEnd[n]) newEnd[n] = volume.extents[n];
	}
	dimensions[0] = newEnd[0]-newStart[0]+1;
	dimensions[1] = newEnd[1]-newStart[1]+1;
	dimensions[2] = newEnd[2]-newStart[2]+1;

	newVolume = new JSVolume({offsets:newStart, dimensions:dimensions, type:this.type});
	var check = function(i) {
		newCoords = this.getElementCoords(i);
		newVolume.setElement(newCoords, this.elements[i]);
	}
	for(i = 0; i < volumes.length; i++) {
		volume = volumes[i];
		volume.each(check);
	}
	return newVolume;
}
/**
 * Alias for merge.
 */
JSVolume.prototype.or = JSVolume.prototype.merge;

/**
 * Returns a new volume that is an intersection of this volume and the volumes provided. Equivalent to boolean AND (and
 * aliased as JSVolume.and).
 */
JSVolume.prototype.intersect = function intersect() {
	var i, n, coord, volume, newVolume;
	// start with the minimum boundaries and pare them down
	var newStart = [-Math.pow(2,31),-Math.pow(2,31),-Math.pow(2,31)];
	var newEnd = [Math.pow(2,31),Math.pow(2,31),Math.pow(2,31)];
	var dimensions = new Int32Array(3);
	var volumes = [];
	volumes.push(this);
	if(JSVolume.prototype.isSameType.apply(this, arguments)) {
		for(i = 0; i < arguments.length; i++) {
			volumes.push(arguments[i]);
		}
	}
	else throw new TypeError("JSVolume#intersect tried to intersect volumes with different types");
	
	for(i = 0; i < volumes.length; i++) {
		volume = volumes[i];
		for(n = 0; n < 3; n++) if(volume.offsets[n] > newStart[n]) newStart[n] = volume.offsets[n];
		for(n = 0; n < 3; n++) if(volume.extents[n] < newEnd[n]) newEnd[n] = volume.extents[n];
	}
	// if there are no overlapping elements, stop here and return an empty volume
	if(newStart[0] > newEnd[0] || newStart[1] > newEnd[1] || newStart[2] > newEnd[2]) {
	 throw new Error("JSVolume#intersect tried to intersect volumes that don't overlap");
	}

	dimensions[0] = Math.max(newEnd[0]-newStart[0]+1, 0);
	dimensions[1] = Math.max(newEnd[1]-newStart[1]+1, 0);
	dimensions[2] = Math.max(newEnd[2]-newStart[2]+1, 0);

	newVolume = new JSVolume({offsets:newStart, dimensions:dimensions, type:this.type});

	for(i = 0; i < newVolume.elements.length; i++) {
		coord = newVolume.getElementCoords(i);
		for (n = 0; n < volumes.length; n++) {
			volume = volumes[n];
			if(volume.hasCoord(coord)) newVolume.elements[i] = volume.getElement(coord);
		}
	}
	return newVolume;
}

/**
 * Alias for JSVolume#intersect.
 */
JSVolume.prototype.and = JSVolume.prototype.intersect;

// Support Nodejs modules
if(typeof(module) !== "undefined") module.exports = JSVolume;
