type ValidationMessage = {
	fieldPath: string, // the field
	description: string, // description of error
	validationCode: string // reason why the validation failed (as a code)
}

export default ValidationMessage