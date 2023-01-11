import axios from 'axios';
import { send_request } from "../../src/main";

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

jest.mock("axios");

describe("send_request", () => {
	it("should send the correct data for validation", async () => {
		const result = await send_request("secret", "id", "my-event", "test description", "https://www.google.com", true);
		const expectedData = {
			client_id: "github",
			non_personalized_ads: true,
			events: [{
			name: "my-event",
			params: {
				items: [],
				description: "test description",
				url: "https://www.google.com"
			}
		}]
		}
		expect(axios.post).toBeCalled();
		expect(axios.post).toHaveBeenCalledWith(expect.anything(), expectedData, expect.anything());
	})

	it("should send the correct data", async () => {
		const result = await send_request("secret", "id", "my-event", "test description", "https://www.google.com", false);
		const expectedData = {
			client_id: "github",
			non_personalized_ads: true,
			events: [{
			name: "my-event",
			params: {
				items: [],
				description: "test description",
				url: "https://www.google.com"
			}
		}]
		}
		expect(axios.post).toBeCalled();
		expect(axios.post).toHaveBeenCalledWith(expect.anything(), expectedData, expect.anything());
	})
})