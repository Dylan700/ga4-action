import { getInput, setFailed } from "@actions/core";
import axios from "axios";
import { main } from "../../src";

jest.mock('@actions/github', () => {
	const originalModule = jest.requireActual('@actions/github');
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
	};
});

jest.mock('@actions/core');
jest.mock("axios");

describe("main", () => {
	it("should call setFailed if validation fails", async () => {
		axios.post.mockReturnValue({
			status: 200,
			statusText: "OK",
			headers: {},
			config: {},
			data: {
				validationMessages: ["failed!"]
			}
		})
		await main();
		expect(setFailed).toBeCalled();
	})
	it("should call setFailed if an error occurs anywhere", async () => {
		axios.post.mockImplementation(() => {throw new Error("Mocked error")});
		await main();
		expect(setFailed).toBeCalled();
	})
	it("should not call setFailed if everything works as expected", async () => {
		axios.post.mockReturnValue({
			status: 200,
			statusText: "OK",
			headers: {},
			config: {},
			data: {
				validationMessages: []
			}
		})
		await main();
		expect(setFailed).toBeCalledTimes(0);
	})
	it("should only send requests to validation server if dry-run is enabled", async () => {
		axios.post.mockReturnValue({
			status: 200,
			statusText: "OK",
			headers: {},
			config: {},
			data: {
				validationMessages: []
			}
		})
		getInput.mockReturnValue("true");
		await main();
		expect(axios.post).toBeCalledTimes(1);
		expect(axios.post).toBeCalledWith(expect.stringContaining("debug"), expect.anything(), expect.anything());
	});
})