/// <reference types="@clerk/express/env" />

declare global {
	namespace Express {
		interface Request {
			organisationId?: string;
		}
	}
}

export {};