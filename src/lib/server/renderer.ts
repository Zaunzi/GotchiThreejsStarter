/**
 * Server-only: Aavegotchi renderer batch API.
 * Queries Goldsky, derives hash, kicks off and polls batch, returns proxy URLs.
 */

const GOLDSKY_ENDPOINT =
	'https://api.goldsky.com/api/public/project_cmh3flagm0001r4p25foufjtt/subgraphs/aavegotchi-core-base/prod/gn';
const DAPP_BASE = 'https://www.aavegotchi.com';
const RENDER_TYPES = ['PNG_Full', 'PNG_Headshot', 'GLB_3DModel'] as const;
/** Preview mode: only PNGs for selection screen; no GLB to save time and resources. */
const RENDER_TYPES_PREVIEW = ['PNG_Full', 'PNG_Headshot'] as const;
const DEFAULT_POLL_ATTEMPTS = 18;
const DEFAULT_POLL_INTERVAL_MS = 10_000;

const COLLATERAL_MAP: Record<string, string[]> = {
	Eth: ['0x20d3922b4a1a8560e1ac99fba4fade0c849e2142'],
	Aave: ['0x823cd4264c1b951c9209ad0deaea9988fe8429bf', '0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360'],
	Dai: ['0xe0b22e0037b130a9f56bbb537684e6fa18192341', '0x27f8d03b3a2196956ed754badc28d73be8830a6e'],
	USDC: ['0x1a13f4ca1d028320a707d99520abfefca3998b7f', '0x9719d867a500ef117cc201206b8ab51e794d3f82'],
	Link: ['0x98ea609569bd25119707451ef982b90e3eb719cd'],
	USDT: ['0xdae5f1590db13e3b40423b5b5c5fbf175515910b', '0x60d55f02a771d515e077c9c2403a1ef324885cec'],
	TUSD: ['0xf4b8888427b00d7caf21654408b7cba2ecf4ebd9'],
	Uni: ['0x8c8bdbe9cee455732525086264a4bf9cf821c498'],
	Yfi: ['0xe20f7d1f0ec39c4d5db01f53554f2ef54c71f613'],
	Polygon: ['0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4'],
	wEth: ['0x28424507fefb6f7f8e9d3860f56504e4e5f5f390'],
	wBTC: ['0x5c2ed810328349100a66b82b78a1791b101c9d61']
};

interface GoldskyGotchi {
	id?: string;
	collateral?: string;
	hauntId?: number | string;
	numericTraits?: number[];
	equippedWearables?: number[];
}

function mapCollateral(address: string): string {
	const normalized = String(address || '').toLowerCase();
	for (const [name, values] of Object.entries(COLLATERAL_MAP)) {
		if (values.includes(normalized)) return name;
	}
	return 'Eth';
}

function deriveEyeShape(collateralAddress: string, numericTraits: number[] | undefined, hauntId: number | string | undefined): string {
	const t4 = Number(numericTraits?.[4] ?? 0);
	const h = Number(hauntId ?? 1);

	if (t4 === 0) return h === 1 ? 'MythicalLow1_H1' : 'MythicalLow1_H2';
	if (t4 === 1) return h === 1 ? 'MythicalLow2_H1' : 'MythicalLow2_H2';
	if (t4 >= 2 && t4 <= 4) return 'RareLow1';
	if (t4 >= 5 && t4 <= 6) return 'RareLow2';
	if (t4 >= 7 && t4 <= 9) return 'RareLow3';
	if (t4 >= 10 && t4 <= 14) return 'UncommonLow1';
	if (t4 >= 15 && t4 <= 19) return 'UncommonLow2';
	if (t4 >= 20 && t4 <= 24) return 'UncommonLow3';
	if (t4 >= 25 && t4 <= 41) return 'Common1';
	if (t4 >= 42 && t4 <= 57) return 'Common2';
	if (t4 >= 58 && t4 <= 74) return 'Common3';
	if (t4 >= 75 && t4 <= 79) return 'UncommonHigh1';
	if (t4 >= 80 && t4 <= 84) return 'UncommonHigh2';
	if (t4 >= 85 && t4 <= 89) return 'UncommonHigh3';
	if (t4 >= 90 && t4 <= 92) return 'RareHigh1';
	if (t4 >= 93 && t4 <= 94) return 'RareHigh2';
	if (t4 >= 95 && t4 <= 97) return 'RareHigh3';

	const collateral = mapCollateral(collateralAddress);
	const shapeByCollateral: Record<string, string> = {
		Eth: 'ETH',
		Aave: 'AAVE',
		Dai: 'DAI',
		Uni: 'UNI',
		Polygon: 'POLYGON',
		Link: 'LINK',
		wEth: 'wETH',
		Yfi: 'YFI',
		wBTC: 'wBTC',
		TUSD: 'TUSD',
		USDC: 'USDC',
		USDT: 'USDT'
	};
	return shapeByCollateral[collateral] || 'ETH';
}

function deriveEyeColor(numericTraits: number[] | undefined): string {
	const t5 = Number(numericTraits?.[5] ?? 0);
	if (t5 >= 0 && t5 <= 1) return 'Mythical_Low';
	if (t5 >= 2 && t5 <= 9) return 'Rare_Low';
	if (t5 >= 10 && t5 <= 24) return 'Uncommon_Low';
	if (t5 >= 25 && t5 <= 74) return 'Common';
	if (t5 >= 75 && t5 <= 90) return 'Uncommon_High';
	if (t5 >= 91 && t5 <= 97) return 'Rare_High';
	if (t5 >= 98 && t5 <= 99) return 'Mythical_High';
	return 'Common';
}

