import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRenderUrls } from '$lib/server/renderer';

export const GET: RequestHandler = async ({ params, url }): Promise<Response> => {
	const { tokenId } = (await params) as { tokenId: string };
	if (!tokenId) {
		return json({ error: 'Missing tokenId' }, { status: 400 });
	}
	const preview = url.searchParams.get('preview') === 'true';
	try {
		const result = await getRenderUrls(tokenId, { preview });
		if (result.error) {
			return json(result, { status: 422 });
		}
		return json(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Render failed';
		return json({ error: message }, { status: 500 });
	}
};
