import {execSync} from 'child_process';
import {apis} from '@bhsd/test-util';
import {refreshStdout} from '@bhsd/nodejs';
import parse from './parser';
import analyze from '../../analyzer/analyzer';
import dialect from '../../dist/dialect.test';
import type {ParserException} from '../../analyzer/analyzer';

declare interface AbuseFilter {
	readonly id: number;
	readonly description: string;
	readonly pattern?: string;
}
declare interface MediaWikiResponse {
	readonly query: {
		readonly abusefilters: AbuseFilter[];
	};
}

const {version} = require('../../package.json') as {version: string};
const failures = new Map<string, number>();

const notDeprecation = (e: Error): boolean => !e.message.startsWith('use of deprecated ');

const getFilters = async (url: string): Promise<Required<AbuseFilter>[]> => {
	const qs = {
			action: 'query',
			format: 'json',
			formatversion: '2',
			errorformat: 'plaintext',
			list: 'abusefilters',
			abfshow: '!deleted|!private',
			abflimit: 'max',
			abfprop: 'id|description|pattern',
		},
		{query}: MediaWikiResponse = await (await fetch(`${url}?${String(new URLSearchParams(qs))}`, {
			headers: {
				'User-Agent': `@bhsd/lezer-abusefilter/${
					version
				} (https://www.npmjs.com/package/@bhsd/lezer-abusefilter; ${
					execSync('git config user.email', {encoding: 'utf8'}).trim()
				}) Node.js/${process.version}`,
			},
		})).json();
	return query.abusefilters.filter((filter): filter is Required<AbuseFilter> => 'pattern' in filter);
};

(async () => {
	for (const [site, url] of apis) {
		console.log(`开始检查${site}：`);
		try {
			let failed = 0;
			for (const {id, description, pattern} of await getFilters(`${url}/api.php`)) {
				refreshStdout(`${id} ${description}`);
				try {
					parse(pattern);
					analyze(pattern, dialect);
				} catch (e) {
					const error = notDeprecation(e as Error)
						? e
						: (e as ParserException).warnings?.find(notDeprecation);
					if (error) {
						console.error(`\n解析 ${id} 号滥用过滤器时出错！`, error);
						failed++;
					}
				}
			}
			if (failed) {
				failures.set(site, failed);
			}
			console.log();
		} catch (e) {
			console.error(`访问${site}的API端口时出错！`, e);
		}
	}
	if (failures.size > 0) {
		let total = 0;
		for (const [site, failed] of failures) {
			console.error(`${site}：${failed} 个滥用过滤器解析失败！`);
			total += failed;
		}
		throw new Error(`共有 ${total} 个滥用过滤器解析失败！`);
	}
})();
