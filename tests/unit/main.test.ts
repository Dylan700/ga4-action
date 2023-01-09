import { setFailed, debug } from "@actions/core";
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

jest.mock('@actions/core', () => {
	const originalModule = jest.requireActual('@actions/core');
	return {
	  __esModule: true,
	  ...originalModule,
	  setFailed: jest.fn(() => {}),
	  debug: jest.fn(() => {}),
	};
});

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
})