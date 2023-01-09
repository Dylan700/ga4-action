import { isSuccessfulValidation } from "../../src";

const validResponse = {
	status: 200,
	statusText: "OK",
	headers: {},
	config: {},
	data: {
		validationMessages: []
	}
}

const oneInvalidResponse = {
	status: 200,
	statusText: "OK",
	headers: {},
	config: {},
	data: {
		validationMessages: ["error"]
	}
}

const multiInvalidResponse = {
	status: 200,
	statusText: "OK",
	headers: {},
	config: {},
	data: {
		validationMessages: ["error", "another error", "yes, one more error here"]
	}
}

jest.mock('@actions/core', () => {
	const originalModule = jest.requireActual('@actions/core');
	return {
	  __esModule: true,
	  ...originalModule,
	  setFailed: jest.fn(() => {}),
	};
});

describe("isSuccessfulValidation", () => {
	it("should return true when there are no validation messages", () => {
		expect(isSuccessfulValidation(validResponse)).toBeTruthy();
	})
	it("should return false when there is 1 validation message", () => {
		expect(isSuccessfulValidation(oneInvalidResponse)).toBeFalsy();
	})
	it("should return false when there are multiple validation messages", () => {
		expect(isSuccessfulValidation(multiInvalidResponse)).toBeFalsy();
	})
})