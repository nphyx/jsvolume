/**
* Tests for the JSVolume object.
* @module TestJSVolume
*/
"use strict";
require("should");
var JSVolume = require("../src/jsvolume.js");
describe("JSVolume", function() {
	var volume, volume2, volume3, volume4, volume5, volume6;
	it("should create a volume object", function() {
		var volume = new JSVolume();
		volume.should.be.an.instanceOf(JSVolume);
		volume.should.have.property("width");
		volume.should.have.property("height");
		volume.should.have.property("depth");
		volume.should.have.property("offsets").with.length(3);
		volume.offsets.should.be.an.instanceOf(Int32Array);
		volume.should.have.property("extents").with.length(3);
		volume.extents.should.be.an.instanceOf(Int32Array);
		volume.should.have.property("elements").with.length(1);
		volume.should.have.property("boundaries").with.keys(["north","south","east","west","top","bottom"]);
	});

	volume = new JSVolume({offsets:[1,2,3], dimensions:[4,5,6]});
	it("should correctly apply offsets during initialization", function() {
		volume.offsets[0].should.equal(1);
		volume.offsets[1].should.equal(2);
		volume.offsets[2].should.equal(3);
	});
	it("should apply dimensions correctly during initialization", function() {
		volume.width.should.equal(4);
		volume.height.should.equal(5);
		volume.depth.should.equal(6);
	});
	it("should initialize elements array with the correct type and length", function() {
		volume.should.have.property("elements").with.length(120);
		volume.should.have.property("type").eql(Array);
	});
	it("should calculate boundaries correctly during initialization", function() {
		volume.should.have.property("boundaries");
		volume.boundaries.should.eql({north:3,east:4,south:8,west:1,top:6,bottom:2});
	});
	it("should have expected element indexes", function() {
		// check all the basic blocks
		volume.getElementIndexRelative([0,0,0]).should.equal(0);

		volume.getElementIndexRelative([1,0,0]).should.equal(1);
		volume.getElementIndexRelative([2,0,0]).should.equal(2);
		volume.getElementIndexRelative([3,0,0]).should.equal(3);

		volume.getElementIndexRelative([0,1,0]).should.equal(4);
		volume.getElementIndexRelative([0,2,0]).should.equal(8);
		volume.getElementIndexRelative([0,3,0]).should.equal(12);
		volume.getElementIndexRelative([0,4,0]).should.equal(16);

		volume.getElementIndexRelative([0,0,1]).should.equal(20);
		volume.getElementIndexRelative([0,0,2]).should.equal(40);
		volume.getElementIndexRelative([0,0,3]).should.equal(60);
		volume.getElementIndexRelative([0,0,4]).should.equal(80);
		volume.getElementIndexRelative([0,0,5]).should.equal(100);

		volume.getElementIndex([1,2,3]).should.equal(0);

		volume.getElementIndex([2,2,3]).should.equal(1);
		volume.getElementIndex([3,2,3]).should.equal(2);
		volume.getElementIndex([4,2,3]).should.equal(3);

		volume.getElementIndex([1,3,3]).should.equal(4);
		volume.getElementIndex([1,4,3]).should.equal(8);
		volume.getElementIndex([1,5,3]).should.equal(12);
		volume.getElementIndex([1,6,3]).should.equal(16);

		volume.getElementIndex([1,2,4]).should.equal(20);
		volume.getElementIndex([1,2,5]).should.equal(40);
		volume.getElementIndex([1,2,6]).should.equal(60);
		volume.getElementIndex([1,2,7]).should.equal(80);
		volume.getElementIndex([1,2,8]).should.equal(100);

		// sample a couple of the others - no need to do every single one since
		// we know the perimeters are correct
		volume.getElementIndexRelative([1,1,0]).should.equal(5);
		volume.getElementIndexRelative([1,1,1]).should.equal(25);
		volume.getElementIndexRelative([3,3,3]).should.equal(75);
		volume.getElementIndexRelative([3,4,5]).should.equal(119);
	});
	it("should prevent runtime modification of fixed properties", function() {
		(function() {volume.offsets = new Int32Array([5,6,7])}).should.throwError();
		volume.offsets[0] = 100;
		volume.offsets[0].should.equal(1);
		(function() {volume.dimensions = new Int32Array([7,8,9])}).should.throwError();
		volume.dimensions[0] = 100;
		volume.dimensions[0].should.equal(4);
		(function() {volume.extents = new Int32Array([7,8,9])}).should.throwError();
		volume.extents[0] = 100;
		volume.extents[0].should.equal(4);
		(function() {volume.elements = new Int32Array([7,8,9])}).should.throwError();
	});
	it("should provide symmetrical relative element identities", function() {
		volume.getElementCoordsRelative(0).should.eql(new Int32Array([0,0,0]));
		var x, y, z, index;
		for(x = 0; x < 4; x++) {
			for(y = 0; y < 5; y++) {
				for(z = 0; z < 6; z++) {
					index = volume.getElementIndexRelative(new Int32Array([x,y,z]));
					volume.getElementCoordsRelative(index).should.eql(new Int32Array([x,y,z]));
				}
			}
		}
	});
	it("should provide symmetrical absolute element identities", function() {
		var x, y, z, index, coord;
		for(x = 1; x < 5; x++) {
			for(y = 2; y < 7; y++) {
				for(z = 3; z < 9; z++) {
					coord = [x,y,z];
					index = volume.getElementIndex(coord);
					volume.getElementCoords(index).should.eql(new Int32Array(coord));
				}
			}
		}
	});
	it("should not permit empty, invalid or negative dimensions", function() {
		(function() {new JSVolume({dimensions:""})}).should.throwError();
		(function() {new JSVolume({dimensions:"this is invalid"})}).should.throwError();
		(function() {new JSVolume({dimensions:[-1,-1,-1]})}).should.throwError();
		(function() {new JSVolume({dimensions:[0,0,0]})}).should.throwError();
	});
	// lets use a bigger Volume for the next few tests
	volume2 = new JSVolume({offsets:[0,0,0], dimensions:[10,10,10], type:JSVolume.prototype.types.ARRAY});
	it("should correctly set and retrieve element values", function() {
		var x, y, z, val;
		for(x = 0; x < 10; x++) {
			for(y = 0; y < 10; y++) {
				for(z = 0; z < 10; z++) {
					val = ""+x+y+z;	
					volume2.setElement([x,y,z], val);
					volume2.getElement([x,y,z]).should.equal(val);
				}
			}
		}
	});
	it("should be able to create a lateral slice", function() {
		var subVolume = volume2.slice([0,0,0],[10,1,1]); 
		subVolume.offsets.should.eql(new Int32Array([0,0,0]));
		subVolume.extents.should.eql(new Int32Array([9,0,0]));
		subVolume.width.should.eql(10);
		subVolume.height.should.eql(1);
		subVolume.depth.should.eql(1);
		subVolume.should.have.property("elements").with.length(10);
		for(var i = 0; i < 10; i++) {
			subVolume.hasCoord([i,0,0]).should.be.true();
		}
	});
	it("should be able to create a vertical slice", function() {
		var subVolume = volume2.slice([0,0,0],[1,10,1]); 
		subVolume.offsets.should.eql(new Int32Array([0,0,0]));
		subVolume.extents.should.eql(new Int32Array([0,9,0]));
		subVolume.width.should.eql(1);
		subVolume.height.should.eql(10);
		subVolume.depth.should.eql(1);
		subVolume.should.have.property("elements").with.length(10);
		for(var i = 0; i < 10; i++) {
			subVolume.hasCoord([0,i,0]).should.be.true();
		}
	});
	it("should be able to create a longitudinal slice", function() {
		var subVolume = volume2.slice([0,0,0],[1,1,10]); 
		subVolume.offsets.should.eql(new Int32Array([0,0,0]));
		subVolume.extents.should.eql(new Int32Array([0,0,9]));
		subVolume.width.should.eql(1);
		subVolume.height.should.eql(1);
		subVolume.depth.should.eql(10);
		subVolume.should.have.property("elements").with.length(10);
		for(var i = 0; i < 10; i++) {
			subVolume.hasCoord([0,0,i]).should.be.true();
		}
	});
	it("should mark out of bounds elements as undefined when building a slice", function() {
		var subVolume = volume2.slice([0,0,0],[-1,-1,-1]);
		var x, y, z;
		for(x = -1; x < 2; x++) {
			for(y = -1; y < 2; y++) {
				for(z = -1; z < 2; z++) {
					if(x == -1 || y == -1 || z == -1) (typeof subVolume.getElement([x,y,z])).should.equal("undefined");
				}
			}
		}
	});
	it("should fill the elements array with a value using fill and return itself", function() {
		var volume = new JSVolume({offsets:[0,0,0], dimensions:[10,10,10]});
		var returned = volume.fill("I AM A VALUE");
		returned.should.eql(volume);
		for(var i = 0; i < volume.elements.length; i++) {
			volume.elements[i].should.equal("I AM A VALUE");
		}
	});
	it("should be able to iterate over its elements and apply a callback using JSVolume.each()", function() {
		var coords;
		var volume3 = new JSVolume({offsets:[0,0,0], dimensions:[5,5,5]});
		volume3.each(function(i) {
			coords = this.getElementCoords(i);
			this.elements[i] = ""+coords[0]+coords[1]+coords[2];
		});
		for(var i = 0; i < volume3.elements.length; i++) {
			coords = volume3.getElementCoords(i);
			volume3.elements[i].should.equal(""+coords[0]+coords[1]+coords[2]);
		}
	});
	it("should be able to determine whether it's within a set of boundaries using isContainedBy", function() {
		var volume2 = new JSVolume({offsets:[0,0,0], dimensions:[10,10,10]});
		// exact match
		volume2.isContainedBy({top:10, east:10, south:10, bottom:0, west:0, north:0}).should.eql(true);
		// larger volume
		volume2.isContainedBy({top:12, east:12, south:12, bottom:-1, west:-1, north:-1}).should.eql(true);
		// smaller volume
		volume2.isContainedBy({top:5, east:5, south:5, bottom:2, west:2, north:2}).should.eql(false);
		// offset volume
		volume2.isContainedBy({top:12, east:12, south:12, bottom:2, west:2, north:2}).should.eql(false);
		// completely separate volume
		volume2.isContainedBy({top:20, east:20, south:20, bottom:11, west:11, north:11}).should.eql(false);
	});
	it("should be able to determine whether it can contain a volume using canContain", function() {
		var volume2 = new JSVolume({offsets:[0,0,0], dimensions:[10,10,10]});
		// exact match
		volume2.canContain({top:10, east:10, south:10, bottom:0, west:0, north:0}).should.eql(true);
		// larger volume
		volume2.canContain({top:12, east:12, south:12, bottom:-1, west:-1, north:-1}).should.eql(false);
		// smaller volume
		volume2.canContain({top:5, east:5, south:5, bottom:2, west:2, north:2}).should.eql(true);
		// offset volume
		volume2.canContain({top:12, east:12, south:12, bottom:2, west:2, north:2}).should.eql(false);
		// completely separate volume
		volume2.canContain({top:20, east:20, south:20, bottom:11, west:11, north:11}).should.eql(false);
	});
	// set up a few source volumes for boolean operation tests
	volume3 = new JSVolume({offsets:[0,0,0], dimensions:[3,3,3], type:JSVolume.prototype.types.ARRAY}).fill("VOLUME 3");
	volume4 = new JSVolume({offsets:[3,3,3], dimensions:[3,3,3], type:JSVolume.prototype.types.ARRAY}).fill("VOLUME 4");
	volume5 = new JSVolume({offsets:[-2,-2,6], dimensions:[1,1,1]}).fill("VOLUME 5");
	volume6 = new JSVolume({offsets:[2,2,2], dimensions:[1,1,1]}).fill("VOLUME 6");
	it("should produce a union when merging many volumes, and chain correctly", function() {
		var coords;
		var volume7 = volume3.merge(volume4, volume5).merge(volume6);
		// merging should produce a cube that is 8x8x7
		volume7.should.have.property("width").eql(8);
		volume7.should.have.property("height").eql(8);
		volume7.should.have.property("depth").eql(7);
		volume7.should.have.property("offsets").eql(new Int32Array([-2,-2,0]));
		volume7.should.have.property("extents").eql(new Int32Array([5,5,6]));
		// coords should line up
		volume7.each(function(index) {
			coords = this.getElementCoords(index);
			// elements from volume 5 
			if(coords[0] === -2 && coords[1] === -2 && coords[2] === 6) {
				(typeof this.elements[index]).should.not.eql("undefined");
				this.elements[index].should.equal("VOLUME 5");
			}
			// elements from volume 6
			else if(coords[0] == 2 && coords[1] == 2 && coords[2] === 2) {
				(typeof this.elements[index]).should.not.eql("undefined");
				this.elements[index].should.equal("VOLUME 6");
			}
			// elements corresponding to the original volumes
			else if(coords[0] < 3 && coords[0] >= 0 && coords[1] < 3 && coords[1] >= 0 && coords[2] < 3) {
				(typeof this.elements[index]).should.not.eql("undefined");
				this.elements[index].should.equal("VOLUME 3");
			}
			else if(coords[0] >= 3 && coords[1] >= 3 && coords[2] >= 3 && coords[2] <= 5) {
				(typeof this.elements[index]).should.not.eql("undefined");
				this.elements[index].should.equal("VOLUME 4");
			}
			// empty elements
			else (typeof this.elements[index]).should.eql("undefined");
		});
	});
	it("should reject volumes of a different array types when merging", function() {
		var volume7 = new JSVolume({offsets:[0,0,0], dimensions:[3,3,3], type:JSVolume.prototype.types.INT8ARRAY});
		(function() {volume3.merge(volume7)}).should.throwError();

	});
	it("should not mutate the original volume when merging", function() {
		var volume7 = Object(volume4);
		volume4.merge(volume5);
		volume7.should.eql(volume4);
	});
	it("should implement the 'or' alias for 'merge'", function() {
		JSVolume.prototype.merge.should.eql(JSVolume.prototype.or);
	});
	it("should produce a volume that contains only the overlapping portions of two or more other volumes when intersecting", function() {
		var volume7 = new JSVolume({offsets:[0,0,2],dimensions:[3,3,1]}).fill("VOLUME 7");
		var volume8 = volume3.intersect(volume6, volume7);
		volume8.should.have.property("offsets").eql(new Int32Array([2,2,2]));
		volume8.should.have.property("extents").eql(new Int32Array([2,2,2]));
		volume8.should.have.property("elements").with.length(1);
		volume8.elements[0].should.eql("VOLUME 7");
	});
	it("should throw an error when intersecting volumes that have no overlaps", function() {
		// there are no overlapping parts of these volumes so it should come up empty
		(function() {volume3.intersect(volume4);}).should.throwError();
	});
	it("should not mutate the original volume when intersecting", function() {
		var volume7 = Object(volume4);
		volume3.intersect(volume6);
		volume7.should.eql(volume4);
	});
	it("should reject volumes of a different array types when intersecting", function() {
		var volume7 = new JSVolume({offsets:[0,0,0], dimensions:[3,3,3], type:JSVolume.prototype.types.INT8ARRAY});
		(function() {volume3.merge(volume7)}).should.throwError();

	});
	it("should implement the 'and' alias for 'intersect'", function() {
		JSVolume.prototype.intersect.should.eql(JSVolume.prototype.and);
	});
	it("should return the first value when reducing a volume with 1 element and no initial value", function() {
		var volume7 = new JSVolume({offsets:[0,0,0],dimensions:[1,1,1]}).fill(1);
		volume7.reduce(function(){}).should.eql(1);
	});
	it("should be able to reduce a volume, given a callback", function() {
		var volume7 = new JSVolume({offsets:[0,0,0],dimensions:[10,10,10]}).fill(1);
		volume7.reduce(function(prev, cur) {return prev+cur}).should.equal(Math.pow(10, 3));
	});
	it("should pass its index as the third argument for reduce", function() {
		var i = 0;
		var volume7 = new JSVolume({offsets:[0,0,0],dimensions:[10,10,10]}).fill(1);
		volume7.reduce(function(prev, cur, index) {
			index.should.equal(i);
			i++;
			return 0;
		}, 0);
	});
	it("should pass itself as the fourth argument for reduce", function() {
		var volume7 = new JSVolume({offsets:[0,0,0],dimensions:[10,10,10]}).fill(1);

		/* jshint unused:false */
		volume7.reduce(function(prev, cur, index, arr) {
			if(!prev) arr.should.eql(volume7); // only do this test once
			return 1;
		}, 0);
	});
	it("should not mutate the volume during reduce", function() {
		var volume7 = Object(volume3);
		volume3.reduce(function(prev, cur) {
			return prev+cur;
		});
		volume7.should.eql(volume3);
	});
	it("should pass the current value as the first value to map", function() {
		volume3.map(function(cur, i) {
			cur.should.equal(volume3.elements[i]);
		});
	});
	it("should pass the correct index for the second value of map callback, iterating over all elements", function() {
		var i = 0;
		volume3.map(function(cur, n) {
			n.should.equal(i);
			i++;
		});
	});
	it("should pass itself as the third argument to map callback", function() {
		/* jshint unused:false */
		volume3.map(function(cur, i, arr) {
			volume3.should.eql(arr);
		});
	});
	it("should default to itself as thisArg", function() {
		volume3.map(function() {
			volume3.should.eql(this);
		});
	});
	it("should correctly implement thisArg as a second argument for map", function() {
		/* jshint unused:false */
		volume3.map(function(cur, i, arr) {
			this.should.eql(volume4);
		}, volume4);
	});
	it("should produce a new volume identical to the old volume with new element values using map", function() {
		/* jshint unused:false */
		var newVal;
		var volume7 = volume3.map(function(cur, i, arr) {
			newVal = cur+this.getElementCoords(i)[0];
			return newVal;
		});
		volume7.width.should.eql(volume3.width);
		volume7.height.should.eql(volume3.height);
		volume7.depth.should.eql(volume3.depth);
		volume7.offsets.should.eql(volume3.offsets);
		volume7.extents.should.eql(volume3.extents);
		volume7.elements.length.should.eql(volume3.elements.length);
		volume7.type.should.eql(volume3.type);
		volume7.each(function(i) {
			(typeof(this.elements[i])).should.not.eql("undefined");
			this.elements[i].should.equal("VOLUME 3"+this.getElementCoords(i)[0]);
		});
	});
	it("should be able to chain map, slice and reduce", function() {
		// this test's success is implied by the above but I want to see it in action
		var mapper = function(cur, i, arr) {
			return arr.getElementCoords(i)[1]+1;
		}
		new JSVolume({offsets:[0,0,0],dimensions:[3,3,3]}).slice([0,0,0],[1,3,1]).map(mapper).reduce(function(prev, cur){return prev+cur}).should.eql(6);
	});
});
