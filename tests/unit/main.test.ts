import { error, getBooleanInput, getInput, setFailed } from "@actions/core"
import axios from "axios"
import { writeFile } from "fs/promises"
import { main } from "../../src/main"

jest.mock("@actions/github", () => {
	const originalModule = jest.requireActual("@actions/github")
	return {
		__esModule: true,
		...originalModule,
		context: {
			payload: {
				head_commit: {
					message: "mocked message"
				}
			}
		},
	}
})

const badValidationResponse = {
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
			}
		]
	}
}

const goodValidationResponse = {
	status: 200,
	statusText: "OK",
	headers: {},
	config: {},
	data: {
		validationMessages: []
	}
}

jest.mock("@actions/core")
jest.mock("axios")
jest.mock("fs/promises")
jest.mock("@google-analytics/admin")

describe("main", () => {
	it("should call setFailed if validation fails", async () => {
		axios.post.mockReturnValue(badValidationResponse)
		await main()
		expect(setFailed).toBeCalled()
	})
	it("should output errors if validation fails", async () => {
		axios.post.mockReturnValue(badValidationResponse)
		await main()
		expect(error).toBeCalled()
		expect(error).toBeCalledWith(expect.stringContaining("failed!"))
	})
	it("should call setFailed if an error occurs anywhere", async () => {
		axios.post.mockImplementation(() => {throw new Error("Mocked error")})
		await main()
		expect(setFailed).toBeCalled()
	})
	it("should not call setFailed if everything works as expected", async () => {
		axios.post.mockReturnValue(goodValidationResponse)
		await main()
		expect(setFailed).toBeCalledTimes(0)
	})
	it("should send requests to validation server only, when dry-run is enabled", async () => {
		axios.post.mockReturnValue(goodValidationResponse)
		getBooleanInput.mockReturnValue(true)
		await main()
		expect(axios.post).toBeCalledTimes(1)
		expect(axios.post).toBeCalledWith(expect.stringContaining("debug"), expect.anything(), expect.anything())
	})
	it("should output errors when validation fails, when dry-run is enabled", async () => {
		axios.post.mockReturnValue(badValidationResponse)
		await main()
		expect(error).toBeCalled()
		expect(error).toBeCalledWith(expect.stringContaining("failed!"))
	})
	it("should write credentials to file if credentials and property id are supplied, and dry-run is false", async () => {
		writeFile.mockResolvedValue(true)
		getBooleanInput.mockReturnValue(false)
		getInput.mockReturnValue("ok")
		await main()
		expect(writeFile).toBeCalledTimes(1)
	})
})