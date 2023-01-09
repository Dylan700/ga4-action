import { setFailed, debug, getInput } from "@actions/core";
import { context } from "@actions/github";
import axios, { AxiosResponse } from "axios";

const BASE_URL = "https://www.google-analytics.com/"
const DEBUG = "debug/"

axios.interceptors.request.use(request => {
	debug('Sending Request: ' + JSON.stringify(request, null, 2));
	return request;
  });

async function send_request(api_secret: string, measurement_id: string, event_name: string, description: string, url: string | URL, validate: boolean = false): Promise<AxiosResponse> {
	const endpoint = validate ? BASE_URL+DEBUG+"mp/collect" : BASE_URL+"mp/collect"
	const response = await axios.post(endpoint, {
		client_id: "github",
		non_personalized_ads: true,
		events: [{
			name: event_name,
			params: {
				items: [],
				description: description,
				url: url
			}
		}]
	}, {params: {
		api_secret: api_secret,
		measurement_id: measurement_id
	}})
	return response;
}

// check if the response from validated request is good
function isSuccessfulValidation(response: AxiosResponse): boolean {
	if(response.data.validationMessages.length == 0){
		return true;
	}else{
		return false;
	}
}

async function main(){
	try {
		const event_name = getInput('event-name');
		const measurement_id = getInput('measurement-id');
		const api_secret = getInput('api-secret');
		const payload = context.payload;
		
		// validate request first
		const response = await send_request(api_secret, measurement_id, event_name, payload.head_commit.message, `${payload.github_server_url}/${payload.github_repository}/commit/${payload.github_sha}/`, true);
		if(isSuccessfulValidation(response)){
			// validation successful! Let's send the actual request
			await send_request(api_secret, measurement_id, event_name, payload.head_commit.message, `${payload.head_commit.url}/`);
		}else{
			setFailed("Request validation failed. " + JSON.stringify(response.data));
		}
	   
	} catch (error: any) {
		setFailed(error.message);
	}
}
main();

export { main, send_request, isSuccessfulValidation };