JSVolume 0.1
============
A JSVolume is a 3d of grid elements represented internally by a single-dimensional 
array. This provides superior performance to a multi-dimensional array, which isn't a real thing
in javascript anyway (if you want multidimensional arrays of arbitrary dimensions, try an NDArray library).

JSVolumes can do functional array-ish things like map, reduce and lice, and boolean 
operations like merge and intersect. Someday it might also support matrix tranformations
natively, but for now you can do that (and filters, and other neat things) using JSVolume.map. 
I'd also like it to natively support efficient conversion to and from a Sparse Voxel Octree, but that 
requires an SVO object which I haven't finished yet.

JSVolume assumes the presence of typed arrays, so use a polyfill if you need to.

JSVolumes provide convenient accessors that internally handle lookups on the array based on 
absolute (global) or relative (internal) coordinates. A volume's basic methods operate in 
absolute coordinate. The offsets are applied internally. It also exposes relative versions of 
the methods to work with the relative values used internally, which are always relative to [0,0,0].

Examples
========
See the doc folder for full documentation.

Constructor
-----------
Create a basic 10x10x10 volume:

```javascript
var volume = new JSVolume({dimensions:[10,10,10]});
volume.width; // 10
volume.height; // 10
volume.depth; // 10
```

If your volume is a cube, you can use a shortcut:
```javascript
var volume = new JSVolume({dimensions:10});
volume.width; // 10
volume.height; // 10
volume.depth; // 10
```

Dimensions must be at least 1x1x1 - JSVolume will refuse to create a volume with zero elements:
```javascript
var volume = new JSVolume({dimensions:[0,0,1]}); // throws an error
```

Create a 10x10x10 volume and offset 2 units from the center on each axis:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[2,2,2]});
```
Offsets let you operate transparently on a volume that contains only part of a larger grid. You don't have to worry about the internal representation, only its position in global space.

You can use negative offsets too:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[-2,10,-30]});
```

Create a volume of Int8s (stored as an Int8Arry) with dimensions 10x10x10 ranging from [-5,0,20] to [4,9,29]:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[-5,0,20], type:Int8Array});
```

Use the types map on the JSVolume.prototype if you want extra safety:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[-5,0,20], type:JSVolume.prototype.FLOAT32ARRAY});
JSVolume.prototype.types; // {ARRAY:Array, INT8ARRAY:Int8Array, INT32ARRAY:Int32Array, UINT8ARRAY:Uint8Array, UINT8CLAMPEDARRAY:Uint8ClampedArray, UINT16ARRAY:Uint16Array, UINT32ARRAY:Uint32Array, FLOAT32ARRAY:Float32Array, FLOAT64ARRAY:Float64Array}
```

You can supply vectors in place of coordinates if you're using a vector library:
```javascript
var offsetVec = new Vec3([-5,0,20]);
var dimensionVec = new Vec3([10,10,10]);
var volume = new JSVolume({dimensions:dimensionVec, offsets:offsetVec});
```

Properties
----------

Find the bottom, west, south corner of a volume by looking at its offsets:
```javascript
var volume = new JSVolume({dimensions:[10,10,10]});
volume.offsets; // [0,0,0]
```

Find the top, east, north corner of a volume by looking at its extents:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[5,5,5]});
volume.extents; // [14,14,14]
```

Find the outer bounds of a volume in its boundaries:
```javascript
var volume = new JSVolume({dimensions:[10,10,10], offsets:[5,10,15]});
volume.boundaries; // {west:5, east:14, bottom:10, top:19, south:15, north:24}
```

The width, height, and depth properties are exactly what they sound like:
```javascript
var volume = new JSVolume({dimensions:[4,5,6]});
volume.width; // 4
volume.height; // 5
volume.depth; // 6

### Caution
*Don't* set the above properties directly. JSVolumes aren't clever enough to update
related properties when you do.

Access the volume's elements directly:
```javascript
var volume = new JSVolume({dimensions:[3,3,3]});
volume.elements[26]; // the topmost, northmost, eastmost element
```
It's safe to set and get elements this way, and even do some kinds of array operations, but don't do anything that will change the length or order of the array. That would corrupt the volume. In general, stick to JSVolume's methods for altering properties.

Methods
=======

Querying Methods
----------------
Find out stuff about the volume's elements.

### JSVolume#getElement
Get an element by its coordinates, accounting for offsets:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[12,3,2]}).fill(3);
volume.getElement([13,5,5]); // 3
```

You can use vectors here too (this is the last time we'll mention it):
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[12,3,2]}).fill(3);
var coord = new Vec3([13,5,5]);
volume.getElement(coord); // 3
```

### JSVolume#setElement
Set the value of an element at a coordinate, accounting for offsets:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[12,3,2]}).fill(3);
var coord = new Vec3([13,5,5]);
volume.getElement(coord); // 3
volume.setElement(coord, 7);
volume.getElement(coord); // 7
```

### JSVolume#getElementIndex
Find the index of an element at a given coordinate:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]});
volume.getElementIndex([3,4,5]); // 21
```

