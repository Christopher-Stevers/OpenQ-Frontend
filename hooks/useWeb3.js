import { useWeb3React } from '@web3-react/core';

// This is a lightweight wrapper of web3React which allows the frontend to run in local mode without attempting to connect to any localhost chain
const useWeb3 = () => {
	if (process.env.NEXT_PUBLIC_DEPLOY_ENV == 'local') {
		return { library: {}, account: '0xsdf88g8g8', active: true, chainId: 31337, activate: () => { } };
	} else {
		const { library, account, active, activate, chainId, deactivate } = useWeb3React();

		return { library, account, active, activate, chainId, deactivate };
	}
};

export default useWeb3;