import { configure_analytics_admin } from "../../src/main"
import admin, { AnalyticsAdminServiceClient } from "@google-analytics/admin"

jest.mock("@google-analytics/admin")
let client: AnalyticsAdminServiceClient
const property_id = "1234567"

const descriptionDim = {
	displayName: "Description",
	description: "Describes the changes that occured during GitHub ga4-action events",
	scope: "EVENT",
	parameterName: "description",
	name: "description"
}

const urlDim = {
	displayName: "URL",
	description: "The URL linking to the changes that occured during GitHub ga4-action events",
	scope: "EVENT",
	parameterName: "url",
	name: "url"
}


describe("Configuring analytics function", () => {
	beforeEach(() => {
		client = new admin.AnalyticsAdminServiceClient()
		client.listCustomDimensions.mockResolvedValue([[]])
	})

	it("authenticates the api", async () => {
		await configure_analytics_admin(client, property_id)
		expect(client.initialize).toBeCalled()
	})

	it("creates new description and url dimensions if they don't exist", async () => {
		await configure_analytics_admin(client, property_id)
		expect(client.createCustomDimension).toBeCalledWith({
			parent: expect.stringContaining(property_id),
			customDimension: expect.objectContaining({displayName: "Description", scope: "EVENT", parameterName: "description"})
		})

		expect(client.createCustomDimension).toBeCalledWith({
			parent: expect.stringContaining(property_id),
			customDimension: expect.objectContaining({displayName: "URL", scope: "EVENT", parameterName: "url"})
		})
	})
	it("doesn't update the dimensinos if they don't exist", async () => {
		await configure_analytics_admin(client, property_id)
		expect(client.updateCustomDimension).toBeCalledTimes(0)

	})
	it("doesn't update the dimensions if they already exist and are configured correctly", async () => {
		client.listCustomDimensions.mockResolvedValue([[urlDim, descriptionDim]])
		await configure_analytics_admin(client, property_id)
		expect(client.updateCustomDimension).toBeCalledTimes(0)
	})
	it("updates the dimensions if they already exist and are configured incorrectly", async () => {
		client.listCustomDimensions.mockResolvedValue([[{...urlDim, displayName: "idk"}, {...descriptionDim, displayName: "ok"}]])
		await configure_analytics_admin(client, property_id)
		expect(client.updateCustomDimension).toBeCalledTimes(2)
	})
	it("updates one dimension if they both already exist and one is configured incorrectly", async () => {
		client.listCustomDimensions.mockResolvedValue([[urlDim, {...descriptionDim, displayName: "ok"}]])
		await configure_analytics_admin(client, property_id)
		expect(client.updateCustomDimension).toBeCalledTimes(1)
	})
	it("archives and creates dimension if they both exist but contain the incorrect scope", async () => {
		client.listCustomDimensions.mockResolvedValue([[{...urlDim, scope: "ok"}, {...descriptionDim, scope: "ok"}]])
		await configure_analytics_admin(client, property_id)
		expect(client.archiveCustomDimension).toBeCalledTimes(2)
		expect(client.createCustomDimension).toBeCalledTimes(2)
	})
	it("archives and creates one dimension if they both exist but one contains the incorrect scope", async () => {
		client.listCustomDimensions.mockResolvedValue([[urlDim, {...descriptionDim, scope: "ok"}]])
		await configure_analytics_admin(client, property_id)
		expect(client.archiveCustomDimension).toBeCalledTimes(1)
		expect(client.createCustomDimension).toBeCalledTimes(1)
	})
})