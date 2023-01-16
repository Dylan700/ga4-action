import { compare_subset } from "../../src/main"

describe("Comparing subsets", () => {
	it("returns true if objects are the same", () => {
		expect(compare_subset({a: 1, b: 2, c: 3}, {a: 1, b:2, c:3})).toBeTruthy()
	})
	it("returns true if objects are the *exact* same", () => {
		const obj = {a: 1, b: 2, c: 3}
		expect(compare_subset(obj, obj)).toBeTruthy()
	})
	it("returns false if second object has less properties than the first", () => {
		const a = {a: 1, b: 2, c: 3}
		const b = {a: 1, b: 2}
		expect(compare_subset(a, b)).toBeFalsy()
	})
	it("returns true if first object has more properties than the second", () => {
		const a = {a: 1, b: 2, c: 3}
		const b = {a: 1, b: 2}
		expect(compare_subset(a, b)).toBeFalsy()
	})
	it("returns false if first object is empty", () => {
		const a = {}
		const b = {a: 1, b: 2}
		expect(compare_subset(a, b)).toBeFalsy()
	})
	it("returns false if first object has exact same properties with different values", () => {
		const a = {a: 2, b: 1}
		const b = {a: 1, b: 2}
		expect(compare_subset(a, b)).toBeFalsy()
	})
	it("returns true if first object has same properties and second has additional properties", () => {
		const a = {a: 1, b: 2}
		const b = {a: 1, b: 2, c: 3}
		expect(compare_subset(a, b)).toBeTruthy()
	})
})