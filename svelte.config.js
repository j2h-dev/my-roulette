// static을 auto로 바꿉니다!
import adapter from '@sveltejs/adapter-auto'; 
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto는 Vercel을 감지해서 알아서 최적의 설정을 해줍니다.
		adapter: adapter()
	}
};

export default config;
