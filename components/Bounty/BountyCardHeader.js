// Third party
import React from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

// Custom

const BountyCardHeader = ({ bounty }) => {

	return (
		<div className="flex flex-row space-x-20 justify-between">
			<div className="flex flex-col">
				<div className="text-xl text-white">
					{bounty ? `${bounty.owner}/${bounty.repoName}` : <Skeleton width={'10rem'} />}
				</div>
				<div className="text-xl font-bold text-white">{bounty?.title || <Skeleton width={'10rem'} />}</div>
			</div>
			{bounty ?
				<div>
					<Image src={bounty.avatarUrl} alt="avatarUrl" width="51" height="51" />
				</div> : null
			}
		</div>
	);
};

export default BountyCardHeader;
