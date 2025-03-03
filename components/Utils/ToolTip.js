// Thrid Party

import React, { useState } from 'react';

const ToolTip = (props)=>{
	const {toolTipText, customOffsets, styles, mobileX } = props;
	const [x, updateX]= useState(customOffsets[0]);
	const [, y] = customOffsets;
	const setToolTip = () =>{
		if(window.innerWidth<750 && mobileX) updateX(mobileX);
		else updateX(customOffsets[0]);
	};
	if(props.hideToolTip) return props.children;
	return (
		<div className={`relative group rounded-full ${props.outerStyles}`} onMouseEnter={setToolTip}>
			{props.children}
			<div style={{left: x, top: y}} className={`flex justify-center absolute hidden z-10 group-hover:block justify-items-center w-full h-3 pt-0.5 ${mobileX === x ? 'w-72' : styles} min-w-[200px]`}>
				<div className='text-white bg-dark-mode h-min border-web-gray border rounded-md p-2 z-20'>
					<div >{toolTipText}</div>
				</div>
			</div>
		</div>
	);
};

export default ToolTip;