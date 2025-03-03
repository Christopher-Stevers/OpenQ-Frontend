// Third party
import React, { useState, useEffect, useRef } from 'react';
import jazzicon from '@metamask/jazzicon';
// Custom
import useWeb3 from '../../hooks/useWeb3';
import { injected } from './connectors';
import useConnectOnLoad from '../../hooks/useConnectOnLoad';
import chainIdDeployEnvMap from './chainIdDeployEnvMap';
import AccountModal from './AccountModal';
import useEns from '../../hooks/useENS';
import useIsOnCorrectNetwork from '../../hooks/useIsOnCorrectNetwork';

const MobileConnectButton = () => {
	// State
	const [isConnecting, setIsConnecting] = useState(false);
	const [isOnCorrectNetwork] = useIsOnCorrectNetwork();
	const [showModal, setShowModal] = useState();
	const modalRef = useRef();
	const buttonRef = useRef();
	const iconWrapper = useRef();
	// Context
	const { chainId, account, activate, active, deactivate } = useWeb3();
	const [ensName] = useEns(account);

	// Hooks
	useConnectOnLoad()(); // See [useEagerConnect](../../hooks/useEagerConnect.js)

	useEffect(() => {
		if (!active) { setIsConnecting(false); }
	}, [active]);

	useEffect(() => {
		if (account && iconWrapper.current) {
			iconWrapper.current.innerHTML = '';
			iconWrapper.current.appendChild(jazzicon(32, parseInt(account.slice(2, 10), 16)));
		}
	}, [account, isOnCorrectNetwork, isConnecting]);

	useEffect(() => {
		let handler = (event) => {
			if (!modalRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) {
				setShowModal(false);
			}
		};
		window.addEventListener('mousedown', handler);

		return () => {
			window.removeEventListener('mousedown', handler);
		};
	});
	// Methods
	const onClickConnect = async () => {
		setIsConnecting(true);
		await activate(injected);
		setIsConnecting(false);
	};

	const addOrSwitchNetwork = () => {
		window.ethereum
			.request({
				method: 'wallet_addEthereumChain',
				params:
					chainIdDeployEnvMap[process.env.NEXT_PUBLIC_DEPLOY_ENV]['params'],
			})
			.catch((error) => console.log('Error', error.message));
	};

	// Render
	if (account && isOnCorrectNetwork && isConnecting !== true) {
		// const firstThree = account.slice(0, 5);
		// const lastThree = account.slice(-3);
		return (
			<div className='h-8'>
				<button ref={buttonRef}
					onClick={() => setShowModal(() => !showModal)}>

					<div ref={iconWrapper}></div>
				</button>
				{(showModal) &&
					<AccountModal
						domRef={modalRef}
						ensName={ensName}
						account={account}
						chainId={chainId}
						deactivate={deactivate}
						setIsConnecting={setIsConnecting} />}
			</div>
		);
	} else if (account && isConnecting !== true) {
		return (
			<div>
				<button
					className='text-pink-300 h-10 px-2 text-xs border border-inactive-accent rounded-lg bg-dark-mode font-bold'
					onClick={addOrSwitchNetwork}>
					Use{' '}
					{
						chainIdDeployEnvMap[process.env.NEXT_PUBLIC_DEPLOY_ENV][
							'networkName'
						]
					}{' '}
					Network
				</button>
			</div>
		);
	} else {
		return (
			<button
				className='text-white flex items-center gap-2 text-xs border border-inactive-accent rounded-lg px-2 h-10 bg-dark-mode font-semibold'
				onClick={onClickConnect}>
				<span className='font-bold'>{isConnecting ? 'Connecting...' : 'Connect '}</span>
				<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
					<path d="M14 5.5V2.5C14 2.23478 13.8946 1.98043 13.7071 1.79289C13.5196 1.60536 13.2652 1.5 13 1.5H3C2.46957 1.5 1.96086 1.71071 1.58579 2.08579C1.21071 2.46086 1 2.96957 1 3.5M1 3.5C1 4.03043 1.21071 4.53914 1.58579 4.91421C1.96086 5.28929 2.46957 5.5 3 5.5H15C15.2652 5.5 15.5196 5.60536 15.7071 5.79289C15.8946 5.98043 16 6.23478 16 6.5V9.5M1 3.5V15.5C1 16.0304 1.21071 16.5391 1.58579 16.9142C1.96086 17.2893 2.46957 17.5 3 17.5H15C15.2652 17.5 15.5196 17.3946 15.7071 17.2071C15.8946 17.0196 16 16.7652 16 16.5V13.5" stroke="url(#wallet_gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">

					</path>
					<path d="M17 9.5V13.5H13C12.4696 13.5 11.9609 13.2893 11.5858 12.9142C11.2107 12.5391 11 12.0304 11 11.5C11 10.9696 11.2107 10.4609 11.5858 10.0858C11.9609 9.71071 12.4696 9.5 13 9.5H17Z" stroke="url(#wallet_gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					</path>
					<defs>
						<linearGradient id="wallet_gradient" x1="8.5" y1="-6.5" x2="-7.46674" y2="8.46881" gradientUnits="userSpaceOnUse">
							<stop stopColor="#4633cc"></stop>
							<stop offset="1" stopColor="#9e3166"></stop>
						</linearGradient>
						<linearGradient id="wallet_gradient" x1="14" y1="7.5" x2="10.3077" y2="13.0385" gradientUnits="userSpaceOnUse">
							<stop stopColor="#9e3166"></stop>
							<stop offset="1" stopColor="#9e3166"></stop>
						</linearGradient>
					</defs>
				</svg>


			</button>
		);
	}
};

export default MobileConnectButton;
