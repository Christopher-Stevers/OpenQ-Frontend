// Third party
import React, { useState, useContext } from 'react';
import { ethers } from 'ethers';

// Custom
import useWeb3 from '../../hooks/useWeb3';
import TokenFundBox from './SearchTokens/TokenFundBox';
import StoreContext from '../../store/Store/StoreContext';
import ButtonLoadingIcon from '../Loading/ButtonLoadingIcon';
import ToolTip from '../Utils/ToolTip';
import BountyClosed from '../BountyClosed/BountyClosed';
import ApproveTransferModal from './ApproveTransferModal';
import {
	RESTING,
	CONFIRM,
	APPROVING,
	TRANSFERRING,
	SUCCESS,
	ERROR
} from './ApproveTransferState';
import useIsOnCorrectNetwork from '../../hooks/useIsOnCorrectNetwork';

const FundPage = ({ bounty, refreshBounty }) => {
	const [volume, setVolume] = useState('');
	const [depositPeriodDays, setDepositPeriodDays] = useState(30);
	const [error, setError] = useState('');
	const [buttonText, setButtonText] = useState('Fund');
	const [, setSuccessMessage] = useState('');
	const [transactionHash, setTransactionHash] = useState(null);
	const [confirmationMessage, setConfirmationMessage] = useState('Please enter a volume greater than 0.');
	const [showApproveTransferModal, setShowApproveTransferModal] = useState(false);
	const [approveTransferState, setApproveTransferState] = useState(RESTING);
	const [isOnCorrectNetwork] = useIsOnCorrectNetwork();

	// Context
	const [appState] = useContext(StoreContext);
	const { library, account, } = useWeb3();

	// State
	const [token, setToken] = useState(appState.tokens[0]);

	const claimed = bounty.status == 'CLOSED';
	const loadingClosedOrZero = approveTransferState == CONFIRM || approveTransferState == APPROVING || approveTransferState == TRANSFERRING || claimed || parseFloat(volume) <= 0.00000001 || parseFloat(volume) >= 1000 || volume == '' || !account || !(parseInt(depositPeriodDays) > 0);
	const disableOrEnable = `${loadingClosedOrZero || !isOnCorrectNetwork ? 'confirm-btn-disabled cursor-not-allowed' : 'confirm-btn cursor-pointer'}`;
	const fundButtonClasses = `flex flex-row justify-center space-x-5 items-center py-3 text-lg text-white ${disableOrEnable}`;

	function resetState() {
		setApproveTransferState(RESTING);
	}

	// Methods
	async function fundBounty() {
		const volumeInWei = volume * 10 ** token.decimals;

		if (volumeInWei == 0) {
			setError({ title: 'Zero Volume Sent', message: 'Must send a greater than 0 volume of tokens.' });
			setApproveTransferState(ERROR);
			setButtonText('Fund');
			return;
		}

		const bigNumberVolumeInWei = ethers.BigNumber.from(volumeInWei.toString());

		let approveSucceeded = false;

		try {
			const callerBalance = await appState.openQClient.balanceOf(library, account, token.address);
			if (callerBalance.noSigner) {
				setError({ title: 'No wallet connected.', message:  'Please connect your wallet.'});
				setApproveTransferState(ERROR);
				return;
			} else if (callerBalance.lt(bigNumberVolumeInWei)) {
				setError({ title: 'Funds Too Low', message: 'You do not have sufficient funds for this deposit' });
				setApproveTransferState(ERROR);
				return;
			}
		} catch (error) {
			console.log(error);
			setError({ title:'Call Revert Exception', message: 'A contract call exception occurred. Please try again.'});
			setButtonText('Fund');
			setApproveTransferState(ERROR);
			return;
		}

		try {
			setShowApproveTransferModal(true);
			if (token.address != ethers.constants.AddressZero) {
				setButtonText('Approving');
				setApproveTransferState(APPROVING);
				await appState.openQClient.approve(
					library,
					bounty.bountyAddress,
					token.address,
					bigNumberVolumeInWei
				);
			}
			approveSucceeded = true;
		} catch (error) {
			console.log(error);
			const { message, title, link, linkText } = appState.openQClient.handleError(error, { bounty });
			setError({ message, title, link, linkText});
			setButtonText('Fund');
			setApproveTransferState(ERROR);
		}

		if (approveSucceeded) {
			setButtonText('Transferring');
			setApproveTransferState(TRANSFERRING);
			try {
				const fundTxnReceipt = await appState.openQClient.fundBounty(
					library,
					bounty.bountyId,
					token.address,
					bigNumberVolumeInWei,
					depositPeriodDays
				);
				setTransactionHash(fundTxnReceipt.transactionHash);
				setApproveTransferState(SUCCESS);
				setVolume('');
				setSuccessMessage(
					`Successfully funded issue ${bounty.url} with ${volume} ${token.symbol}!`
				);
				refreshBounty();
				try{
					await appState.githubBot.funded({ bountyId: bounty.bountyId, id: bounty.bountyAddress, deposit: { tokenAddress: ethers.utils.getAddress(token.address), tokenVolumes: bigNumberVolumeInWei.toString() } });
				}
				catch(e){
					console.log('bot not responding');
				}
				setButtonText('Fund');
			} catch (error) {
				const { message, title } = appState.openQClient.handleError(error, { bounty });
				setError({ message, title });
				setButtonText('Fund');
				setApproveTransferState(ERROR);
			}
		}
	}

	function onCurrencySelect(token) {
		setToken(token);
	}

	function onVolumeChange(volume) {
		const numberRegex = /^(\d+)?(\.)?(\d+)?$/;
		if (numberRegex.test(volume) || volume === '' || volume === '.') {
			setVolume(volume.match(numberRegex)[0]);
		}
	}
	const onDepositPeriodChanged = (e) => {
		if (parseInt(e.target.value) >= 0) setDepositPeriodDays(parseInt(e.target.value));
		if (e.target.value === '') setDepositPeriodDays('0');
	};

	// Render
	return (<>{claimed ?
		<BountyClosed bounty={bounty} />:
		<div className="flex flex-1 font-mont justify-center items-center">
			<div className="flex flex-col space-y-5 w-5/6">
				<div className="flex text-3xl font-semibold text-white justify-center pt-16">
						Fund Bounty
				</div>

				<TokenFundBox
					onCurrencySelect={onCurrencySelect}
					onVolumeChange={onVolumeChange}
					token={token}
					volume={volume}
				/>

				<div className="flex w-full flex-row justify-between items-center px-4 py-3 rounded-lg py-1 bg-dark-mode border border-web-gray text-white">
					<div className='text-white flex items-center gap-3 w-full'>
						<ToolTip customOffsets={[-192, -142]} outerStyles={''} mobileX={10} toolTipText={'This is the number of days that your deposit will be in escrow. After this many days, you\'re deposit will be fully refundable if the bounty has still not been claimed.'} >
							<div className='cursor-help rounded-full border-2 border-web-gray aspect-square leading-6 h-6 box-content text-center font-bold text-web-gray'>?</div>
						</ToolTip>
						<span>Deposit Locked Period</span>
					</div>

					<div className={'px-4 font-bold fundBox-amount bg-dark-mode'}>
						<input
							className="font-semibold text-right text-white/60 text-2xl number outline-none bg-dark-mode w-full flex-1"
							autoComplete="off"
							value={depositPeriodDays}
							id="deposit-period"
							onChange={onDepositPeriodChanged}
						/>
					</div>
				</div>

				<ToolTip hideToolTip={account && isOnCorrectNetwork && !loadingClosedOrZero}
					toolTipText={
						account && isOnCorrectNetwork && !(depositPeriodDays > 0) ?
							'Please indicate how many days you\'d like to fund your bounty for.' :
							account && isOnCorrectNetwork ?
								'Please indicate the volume you\'d like to fund with. Must be between 0.0000001 and 1000.' :
								account ?
									'Please switch to the correct network to fund this bounty.' :
									'Connect your wallet to fund this bounty!'}
					customOffsets={
						[0, 54]}>
					<button
						className={fundButtonClasses}
						disabled={loadingClosedOrZero || !isOnCorrectNetwork}
						type="button"
						onClick={() => {
							setConfirmationMessage(
								`You are about to fund this bounty at address ${bounty.bountyAddress.substring(
									0,
									12
								)}...${bounty.bountyAddress.substring(32)} with ${volume} ${token.name
								}.
									
									This will be refundable after ${depositPeriodDays} ${depositPeriodDays == 1 ? 'day' : 'days'}.
									
									Is this correct?`
							);
							setApproveTransferState(CONFIRM);
							setShowApproveTransferModal(true);
						}}
					>
						<div>{buttonText}</div>
						<div>{approveTransferState != RESTING && approveTransferState != SUCCESS && approveTransferState != ERROR ? (
							<ButtonLoadingIcon />
						) : null}</div>
					</button>
				</ToolTip>
			</div>

			{showApproveTransferModal && <ApproveTransferModal
				approveTransferState={approveTransferState}
				address={account}
				transactionHash={transactionHash}
				confirmationMessage={confirmationMessage}
				error={error}
				setShowApproveTransferModal={setShowApproveTransferModal}
				positiveOption={'Confirm'}
				confirmMethod={fundBounty}
				resetState={resetState}
			/>}
		</div>}</>
	);
};

export default FundPage;