function deriveHash(gotchi: GoldskyGotchi): string {
	const collateral = mapCollateral(gotchi.collateral || '');
	const eyeShape = deriveEyeShape(gotchi.collateral || '', gotchi.numericTraits, gotchi.hauntId);
	const eyeColor = deriveEyeColor(gotchi.numericTraits);

	const wearables = Array.isArray(gotchi.equippedWearables) ? gotchi.equippedWearables.slice(0, 7) : [];
	while (wearables.length < 7) wearables.push(0);

	const body = Number(wearables[0] || 0);
	const face = Number(wearables[1] || 0);
	const eyes = Number(wearables[2] || 0);
	const head = Number(wearables[3] || 0);
	const rightHand = Number(wearables[4] || 0);
	const leftHand = Number(wearables[5] || 0);
	const pet = Number(wearables[6] || 0);

	return [collateral, eyeShape, eyeColor, body, face, eyes, head, rightHand, leftHand, pet].join('-');
}

async function postJson(
	url: string,
	body: object
): Promise<{ response: Response; json: Record<string, unknown> | null; text: string }> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const text = await response.text();
	let json: Record<string, unknown> | null = null;
	try {
		json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
	} catch {
		json = null;
	}
	return { response, json, text };
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFirstBatchResult(batchJson: Record<string, unknown> | null): Record<string, unknown> {
	const data = batchJson?.data as { results?: unknown[] } | undefined;
	return (data?.results?.[0] as Record<string, unknown>) || {};
}

function getAvailability(batchResult: Record<string, unknown>): Record<string, { exists?: boolean; status?: string }> {
	return (batchResult?.availability as Record<string, { exists?: boolean; status?: string }>) || {};
}

function isRenderReady(
	renderTypes: readonly string[],
	availability: Record<string, { exists?: boolean }>
): boolean {
	return renderTypes.every((renderType) => availability?.[renderType]?.exists === true);
}

function resolveUrl(url: string | undefined): string | undefined {
	if (!url) return undefined;
	return url.startsWith('http') ? url : `${DAPP_BASE}${url}`;
}

export interface RenderResult {
	pngHeadshotUrl?: string;
	pngFullUrl?: string;
	glbUrl?: string;
	error?: string;
}

export async function getRenderUrls(
	tokenId: string,
	options: { pollAttempts?: number; pollIntervalMs?: number; preview?: boolean } = {}
): Promise<RenderResult> {
	const pollAttempts = options.pollAttempts ?? DEFAULT_POLL_ATTEMPTS;
	const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
	const preview = options.preview === true;
	const renderTypes = preview ? [...RENDER_TYPES_PREVIEW] : [...RENDER_TYPES];

	const id = String(tokenId).trim();
	if (!id || Number.isNaN(Number(id))) {
		return { error: 'Invalid tokenId' };
	}

	// 1. Query Goldsky
	const graphQuery = {
		query:
			'query($ids:[String!]!){aavegotchis(where:{id_in:$ids}){id collateral hauntId numericTraits equippedWearables}}',
		variables: { ids: [id] }
	};
	const graphResult = await postJson(GOLDSKY_ENDPOINT, graphQuery);
	if (!graphResult.response.ok) {
		return { error: `Goldsky query failed (${graphResult.response.status})` };
	}

	const data = graphResult.json?.data as { aavegotchis?: GoldskyGotchi[] } | undefined;
	const gotchis = data?.aavegotchis;
	const gotchi = Array.isArray(gotchis) ? gotchis[0] : undefined;
	if (!gotchi) {
		return { error: `Gotchi ${tokenId} not found` };
	}

	const hash = deriveHash(gotchi);

	// 2. Kickoff batch (PNG-only in preview mode to save resources)
	const kickoffPayload = {
		hashes: [hash],
		renderTypes,
		force: true,
		verify: false
	};
	const kickoffResult = await postJson(`${DAPP_BASE}/api/renderer/batch`, kickoffPayload);
	if (!kickoffResult.response.ok) {
		return { error: `Renderer kickoff failed (${kickoffResult.response.status})` };
	}

	// 3. Poll until ready
	let finalBatchResult: Record<string, unknown> = {};
	let finalAvailability: Record<string, { exists?: boolean }> = {};

	for (let attempt = 1; attempt <= pollAttempts; attempt++) {
		const verifyPayload = {
			hashes: [hash],
			renderTypes,
			verify: true
		};
		const verifyResult = await postJson(`${DAPP_BASE}/api/renderer/batch`, verifyPayload);
		if (!verifyResult.response.ok) {
			return { error: `Renderer verify failed (${verifyResult.response.status})` };
		}

		finalBatchResult = getFirstBatchResult(verifyResult.json);
		finalAvailability = getAvailability(finalBatchResult);

		if (isRenderReady(renderTypes, finalAvailability)) {
			break;
		}

		if (attempt < pollAttempts) {
			await sleep(pollIntervalMs);
		}
	}

	const proxyUrls = (finalBatchResult.proxyUrls || {}) as Record<string, string | undefined>;

	return {
		pngHeadshotUrl: finalAvailability?.PNG_Headshot?.exists ? resolveUrl(proxyUrls.PNG_Headshot) : undefined,
		pngFullUrl: finalAvailability?.PNG_Full?.exists ? resolveUrl(proxyUrls.PNG_Full) : undefined,
		glbUrl: preview ? undefined : (finalAvailability?.GLB_3DModel?.exists ? resolveUrl(proxyUrls.GLB_3DModel) : undefined)
	};
}
