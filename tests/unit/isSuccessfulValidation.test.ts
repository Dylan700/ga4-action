import { isSuccessfulValidation } from "../../src/main"

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
		validationMessages: [
			{
				fieldPath: "path",
				description: "error",
				validationCode: "01",
			}
		]
	}
}

const multiInvalidResponse = {
	status: 200,
	statusText: "OK",
	headers: {},
	config: {},
	data: {
		validationMessages: [
			{
				fieldPath: "path",
				description: "failed!",
				validationCode: "01",
			},
			{
				fieldPath: "path",
				description: "yes, another error",
				validationCode: "02",
			}
		]
	}
}

jest.mock("@actions/core")

describe("isSuccessfulValidation", () => {
	it("should return true when there are no validation messages", () => {
		expect(isSuccessfulValidation(validResponse)).toBeTruthy()
	})
	it("should return false when there is 1 validation message", () => {
		expect(isSuccessfulValidation(oneInvalidResponse)).toBeFalsy()
	})
	it("should return false when there are multiple validation messages", () => {
		expect(isSuccessfulValidation(multiInvalidResponse)).toBeFalsy()
	})
})