import { ethers } from 'ethers';
import { getProvider } from './web3';
import { CONTRACT_ADDRESSES, COMMON_ABIS } from '$lib/config/contracts';
import { BASE_MAINNET_ID } from '$lib/config/chains';
import type { Aavegotchi } from '$lib/utils/graphql';

const BASE_PUBLIC_RPC = 'https://mainnet.base.org';

export function getAavegotchiContract(): ethers.Contract | null {
	let provider: ethers.Provider | null = getProvider();

	if (!provider) {
		try {
			provider = new ethers.JsonRpcProvider(BASE_PUBLIC_RPC);
		} catch (error) {
			console.error('Failed to create public RPC provider:', error);
			return null;
		}
	}

	try {
		const address = CONTRACT_ADDRESSES.AAVEGOTCHI[BASE_MAINNET_ID];
		if (!address) return null;

		return new ethers.Contract(address, COMMON_ABIS.AAVEGOTCHI, provider);
	} catch (error) {
		console.error('Failed to create Aavegotchi contract:', error);
		return null;
	}
}

export async function getTokenIdsOfOwner(owner: string): Promise<number[]> {
	const contract = getAavegotchiContract();
	if (!contract) return [];

	try {
		const tokenIds = await contract.tokenIdsOfOwner(owner);
		return tokenIds.map((id: bigint) => Number(id));
	} catch (error) {
		console.error(`Failed to fetch Aavegotchi tokenIds for owner ${owner}:`, error);
		return [];
	}
}

/** Fetch a single Aavegotchi from the contract (includes baseRarityScore and modifiedRarityScore). */
export async function getAavegotchiFromContract(tokenId: string | number): Promise<Aavegotchi | null> {
	const contract = getAavegotchiContract();
	if (!contract) return null;

	try {
		const raw = await contract.getAavegotchi(tokenId);
		// Support both named Result (ethers) and array-like tuple
		const r = raw as Record<string, unknown> & unknown[];
		const get = (key: string, idx: number) => {
			const v = r[key];
			if (v !== undefined && v !== null) return v;
			return r[idx];
		};
		const tokenIdStr = String(get('tokenId', 0) ?? tokenId);
		const name = String(get('name', 1) ?? '');
		const numericTraits = (get('numericTraits', 5) as bigint[] | number[]) ?? [];
		const modifiedNumericTraits = (get('modifiedNumericTraits', 6) as bigint[] | number[]) ?? [];
		const equippedWearables = (get('equippedWearables', 7) as bigint[] | number[]) ?? [];
		return {
			id: tokenIdStr,
			gotchiId: tokenIdStr,
			tokenId: tokenIdStr,
			name,
			nameLowerCase: name.toLowerCase(),
			randomNumber: String(get('randomNumber', 3) ?? 0),
			status: Number(get('status', 4) ?? 0),
			numericTraits: Array.isArray(numericTraits) ? numericTraits.map((v) => Number(v)) : [],
			modifiedNumericTraits: Array.isArray(modifiedNumericTraits) ? modifiedNumericTraits.map((v) => Number(v)) : [],
			equippedWearables: Array.isArray(equippedWearables)
				? equippedWearables.map((v) => Number(v)).filter((v) => v !== 0)
				: [],
			owner: { id: String(get('owner', 2) ?? '') },
			baseRarityScore: Number(get('baseRarityScore', 19) ?? 0),
			modifiedRarityScore: Number(get('modifiedRarityScore', 20) ?? 0)
		};
	} catch (error) {
		console.error(`Failed to fetch Aavegotchi ${tokenId} from contract:`, error);
		return null;
	}
}
