JSVolume 0.1
============
A JSVolume is a 3d grid elements represented internally by a single-dimensional 
array. This provides superior performance to a multi-dimensional array, which isn't a real thing
in javascript anyway (if you want multidimensional arrays, try an NDArray library).

JSVolumes can do functional array-ish things like map, reduce and slice, and boolean 
operations like merge and intersect. Someday it might also support matrix tranformations
natively, but for now you can do that (and filters, and other neat things) using JSVolume.map. I'd also like it to natively support efficient conversion to and from a Sparse Voxel Octree, but that requires an SVO object which I haven't finished yet.

JSVolume assumes the presence of typed arrays, so use a polyfill if you need to.

JSVolumes provide convenient accessors that internally handle lookups on the array based on 
absolute (global) or relative (internal) coordinates. A volume's basic methods operate in 
absolute coordinate. The offsets are applied internally. It also exposes relative versions of 
the methods to work with the relative values used internally, which are always relative to [0,0,0].

JSVolume is compatible with 3-dimensional vectors and coordinates that behave like arrays of
[x,y,z] such as WebGL's Vec3, but floating point vectors will be coerced to integer vectors.

The internal (flattened) array supports standard JS arrays, typed arrays, or anything with
an array-like interface, which can be specified with the params.type parameter as
of the JSVolume.types constants or directly with the constructor for an array.

JSVolume coordinates are represented internally as Int32s, so the maximum size of a JSVolume is 
-2,147,483,647 to +2,147,483,647 inclusive on each axis. Be careful about memory usage when using
non-mutating methods. For example, a full-sized JSVolume of type Int32Array is 2^34 bits and change,
or a little over 2GB, meaning performing a JSVolume.map requires over 4GB of memory (note: this is
not currently 100% true, but it will be soon so treat it that way).

Usage Notes
===========
Hint: best practice would be to treat the elements of JSVolume as an index corresponding to an array of
values in a typical use-case where elements correspond to a small number of different values, and to 
use the smallest type you can. For example if your JSVolume stores locations of voxels, 
make an Array of voxel materials and use the JSVolume elements as indices for that array.

Another hint: you can use JSVolumes as indexes corresponding to arrays of other JSVolumes! So you could break
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