### JSVolume#getElementIndexRelative
Find the index of an element given coordinates disregarding the offsets (i.e. relative to internal [0,0,0])
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]});
volume.getElementIndexRelative([0,1,2]); // 21
```

*Note*: Don't worry too much about how the indices map to the coordinates - it "just works" - but here's the implementation if you're interested:
```javascript
index = x + width * (y + height * z); // relative to internal origin [0,0,0] 
```

### JSVolume#hasCoord
Find out whether a volume contains a coordinate:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]});
volume.hasCoord([3,3,3]); // true
volume.hasCoord([5,5,5]); // true
volume.hasCoord([3,7,3]); // false
```

### JSVolume#getElementCoords
Find the coordinates of an element by index:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]});
volume.getElementCoords(26); // [5,5,5]
```

### JSVolume#getElementCoordsRelative
Find the internal coordinates of an element by index:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]});
volume.getElementCoordsRelative(26); // [2,2,2]
```

Mutating Methods 
----------------
Change the contents of your volume.

### JSVolume#setElement
Set the value of an element, given its coordinates in global space:
```javascript
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]}).fill(3);
volume.setElement([3,4,5], 3);
volume.getElement([3,4,5]); // 3
```

### JSVolume#fill
Fill a volume's elements with a uniform value, just like Array#fill:
```javascript
var volume = new JSVolume({dimensions:[3,3,3]});
volume.fill(2);
```

Fill returns the JSVolume, so you can chain it:
```javascript
var volume = new JSVolume({dimensions:[3,3,3]});
volume.fill(2).getElement([2,2,2]); // 2
```

Pure Methods
------------
Create a modified copy of your volume without changing the original.

### JSVolume#slice
Take a slice of your volume. Similar to Array#slice, but not identical. The first
argument is a vector of the origin of the slice, and the second argument is a vector of the width, height, and depth of the slice. The slice can be out of bounds of the original volume; any out-of-bounds objects will be initialized to undefined.

```javascript
var slice;
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]}).fill(3);
slice = volume.slice([4,3,4], [1,3,1]); // the central vertical column of the volume
slice = volume.slice([3,3,3], [3,3,1]); // the western side of the volume
slice = volume.slice([3,3,3], [1,1,1]); // the bottom, west, south corner
slice = volume.slice([0,0,0], [9,9,9]); // now you have a 9x9x9 volume with the original 3x3x3 volume in the center surrounded by undefined elements
slice = volume.slice([3,3,3], [0,1000,0]); // throws an error! a 0x1000x0 volume contains no elements
```

### JSVolume#map
Map works identically to Array#map, which lets you do all kinds of awesome things.
```javascript
var slice;
var volume = new JSVolume({dimensions:[3,3,3], offsets:[3,3,3]}).fill(3);
var mappedVolume = volume.map(function(value, index, arr) {
	var coords = arr.getElementCoords(index);
	return "x:"+coords[0]+",y:"+coords[1]+",z:"+coords[2];		
});
mappedVolume.getElement([3,4,5]); // "x:3,y:4,z:5"
```

(more to come)

Usage Notes
===========

Vector Compatibility
--------------------
JSVolume is compatible with 3-dimensional vectors and coordinates that behave like arrays of
[x,y,z], but floating point vectors will be coerced to integer vectors. (note: this is
not currently 100% true, but it will be soon so treat it that way).


Internal Array Types
--------------------
The internal (flattened) array supports standard JS arrays, typed arrays, or anything with
an array-like interface, which can be specified with the params.type parameter as
of the JSVolume.types constants or directly with the constructor for an array.

Internal Coordinate Types
-------------------------
JSVolume coordinates are represented internally as Int32s, so the maximum size of a JSVolume is 
-2,147,483,647 to +2,147,483,647 inclusive on each axis. Be careful about memory usage when using
non-mutating methods. For example, a full-sized JSVolume of type Int32Array is 2^34 bits and change,
or a little over 2GB, meaning performing a JSVolume.map on a volume that size requires over 4GB of 
memory. Same goes for any other non-mutating methods that return a copy of the volume.

Best Practices
--------------
Treat the elements of JSVolume as an index corresponding to an array of
values in a typical use-case where elements correspond to a small number of different values, and to 
use the smallest type you can. For example if your JSVolume stores locations of voxels, 
make an Array of voxel materials and use the JSVolume elements as indices for that array.

You can use JSVolumes as indexes corresponding to arrays of other JSVolumes! So you could break
your 256x256x256 volume into chunks of 16x16x16, then index those in an 8x8x8 volume, letting you perform
much more memory efficient operations on subsets of your full dataset. This also means if you need truly massive
volumes that extend beyond the range of an Int32 coordinate system you can do that. You can even defer initialization of
sub-volumes until you need them using this technique! Conversely, you probably don't want to make a directly hierarchical 
JSVolume. Repeat this mantra: the elements of my JSVolume are indexes for an array of values, not the 
values themselves.

Last but not least, most of JSVolume's methods as well as its constructor support lazy coding
with sane defaults and type coercion so you have plenty of rope to hang yourself with.

Contributing
============
Bug reports,fixes and optimizations are welcome! As for feature additions, I want to keep this library lightweight. As a rule of thumb if
the feature is generalized and can't be easily done with a JSVolume#map call, I'm probably interested. Please keep in mind the license
permits commercial use, so if me or someone else getting paid for content that includes your contributions might result in
butthurt you might not want to submit your pull request.

License (MIT)
=============
Copyright 2015 Justen Robertson <nphyxx@gmail.com> / https://github.com/nphyx.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
