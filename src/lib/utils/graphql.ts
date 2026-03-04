/**
 * Aavegotchi type and optional GraphQL helpers.
 * Contract data is used for the selection screen; Goldsky is used server-side for renderer hash.
 */
export interface Aavegotchi {
	id: string;
	gotchiId: string;
	tokenId: string;
	name: string;
	nameLowerCase?: string;
	randomNumber: string;
	status: number;
	numericTraits: number[];
	modifiedNumericTraits: number[];
	equippedWearables: number[];
	owner: { id: string };
	/** Base Rarity Score (BRS) – higher = rarer. */
	baseRarityScore?: number;
	/** Modified Rarity Score (includes wearable bonuses). */
	modifiedRarityScore?: number;
	[key: string]: unknown;
}
