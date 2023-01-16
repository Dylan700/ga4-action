import { setFailed, debug, getInput, warning, notice, error, getBooleanInput } from "@actions/core"
import { context } from "@actions/github"
import axios, { AxiosResponse } from "axios"
import ValidationMessage from "./types/ValidationMessage"
import admin, { AnalyticsAdminServiceClient } from "@google-analytics/admin"
import { google } from "@google-analytics/admin/build/protos/protos"
import { writeFile } from "fs/promises"

const BASE_URL = "https://www.google-analytics.com/"
const DEBUG = "debug/"

axios.interceptors.request.use(request => {
	debug("Sending Request: " + JSON.stringify(request, null, 2))
	return request
})

// compare object a with object b, such that a is a subset of b with all properties equal to the same property values as b.
function compare_subset(a: any, b: any): boolean {
	const properties: string[] = Object.keys(a)
	if(properties.length == 0)
		return false
	return properties.every((property: string) => {
		if(a[property] !== b[property])
			return false
		return true
	})
}

// set up dimensions and metrics for reporting in GA4 admin.
async function configure_analytics_admin(client: AnalyticsAdminServiceClient, propertyId: string){
	const propertyName = `properties/${propertyId}`
	client.initialize()

	const descriptionDim: google.analytics.admin.v1alpha.ICustomDimension = {
		displayName: "Description",
		description: "Describes the changes that occured during GitHub ga4-action events",
		scope: "EVENT",
		parameterName: "description"
	}

	const urlDim: google.analytics.admin.v1alpha.ICustomDimension= {
		displayName: "URL",
		description: "The URL linking to the changes that occured during GitHub ga4-action events",
		scope: "EVENT",
		parameterName: "url"
	}

	// configure dimensions exist
	const [dimensions] = await client.listCustomDimensions({parent: propertyName})
	if(!dimensions.some(d => d.parameterName === "description")){
		notice("Creating dimension for Description...")
		await client.createCustomDimension({
			parent: propertyName,
			customDimension: descriptionDim
		})
		notice("Done.")
	}else{
		notice("Description dimension already exists, let's check if it's configured correctly")
		if(!compare_subset(descriptionDim, dimensions.filter(d => d.parameterName === "description")[0])){
			warning("Description dimension is configured incorrectly!")
			if(dimensions.filter(d => d.parameterName === "description")[0].scope != descriptionDim.scope){
				warning("Description dimension is configured with the incorrect scope but it cannot be changed after creation!")
				notice("Archiving dimension then recreating...")
				await client.archiveCustomDimension({name: dimensions.filter(d => d.parameterName === "description")[0].name})
				await client.createCustomDimension({
					parent: propertyName,
					customDimension: descriptionDim
				})
			}else{
				await client.updateCustomDimension({
					customDimension: {
						...descriptionDim,
						name: dimensions.filter(d => d.parameterName === "description")[0].name
					},
					updateMask: {
						paths: ["display_name", "description"]
					}
				})
				notice("Description dimension has been updated")
			}
		}
		notice("Done.")
	}

	if(!dimensions.some(d => d.parameterName === "url")){
		notice("Creating dimension for URL...")
		await client.createCustomDimension({
			parent: propertyName,
			customDimension: urlDim
		})
		notice("Done.")
	}else{
		notice("URL dimension already exists, let's check if it's configured correctly")
		if(!compare_subset(urlDim, dimensions.filter(d => d.parameterName === "url")[0])){
			warning("URL dimension is configured incorrectly!")
			if(dimensions.filter(d => d.parameterName === "url")[0].scope != urlDim.scope){
				warning("URL dimension is configured with the incorrect scope but it cannot be changed after creation!")
				notice("Archiving dimension then recreating...")
				await client.archiveCustomDimension({name: dimensions.filter(d => d.parameterName === "url")[0].name})
				await client.createCustomDimension({
					parent: propertyName,
					customDimension: urlDim
				})
			}else{
				await client.updateCustomDimension({
					customDimension: {
						...urlDim,
						name: dimensions.filter(d => d.parameterName === "url")[0].name
					},
					updateMask: {
						paths: ["display_name", "description"]
					}
				})
				notice("URL dimension has been updated")
			}
		}
		notice("Done.")
	}
}

async function send_request(api_secret: string, measurement_id: string, event_name: string, description: string, url: string | URL, validate = false): Promise<AxiosResponse> {
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
	return response
}

// check if the response from validated request is good
function isSuccessfulValidation(response: AxiosResponse): boolean {
	if(response.data.validationMessages.length == 0){
		return true
	}else{
		return false
	}
}

function formatValidationMessage(message: ValidationMessage): string{
	return `[${message.validationCode}] ${message.description}`
}

async function main(){
	try {
		const event_name = getInput("event-name")
		const measurement_id = getInput("measurement-id")
		const api_secret = getInput("api-secret")
		const dry_run = getBooleanInput("dry-run")
		const property_id = getInput("property-id")
		const ga4_credentials = getInput("service-account-credentials")
		const payload = context.payload

		if(dry_run){
			warning("Running action as 'dry-run', requests will only be sent to validation server.")
		}
		if(!dry_run && property_id != "" && ga4_credentials){
			// write the credentials to a file for GA4
			await writeFile("./google_key.json", ga4_credentials).catch(() => 
				error("Unable to write credentials to json file for Google API authentication. Authentication will probably fail now."))
			try{
				await configure_analytics_admin(new admin.AnalyticsAdminServiceClient({keyFilename: "./google_key.json"}), property_id)
			}catch(error: any){
				error(`Unable to configure GA4 with custom dimensions. Please ensure: 
				1. You provided the correct property id 
				2. You have created a service account in Google Cloud with the Google Analytics Admin API enabled
				3. The service account is added to your GA4 property as a user with editor privileges
				4. The service account .json key credentials file is included as a secret in your repository`
				)
			}
			
		}
		
		// validate request first
		const response = await send_request(api_secret, measurement_id, event_name, payload?.head_commit?.message, `${payload.github_server_url}/${payload.github_repository}/commit/${payload.github_sha}/`, true)
		if(dry_run){
			if(isSuccessfulValidation(response)){
				notice("Validation server returned no errors.")
				return
			}
			response.data.validationMessages.forEach((msg: ValidationMessage) => error(formatValidationMessage(msg)))
			setFailed("Request validation failed.")
			return
		}

		if(isSuccessfulValidation(response)){
			// validation successful! Let's send the actual request
			await send_request(api_secret, measurement_id, event_name, payload.head_commit.message, `${payload.head_commit.url}/`)
		}else{
			response.data.validationMessages.forEach((msg: ValidationMessage) => error(formatValidationMessage(msg)))
			setFailed("Request validation failed.")
		}
   
	} catch (error: any) {
		setFailed(error.message)
	}
}

export { main, send_request, isSuccessfulValidation, configure_analytics_admin, compare_subset }