import React from 'react';
import Link from 'next//link';

const PageNotFound = () =>{


	return <div className='flex fixed inset-0 justify-center items-center text-white h-screen'>
		<div className='text-2xl'>404: Page not found. <span className="underline"><Link href={'/'}>Go home</Link>
		</span>
	.</div>
	</div>;
};
export default PageNotFound;