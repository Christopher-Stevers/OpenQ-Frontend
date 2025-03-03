// Third party
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useRouter } from 'next/router';

// Custom
import useWeb3 from '../../hooks/useWeb3';
import StoreContext from '../../store/Store/StoreContext';
import BountyAlreadyMintedMessage from './BountyAlreadyMintedMessage';
import ToolTip from '../Utils/ToolTip';
import MintBountyModalButton from './MintBountyModalButton';
import MintBountyHeader from './MintBountyHeader';
import MintBountyInput from './MintBountyInput';
import ErrorModal from '../ConfirmErrorSuccessModals/ErrorModal';
import useIsOnCorrectNetwork from '../../hooks/useIsOnCorrectNetwork';

const MintBountyModal = ({ modalVisibility }) => {
	// Context
	const [appState] = useContext(StoreContext);
	const { library,  account } = useWeb3();
	const router = useRouter();

	// State
	const [isOnCorrectNetwork] = useIsOnCorrectNetwork();
	const [issue, setIssue] = useState();
	const [url, setUrl] = useState();
	const [bountyAddress, setBountyAddress] = useState();
	const [isLoading, setIsLoading] = useState();
	const [error, setError] = useState();
	const [claimed, setClaimed] = useState();
	const isValidUrl = appState.utils.issurUrlRegex(url);
	const enableMint = true;
	console.log(claimed);
	
	// Refs
	const modal = useRef();

	const setIssueUrl = async(issueUrl)=>{
		let didCancel = false;
		setUrl(issueUrl);
		let issueUrlIsValid = appState.utils.issurUrlRegex(issueUrl);
		if (issueUrlIsValid && !didCancel) {
			
			async function fetchIssue() {
				try {
					const data = await appState.githubRepository.fetchIssueByUrl(issueUrl);
					if(!didCancel){
						setIssue(data);}
					return data;
				} catch (error) {
					if(!didCancel)	{
						setIssue(false);}
				}
			}
			const issueData = await fetchIssue();

			if(issueData){
				try {
					let bounty = await appState.openQSubgraphClient.getBountyByGithubId(
						issueData.id,
					);
					setClaimed(bounty.status === 'CLOSED');
					if (bounty) {
						setBountyAddress(bounty.bountyAddress);
					} else {
						setBountyAddress();
					}
					
				} catch (error) {
					setError(error);
				}
			}

		}
		return (()=>{
			didCancel = true;
		});
	};

	const mintBounty = async() => {
		try {
			setIsLoading();
			const { bountyAddress } = await appState.openQClient.mintBounty(
				library,
				issue.id,
				issue.repository.owner.id,
			);
			await sleep(1000);

			sessionStorage.setItem('justMinted', true);
			try {
				appState.githubBot.created({ bountyId: issue.id, id: bountyAddress });
			}
			catch (e) {
				console.log('bot not responding');
			}
			/* 
			router.push(
				`${process.env.NEXT_PUBLIC_BASE_URL}/bounty/${bountyAddress}`
			);istanbul ignore next */
		} catch (error) {
			console.log('error in mintbounty', error);
			const { message, title } = appState.openQClient.handleError(error);
			setError({ message, title });
		}
		setIsLoading();
	};

	const closeModal = () => {
		setIssue();
		setUrl();
		setBountyAddress();
		setIsLoading();
		setError();
		modalVisibility(false);
	};
	
	useEffect(() => {
		// Courtesy of https://stackoverflow.com/questions/32553158/detect-click-outside-react-component
		function handleClickOutside(event) {
			if (modal.current && !modal.current.contains(event.target)) {
				modalVisibility(false);
			}
		}

		// Bind the event listener
		if (!isLoading) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			// Unbind the event listener on clean up
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [modal, isLoading]);

	// Methods
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}	// Render
	return (
		<div className="flex justify-center items-center font-mont overflow-x-hidden overflow-y-auto fixed inset-0 outline-none z-50 focus:outline-none p-5">
			{error ?
				<ErrorModal
					setShowErrorModal={closeModal}
					error={error}
				/> :
				<>
					<div ref={modal} className="md:w-1/2 lg:w-1/3 xl:w-1/4 space-y-5 z-50">
						<div className="w-full">
							<div className="border-0 rounded-xl shadow-lg flex flex-col bg-dark-mode outline-none focus:outline-none z-11">
								<MintBountyHeader />
								<div className="flex flex-col pl-6 pr-6 space-y-2">
									<MintBountyInput
										setIssueUrl={setIssueUrl}
										issueData={issue}
										isValidUrl={isValidUrl}
									/>
								</div>
								{isValidUrl && !issue &&
									<div className="pl-10 pt-5 text-white">
										Github Issue not found
									</div>}
								<div className="flex flex-col justify-center space-x-1 px-8">
									{isValidUrl && issue?.closed &&
										<div className="pt-3 text-white">
											This issue is already closed on GitHub
										</div>}
									{isValidUrl && bountyAddress && issue &&
										<BountyAlreadyMintedMessage claimed={claimed} bountyAddress={bountyAddress} />}
								</div>

								<ToolTip
									hideToolTip={(enableMint && isOnCorrectNetwork) || isLoading}
									toolTipText={
										account && isOnCorrectNetwork ?
											'Please choose an elgible issue.' :
											account ?
												'Please switch to the correct network to mint a bounty.' :
												'Connect your wallet to mint a bounty!'}
									customOffsets={[0, 70]}>
									<div className="flex items-center justify-center p-5 rounded-b w-full">
										<MintBountyModalButton
											mintBounty={mintBounty}
											enableMint={enableMint && isOnCorrectNetwork}
											transactionPending={isLoading}
										/>
									</div>
								</ToolTip>
							</div>
						</div>
					</div>
					<div className="bg-overlay fixed inset-0 z-10"></div>
				</>}
		</div>
	);
};

export default MintBountyModal;
